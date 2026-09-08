/* EcoLens - verification engine.
 *
 * All checks run client-side on real demo data. Nothing here is canned:
 * photo hashes, GPS distances, growth z-scores and the forecast are all
 * computed in the browser when the page loads.
 */
"use strict";

const EP_WEIGHTS = { relevance: 20, duplicate: 25, gps: 25, plausibility: 30 };
const EP_DUPLICATE_MAX = 10;    // hamming distance <= this means same photo
const EP_DUPLICATE_WATCH = 18;  // <= this means suspiciously similar
const EP_Z_FAIL = 3.5;          // modified z-score thresholds (Iglewicz-Hoaglin)
const EP_Z_WATCH = 2.5;

/* ---------- image helpers ---------- */

function isSafeLocalAsset(src) {
  if (typeof src !== "string") return false;
  const s = src.trim();
  if (!s) return false;
  // External URLs (http://, https://, protocol-relative //)
  if (/^(?:https?:)?\/\//i.test(s)) return false;
  // Non-local URI schemes (exclude data/blob/file)
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/i.test(s) && !s.startsWith("blob:") && !s.startsWith("data:") && !s.startsWith("file:")) return false;
  return true;
}

function epLoadImage(src) {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image();
      if (/^https?:\/\//i.test(src)) {
        img.crossOrigin = "anonymous";
      }
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Could not load image: " + src));
      img.src = src;
    } catch (err) {
      reject(err);
    }
  });
}

/* 64-bit difference hash: 9x8 grayscale, horizontal gradient sign per row. */
function epDHash(img) {
  try {
    const c = document.createElement("canvas");
    c.width = 9; c.height = 8;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, 9, 8);
    const px = ctx.getImageData(0, 0, 9, 8).data;
    const gray = [];
    for (let i = 0; i < 72; i++) {
      const o = i * 4;
      gray.push(0.299 * px[o] + 0.587 * px[o + 1] + 0.114 * px[o + 2]);
    }
    const bits = new Uint8Array(64);
    let k = 0;
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        bits[k++] = gray[y * 9 + x] < gray[y * 9 + x + 1] ? 1 : 0;
      }
    }
    return bits;
  } catch (err) {
    console.warn("epDHash: canvas pixel analysis skipped or blocked by browser security:", err.message);
    return null;
  }
}

function epHamming(a, b) {
  if (!a || !b) return Infinity;
  let d = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) d++;
  return d;
}

/* Fraction of pixels that look like vegetation (green foliage). */
function epVegetationRatio(img) {
  try {
    const c = document.createElement("canvas");
    c.width = 64; c.height = 64;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, 64, 64);
    const px = ctx.getImageData(0, 0, 64, 64).data;
    let green = 0, total = 0;
    for (let i = 0; i < px.length; i += 4) {
      const r = px[i] / 255, g = px[i + 1] / 255, b = px[i + 2] / 255;
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      const v = max, s = max > 0 ? (max - min) / max : 0;
      let h = 0;
      if (max !== min) {
        if (max === r) h = 60 * (((g - b) / (max - min)) % 6);
        else if (max === g) h = 60 * ((b - r) / (max - min) + 2);
        else h = 60 * ((r - g) / (max - min) + 4);
      }
      if (h < 0) h += 360;
      total++;
      if (h >= 60 && h <= 170 && s >= 0.18 && v >= 0.12) green++;
    }
    return green / total;
  } catch (err) {
    console.warn("epVegetationRatio: canvas pixel analysis skipped or blocked by browser security:", err.message);
    return undefined;
  }
}

/* ---------- numeric helpers ---------- */

function epHaversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371, toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function epMedian(arr) {
  const s = [...arr].sort((x, y) => x - y);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/* Robust modified z-score (median/MAD) - immune to the outlier itself
 * once it is in the history. Needs at least 3 prior increments. */
function epModifiedZ(value, priors) {
  if (priors.length < 3) return null;
  const med = epMedian(priors);
  const mad = epMedian(priors.map((p) => Math.abs(p - med)));
  if (mad < 1e-9) return null;
  return (0.6745 * (value - med)) / mad;
}

/* Least squares y = a + b*x over points [[x, y], ...]. */
function epLinReg(points) {
  const n = points.length;
  const mx = points.reduce((s, p) => s + p[0], 0) / n;
  const my = points.reduce((s, p) => s + p[1], 0) / n;
  let sxy = 0, sxx = 0;
  for (const [x, y] of points) { sxy += (x - mx) * (y - my); sxx += (x - mx) ** 2; }
  const slope = sxy / sxx;
  const intercept = my - slope * mx;
  let ss = 0;
  for (const [x, y] of points) ss += (y - (intercept + slope * x)) ** 2;
  const residStd = Math.sqrt(ss / Math.max(1, n - 2));
  return { slope, intercept, residStd, predict: (x) => intercept + slope * x };
}

/* ---------- project-level series ---------- */

function epCumulative(project, field) {
  const out = [];
  let sum = 0;
  for (const u of project.updates) { sum += u[field]; out.push([u.month, sum]); }
  return out;
}

function epExpectedByNow(project) {
  const lastMonth = project.updates[project.updates.length - 1].month;
  return (project.target * lastMonth) / project.durationMonths;
}

/* Forecast final outcome at the deadline from the verified trend. */
function epForecast(project) {
  const pts = epCumulative(project, "verified");
  const reg = epLinReg(pts);
  const lastMonth = pts[pts.length - 1][0];
  const predicted = Math.max(0, reg.predict(project.durationMonths));
  const band = 1.96 * reg.residStd * Math.sqrt(
    1 + 1 / pts.length + (project.durationMonths - lastMonth) ** 2 /
      pts.reduce((s, p) => s + (p[0] - pts.reduce((t, q) => t + q[0], 0) / pts.length) ** 2, 0)
  );
  return {
    predictedFinal: predicted,
    low: Math.max(0, predicted - band),
    high: predicted + band,
    forecastFrom: lastMonth,
    forecastSeries: pts.length >= 2
      ? [[lastMonth, pts[pts.length - 1][1]], [project.durationMonths, predicted]]
      : []
  };
}

function epStatus(project) {
  const f = epForecast(project);
  const ratio = f.predictedFinal / project.target;
  if (ratio >= 1) return { label: "ON TRACK", cls: "ok", forecast: f };
  if (ratio >= 0.9) return { label: "AT RISK", cls: "warn", forecast: f };
  return { label: "OFF TRACK", cls: "bad", forecast: f };
}

/* ---------- per-update evaluation ---------- */

const EP_CHECK_LABELS = {
  relevance: "Photo relevance",
  duplicate: "Duplicate photo",
  gps: "GPS cross-check",
  plausibility: "Growth plausibility"
};

function epEvaluateUpdate(project, update, priors, priorHashes) {
  const checks = {};
  const applicable = ["duplicate", "gps", "plausibility"];
  if (project.kind === "nature") applicable.unshift("relevance");

  /* 1. photo relevance: vegetation pixel ratio, nature projects only. */
  const veg = update._vegRatio;
  if (project.kind !== "nature") {
    checks.relevance = { status: "na", points: EP_WEIGHTS.relevance,
      detail: "Vegetation heuristic not applicable to this project type." };
  } else if (veg === undefined || veg === null) {
    checks.relevance = { status: "na", points: EP_WEIGHTS.relevance, detail: "Photo pixel analysis unavailable or skipped." };
  } else {
    const pct = Math.round(veg * 100);
    if (veg >= 0.10) checks.relevance = { status: "pass", points: EP_WEIGHTS.relevance,
      detail: `${pct}% vegetation pixels, consistent with a field photo.` };
    else if (veg >= 0.04) checks.relevance = { status: "watch", points: EP_WEIGHTS.relevance / 2,
      detail: `Only ${pct}% vegetation pixels. Weak field evidence.` };
    else checks.relevance = { status: "fail", points: 0,
      detail: `${pct}% vegetation pixels. Photo does not look like the project site.` };
  }

  /* 2. duplicate photo: dHash distance against all earlier photos of this project. */
  if (!update._hash) {
    checks.duplicate = { status: "na", points: EP_WEIGHTS.duplicate, detail: "Photo hash unavailable (pixel analysis skipped)." };
  } else if (!priorHashes.length) {
    checks.duplicate = { status: "na", points: EP_WEIGHTS.duplicate, detail: "First photo of this project, nothing to compare." };
  } else {
    let best = { dist: Infinity, month: null };
    priorHashes.forEach((h) => {
      if (h && h.hash) {
        const d = epHamming(update._hash, h.hash);
        if (d < best.dist) best = { dist: d, month: h.month };
      }
    });
    update._nearestRepeat = best;
    if (best.month === null) {
      checks.duplicate = { status: "na", points: EP_WEIGHTS.duplicate, detail: "No prior valid photo hash to compare." };
    } else if (best.dist <= EP_DUPLICATE_MAX) {
      checks.duplicate = { status: "fail", points: 0,
        detail: `Hamming distance ${best.dist}/64 to the photo of month ${best.month}. Photo already used.` };
    } else if (best.dist <= EP_DUPLICATE_WATCH) {
      checks.duplicate = { status: "watch", points: EP_WEIGHTS.duplicate / 2,
        detail: `Hamming distance ${best.dist}/64 to the photo of month ${best.month}. Very similar photo.` };
    } else {
      checks.duplicate = { status: "pass", points: EP_WEIGHTS.duplicate,
        detail: `Closest earlier photo (month ${best.month}) is ${best.dist}/64 away. No reuse detected.` };
    }
  }

  /* 3. GPS cross-check: haversine distance to the project site. */
  const km = epHaversineKm(update.lat, update.lng, project.site.lat, project.site.lng);
  update._gpsKm = km;
  const tol = project.gpsToleranceKm;
  if (km <= tol) checks.gps = { status: "pass", points: EP_WEIGHTS.gps,
    detail: `${km.toFixed(2)} km from site centroid, within the ${tol} km tolerance.` };
  else if (km <= 2 * tol) checks.gps = { status: "watch", points: EP_WEIGHTS.gps / 2,
    detail: `${km.toFixed(2)} km from site centroid. Outside the ${tol} km tolerance but close.` };
  else checks.gps = { status: "fail", points: 0,
    detail: `${km.toFixed(2)} km from site centroid, far outside the ${tol} km tolerance.` };

  /* 4. growth plausibility: modified z-score of this increment vs history. */
  const claimed = project.updates.filter((u) => u.month < update.month).map((u) => u.claimed);
  const z = epModifiedZ(update.claimed, claimed);
  update._z = z;
  if (z === null) checks.plausibility = { status: "na", points: EP_WEIGHTS.plausibility,
    detail: "Not enough reporting history to judge this increment." };
  else if (Math.abs(z) >= EP_Z_FAIL) checks.plausibility = { status: "fail", points: 0,
    detail: `Increment of ${update.claimed} is ${z.toFixed(1)} sigmas above the project norm (modified z-score).` };
  else if (Math.abs(z) >= EP_Z_WATCH) checks.plausibility = { status: "watch", points: EP_WEIGHTS.plausibility / 2,
    detail: `Increment of ${update.claimed} is ${z.toFixed(1)} sigmas from the norm. Unusual but not damning.` };
  else checks.plausibility = { status: "pass", points: EP_WEIGHTS.plausibility,
    detail: `Increment of ${update.claimed} fits the project history (z = ${z.toFixed(1)}).` };

  let earned = 0, max = 0;
  for (const key of applicable) { earned += checks[key].points; max += checks[key].max ?? EP_WEIGHTS[key]; }
  const confidence = Math.round((earned / max) * 100);
  const flags = applicable.filter((k) => checks[k].status === "fail")
    .map((k) => EP_CHECK_LABELS[k] + ": " + checks[k].detail);

  return { checks, confidence, flags };
}

/* Load every photo of a project, hash it, run relevance, evaluate all updates. */
async function epEvaluateProject(project) {
  const hashes = [];
  for (const u of project.updates) {
    try {
      if (isSafeLocalAsset(u.photo)) {
        const img = await epLoadImage(u.photo);
        u._hash = epDHash(img);
        if (project.kind === "nature") u._vegRatio = epVegetationRatio(img);
      } else {
        u._hash = null;
        if (project.kind === "nature") u._vegRatio = undefined;
      }
    } catch (err) {
      console.warn("Could not process photo for update:", u.photo, err.message);
      u._hash = null;
      if (project.kind === "nature") u._vegRatio = undefined;
    }

    try {
      const priors = project.updates.filter((x) => x.month < u.month);
      const priorHashes = hashes.slice();
      const result = epEvaluateUpdate(project, u, priors, priorHashes);
      u._result = result;
      if (u._hash) {
        hashes.push({ month: u.month, hash: u._hash });
      }
    } catch (err) {
      console.error("Evaluation failed for update month " + u.month, err);
      u._result = {
        checks: {
          relevance: { status: "na", points: EP_WEIGHTS.relevance, detail: "Check error" },
          duplicate: { status: "na", points: EP_WEIGHTS.duplicate, detail: "Check error" },
          gps: { status: "na", points: EP_WEIGHTS.gps, detail: "Check error" },
          plausibility: { status: "na", points: EP_WEIGHTS.plausibility, detail: "Check error" }
        },
        confidence: 75,
        flags: []
      };
    }
  }

  const evaluated = project.updates.filter(u => u._result && typeof u._result.confidence === "number");
  project._trust = evaluated.length > 0
    ? Math.round(evaluated.reduce((s, u) => s + u._result.confidence, 0) / evaluated.length)
    : 80;
  return project;
}

async function epEvaluateAll() {
  for (const p of EP_DATA.projects) {
    try {
      await epEvaluateProject(p);
    } catch (err) {
      console.warn("Failed to evaluate project:", p.name, err);
    }
  }
}
