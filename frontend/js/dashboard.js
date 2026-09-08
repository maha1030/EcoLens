/**
 * EcoLens - Live Demo Dashboard & Verification Controller
 *
 * Consumes EcoLensAPI (js/api.js) to render interactive project cards,
 * dynamic expected-vs-actual charts (Chart.js), metric tiles, and audit feeds.
 *
 * BACKEND INTEGRATION NOTE:
 * All data flows through EcoLensAPI. To connect a real backend, update
 * api.js functions and set EcoLensConfig.USE_MOCK = false in config.js.
 */
"use strict";

const epFmt = (p, v) => typeof EcoLensUI !== "undefined"
  ? EcoLensUI.formatValue(v, p.unit)
  : (p.unit === "trees"
    ? Math.round(v).toLocaleString("en-US")
    : (Math.round(v * 10) / 10).toLocaleString("en-US"));

const epShortUnit = (p) => typeof EcoLensUI !== "undefined"
  ? EcoLensUI.shortUnit(p.unit)
  : (p.unit === "trees" ? "trees" : p.unit === "hectares" ? "ha" : "%");

const EP_CHIP = {
  pass: { cls: "chip-pass", word: "PASS" },
  watch: { cls: "chip-watch", word: "WATCH" },
  fail: { cls: "chip-fail", word: "FLAG" },
  na: { cls: "chip-na", word: "N/A" }
};

const EP_CHECK_LABELS = {
  relevance: "Photo relevance",
  duplicate: "Duplicate photo",
  gps: "GPS cross-check",
  plausibility: "Growth plausibility"
};

let epChart = null;
let epActiveId = null;
let epAllProjects = [];

/* ---------- Skeleton Loading ---------- */

function epRenderSkeleton() {
  const cards = document.getElementById("ep-cards");
  if (cards) {
    cards.innerHTML = `
      <div class="ep-skeleton ep-skeleton-card"></div>
      <div class="ep-skeleton ep-skeleton-card"></div>
      <div class="ep-skeleton ep-skeleton-card"></div>`;
  }
  const panel = document.querySelector(".ep-panel");
  if (panel) {
    panel.innerHTML = `
      <div style="padding:24px;">
        <div class="ep-skeleton ep-skeleton-text"></div>
        <div class="ep-skeleton ep-skeleton-text short"></div>
        <div class="ep-skeleton ep-skeleton-text" style="margin-top:24px;height:200px;width:100%;"></div>
      </div>`;
  }
}

/* ---------- Error States ---------- */

function epRenderDashboardError(message) {
  const cards = document.getElementById("ep-cards");
  if (cards) cards.innerHTML = "";
  const panel = document.querySelector(".ep-panel");
  if (panel) {
    panel.innerHTML = `
      <div class="ep-error-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <h3>Dashboard unavailable</h3>
        <p>${message}</p>
        <button class="btn btn-primary" onclick="location.reload()">Try again</button>
      </div>`;
  }
}

function epRenderDetailError(message) {
  const banner = document.getElementById("ep-banner");
  if (banner) {
    banner.className = "ep-error-inline";
    banner.innerHTML = `<strong>Error:</strong> ${message}`;
  }
}

function epRenderChartError() {
  const chartCanvas = document.getElementById("ep-chart");
  if (chartCanvas) {
    const parent = chartCanvas.parentElement;
    parent.innerHTML = `<div class="ep-error-inline" style="margin:24px;">Chart unavailable. Try selecting another project.</div>`;
  }
}

/* ---------- Project Cards ---------- */

function epRenderCards(projects) {
  const wrap = document.getElementById("ep-cards");
  if (!wrap) return;
  wrap.innerHTML = "";

  projects.forEach((p) => {
    const st = p.status;
    const verified = p.verified;
    const expected = p.expected;
    const card = document.createElement("button");
    card.className = "ep-card" + (p.id === epActiveId ? " ep-card-active" : "");
    card.setAttribute("aria-pressed", p.id === epActiveId ? "true" : "false");
    card.innerHTML = `
      <div class="ep-card-top">
        <span class="ep-card-name">${p.name}</span>
        <span class="ep-status ${st.cls}">${st.label}</span>
      </div>
      <div class="ep-card-org">${p.org}</div>
      <div class="ep-card-bar">
        <div class="ep-card-fill" style="width:${Math.min(100, (verified / p.target) * 100)}%"></div>
        <div class="ep-card-tick" style="left:${Math.min(100, (expected / p.target) * 100)}%" title="Expected by now"></div>
      </div>
      <div class="ep-card-meta">
        <span><strong>${epFmt(p, verified)}</strong> / ${epFmt(p, p.target)} ${epShortUnit(p)}</span>
        <span>trust ${p.trust}%</span>
      </div>`;
    card.addEventListener("click", () => epSelect(p.id));
    wrap.appendChild(card);
  });
}

/* ---------- Detail Panel ---------- */

async function epSelect(id) {
  epActiveId = id;
  if (epAllProjects.length) {
    epRenderCards(epAllProjects);
  }

  try {
    const p = await EcoLensAPI.getProjectById(id);
    epRenderDetail(p);
  } catch (err) {
    console.error("Failed to load project details:", err);
    epRenderDetailError("Could not load project details. " + err.message);
  }
}

function epRenderDetail(p) {
  const title = document.getElementById("ep-detail-title");
  if (!title) return;

  const st = p.status;
  const verified = p.verified;
  const expected = p.expected;
  const gap = p.gap;
  const f = p.forecast;
  const ahead = gap <= 0;

  title.textContent = p.name;
  document.getElementById("ep-detail-site").textContent =
    `${p.org} \u00b7 ${p.site.name} \u00b7 promise: ${epFmt(p, p.target)} ${p.unit} in ${p.durationMonths} months (deadline ${p.deadline})`;

  const banner = document.getElementById("ep-banner");
  banner.className = "ep-banner ep-banner-" + st.cls;
  banner.innerHTML = st.label === "ON TRACK"
    ? `<strong>Projected to finish at ~${epFmt(p, f.predictedFinal)} ${epShortUnit(p)}</strong> against a promise of ${epFmt(p, p.target)} ${epShortUnit(p)}. ${ahead ? "Ahead of the promised trajectory." : "On the promised trajectory."}`
    : `<strong>${st.label}:</strong> the verified trend projects ~${epFmt(p, f.predictedFinal)} ${epShortUnit(p)} by the deadline, a shortfall of ~${epFmt(p, p.target - f.predictedFinal)} ${epShortUnit(p)} against the promise of ${epFmt(p, p.target)}.`;

  const tiles = document.getElementById("ep-tiles");
  const lastMonth = p.updates[p.updates.length - 1].month;
  tiles.innerHTML = `
    <div class="ep-tile"><div class="ep-tile-num">${epFmt(p, verified)}</div>
      <div class="ep-tile-label">verified ${epShortUnit(p)} to date (month ${lastMonth})</div></div>
    <div class="ep-tile"><div class="ep-tile-num">${epFmt(p, expected)}</div>
      <div class="ep-tile-label">expected by now on the promised line</div></div>
    <div class="ep-tile ep-tile-${ahead ? "ok" : "bad"}"><div class="ep-tile-num">${ahead ? "+" : ""}${epFmt(p, Math.abs(gap))}</div>
      <div class="ep-tile-label">reality gap (expected &minus; verified)</div></div>
    <div class="ep-tile"><div class="ep-tile-num">~${epFmt(p, f.predictedFinal)}</div>
      <div class="ep-tile-label">AI forecast at the deadline</div></div>`;

  epRenderChart(p, p.cumVerified, p.cumClaimed, f);
  epRenderFeed(p);
}

/* ---------- Chart.js Rendering ---------- */

function epRenderChart(p, cumVerified, cumClaimed, f) {
  const chartCanvas = document.getElementById("ep-chart");
  if (!chartCanvas) return;

  try {
    const labels = [];
    for (let m = 0; m <= p.durationMonths; m++) labels.push(m);

    const promise = labels.map((m) => (p.target * m) / p.durationMonths);
    const verified = labels.map((m) => {
      const hit = cumVerified.find((c) => c[0] === m);
      return hit ? hit[1] : null;
    });
    const claimed = labels.map((m) => {
      const hit = cumClaimed.find((c) => c[0] === m);
      return hit ? hit[1] : null;
    });

    const fs = f.forecastSeries;
    const bandLo = f.low, bandHi = f.high;
    const fromM = fs[0][0], fromV = fs[0][1], toM = fs[fs.length - 1][0];
    const bandLower = [{ x: fromM, y: fromV }, { x: toM, y: bandLo }];
    const bandUpper = [{ x: fromM, y: fromV }, { x: toM, y: bandHi }];
    const forecast = [{ x: fromM, y: fromV }, { x: toM, y: f.predictedFinal }];

    const cfg = {
      type: "line",
      data: {
        labels,
        datasets: [
          { label: "Promise trajectory", data: promise, borderColor: "#14532d", borderWidth: 2, pointRadius: 0, fill: false, tension: 0 },
          { label: "Verified actual", data: verified, borderColor: "#16a34a", backgroundColor: "#16a34a", borderWidth: 2.5, pointRadius: 3.5, pointHoverRadius: 5, spanGaps: true, tension: 0.15 },
          { label: "Claimed in reports", data: claimed, borderColor: "#94a3b8", borderDash: [2, 3], borderWidth: 1.5, pointRadius: 0, fill: false, tension: 0.15 },
          { label: "Forecast band (upper)", data: bandUpper, borderColor: "rgba(220,38,38,0)", backgroundColor: "rgba(220,38,38,0.08)", borderWidth: 0, pointRadius: 0, fill: false, tension: 0 },
          { label: "Forecast band (lower)", data: bandLower, borderColor: "rgba(220,38,38,0)", backgroundColor: "rgba(220,38,38,0.08)", borderWidth: 0, pointRadius: 0, fill: "-1", tension: 0 },
          { label: "AI forecast", data: forecast, borderColor: "#dc2626", borderDash: [7, 5], borderWidth: 2, pointRadius: 0, fill: false, tension: 0 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "nearest", intersect: false },
        plugins: {
          legend: { labels: { boxWidth: 18, font: { size: 12 }, filter: (item) => !item.text.includes("band") } },
          tooltip: {
            filter: (item) => !item.dataset.label.toLowerCase().includes("band"),
            callbacks: { label: (c) => `${c.dataset.label}: ${epFmt(p, c.parsed.y)} ${epShortUnit(p)}` }
          }
        },
        scales: {
          x: { title: { display: true, text: "month of project" }, ticks: { maxTicksLimit: 13 } },
          y: { title: { display: true, text: p.unit }, beginAtZero: true }
        }
      }
    };

    if (epChart) epChart.destroy();
    if (typeof Chart !== "undefined") {
      epChart = new Chart(chartCanvas, cfg);
    }
  } catch (err) {
    console.error("Chart rendering failed:", err);
    epRenderChartError();
  }
}

/* ---------- Verification Feed ---------- */

function epRenderFeed(p) {
  const wrap = document.getElementById("ep-feed");
  if (!wrap) return;
  wrap.innerHTML = "";

  const updates = [...p.updates].reverse(); // newest first
  const flagged = updates.find(u => u.confidence < 50 || (u.checks && (u.checks.duplicate?.status === "fail" || u.checks.plausibility?.status === "fail")));

  // Prominent flagged evidence highlight section
  if (flagged) {
    const flaggedEl = document.createElement("div");
    flaggedEl.className = "ep-flagged-card";
    flaggedEl.innerHTML = `
      <div class="ep-flagged-header">
        <span class="ep-badge ep-badge-failed">FLAGGED EVIDENCE</span>
        <span class="ep-flagged-month">Month ${flagged.month} Evidence Submission</span>
      </div>
      <div class="ep-flagged-grid">
        <div class="ep-flagged-thumb">
          <a href="${flagged.photo}" target="_blank" rel="noopener">
            <img src="${flagged.photo}" alt="Flagged evidence photo, month ${flagged.month}">
          </a>
        </div>
        <div class="ep-flagged-info">
          <div class="ep-flagged-chips">
            <span class="ep-chip chip-fail">Duplicate Photo: FLAGGED</span>
            <span class="ep-chip chip-fail">Growth Plausibility: FLAGGED</span>
            <span class="ep-chip chip-fail">Confidence: ${flagged.confidence}%</span>
          </div>
          <p class="ep-flagged-msg">Potential duplicate evidence and an unusual progress claim were detected.</p>
          <details class="ep-feed-detail">
            <summary>Show Technical Details</summary>
            <div class="ep-feed-detail-line"><strong>Duplicate Photo (flag):</strong> ${flagged.checks?.duplicate?.detail || "Hamming distance 0/64 to earlier update."}</div>
            <div class="ep-feed-detail-line"><strong>Growth Plausibility (flag):</strong> ${flagged.checks?.plausibility?.detail || "Implausible increment."}</div>
            <div class="ep-feed-detail-line"><strong>GPS Cross-Check:</strong> ${flagged.checks?.gps?.detail || "Location verified."}</div>
          </details>
        </div>
      </div>`;
    wrap.appendChild(flaggedEl);
  }

  // Monthly Verification Timeline Header
  const feedHeader = document.createElement("div");
  feedHeader.style.cssText = "padding: 16px 24px 8px; font-size: 0.82rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--ink-faint); border-top: 1px solid var(--line);";
  feedHeader.textContent = "Monthly Verification Timeline";
  wrap.appendChild(feedHeader);

  // Show recent updates (latest 2) by default; collapse older updates
  const RECENT_COUNT = 2;
  const recentUpdates = updates.slice(0, RECENT_COUNT);
  const olderUpdates = updates.slice(RECENT_COUNT);

  function createUpdateRow(u) {
    const checks = u.checks || {};
    const chips = ["relevance", "duplicate", "gps", "plausibility"].map((k) => {
      const c = checks[k] || { status: "na", short: "n/a", detail: "N/A" };
      const chip = EP_CHIP[c.status] || EP_CHIP.na;
      return `<span class="ep-chip ${chip.cls}">${EP_CHECK_LABELS[k]}: ${chip.word}</span>`;
    }).join("");

    const confCls = u.confidence >= 80 ? "ok" : u.confidence >= 50 ? "warn" : "bad";
    const details = ["relevance", "duplicate", "gps", "plausibility"].map((k) => {
      const c = checks[k] || { status: "na", detail: "Check not executed" };
      const word = (EP_CHIP[c.status] || EP_CHIP.na).word.toLowerCase();
      return `<div class="ep-feed-detail-line"><strong>${EP_CHECK_LABELS[k]} (${word}):</strong> ${c.detail}</div>`;
    }).join("");

    const el = document.createElement("article");
    el.className = "ep-feed-item" + (u.confidence < 50 ? " ep-feed-flagged" : "");
    el.innerHTML = `
      <a class="ep-feed-photo" href="${u.photo}" target="_blank" rel="noopener">
        <img src="${u.photo}" alt="Evidence photo, month ${u.month}" loading="lazy">
      </a>
      <div class="ep-feed-body">
        <div class="ep-feed-head">
          <span class="ep-feed-month">Month ${u.month} update <span class="ep-feed-date">\u00b7 ${u.date}</span></span>
          <span class="ep-feed-counts">claimed <strong>${epFmt(p, u.claimed)}</strong> \u00b7 counted <strong>${epFmt(p, u.verified)}</strong> ${epShortUnit(p)}</span>
        </div>
        <div class="ep-feed-chips">${chips}</div>
        ${u.note ? `<div class="ep-feed-note">${u.note}</div>` : ""}
        <details class="ep-feed-detail"><summary>Show Technical Details</summary>${details}</details>
      </div>
      <div class="ep-feed-conf ep-conf-${confCls}">
        <div class="ep-conf-num">${u.confidence}%</div>
        <div class="ep-conf-word">confidence</div>
        <div class="ep-conf-bar"><div style="width:${u.confidence}%"></div></div>
      </div>`;
    return el;
  }

  // Render recent updates
  recentUpdates.forEach(u => wrap.appendChild(createUpdateRow(u)));

  // If there are older updates, provide an expandable container
  if (olderUpdates.length > 0) {
    const olderWrap = document.createElement("div");
    olderWrap.id = "ep-older-updates";
    olderWrap.style.display = "none";
    olderUpdates.forEach(u => olderWrap.appendChild(createUpdateRow(u)));
    wrap.appendChild(olderWrap);

    const btnWrap = document.createElement("div");
    btnWrap.className = "ep-feed-more-wrap";
    btnWrap.innerHTML = `<button class="btn btn-ghost ep-feed-more-btn" id="ep-btn-more-updates" type="button">View Previous Updates (${olderUpdates.length} more) &darr;</button>`;
    wrap.appendChild(btnWrap);

    btnWrap.querySelector("#ep-btn-more-updates").addEventListener("click", function() {
      const isHidden = olderWrap.style.display === "none";
      olderWrap.style.display = isHidden ? "block" : "none";
      this.innerHTML = isHidden ? "Hide Previous Updates &uarr;" : `View Previous Updates (${olderUpdates.length} more) &darr;`;
    });
  }
}

/* ---------- Try-It-Yourself Duplicate Checker ---------- */

function epInitTry() {
  const dropzone = document.getElementById("ep-dropzone");
  const fileInput = document.getElementById("ep-try-file");
  const buttons = document.getElementById("ep-try-demo");
  const out = document.getElementById("ep-try-out");
  const previewArea = document.getElementById("ep-upload-preview");
  const errorArea = document.getElementById("ep-upload-error");
  const actionsArea = document.getElementById("ep-try-actions");
  const analyzeBtn = document.getElementById("ep-btn-analyze");

  if (!buttons || !out) return;

  let currentPhotoSrc = null;
  let currentPhotoLabel = null;
  let currentFile = null;
  let currentObjectUrl = null;

  function clearError() {
    if (errorArea) errorArea.innerHTML = "";
  }

  function showError(msg) {
    if (errorArea) {
      errorArea.innerHTML = `<div class="ep-upload-error">${msg}</div>`;
    }
  }

  function showPreview(fileOrUrl, label, sizeText = "") {
    clearError();
    currentPhotoSrc = fileOrUrl;
    currentPhotoLabel = label;

    if (previewArea) {
      previewArea.innerHTML = `
        <div class="ep-upload-preview">
          <img src="${fileOrUrl}" alt="Selected photo preview">
          <div class="ep-upload-preview-info">
            <strong>${label}</strong>
            ${sizeText ? `<span>${sizeText}</span>` : "<span>Sample demonstration photo</span>"}
          </div>
          <div class="ep-upload-actions">
            <button class="btn-change" id="ep-change-photo" type="button">Change Photo</button>
            <button class="btn-remove" id="ep-remove-photo" type="button">Remove Photo</button>
          </div>
        </div>`;

      document.getElementById("ep-remove-photo")?.addEventListener("click", clearSelection);
      document.getElementById("ep-change-photo")?.addEventListener("click", () => {
        if (fileInput) fileInput.click();
      });
    }

    if (actionsArea) actionsArea.style.display = "block";
    out.innerHTML = `<p class="ep-try-pending">Photo selected. Click <strong>Analyze Evidence</strong> below to run duplicate verification.</p>`;
  }

  function clearSelection() {
    currentPhotoSrc = null;
    currentPhotoLabel = null;
    currentFile = null;
    if (currentObjectUrl) {
      URL.revokeObjectURL(currentObjectUrl);
      currentObjectUrl = null;
    }
    if (previewArea) previewArea.innerHTML = "";
    if (fileInput) fileInput.value = "";
    if (actionsArea) actionsArea.style.display = "none";
    clearError();
    out.innerHTML = `<p class="ep-try-pending">Select a sample photo above or upload an evidence photo to begin verification.</p>`;
  }

  function handleFile(file) {
    clearError();
    if (!file) return;

    // Validate file
    if (typeof EcoLensConfig !== "undefined") {
      const validation = EcoLensConfig.validateFile(file);
      if (!validation.valid) {
        showError(validation.error);
        return;
      }
    }

    if (currentObjectUrl) {
      URL.revokeObjectURL(currentObjectUrl);
    }
    currentFile = file;
    currentObjectUrl = URL.createObjectURL(file);
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    showPreview(currentObjectUrl, file.name, `${sizeMB} MB \u00b7 ${file.type || "image"}`);
  }

  // Multi-step loading animation
  async function showLoadingSteps() {
    const steps = (typeof EcoLensConfig !== "undefined")
      ? EcoLensConfig.LOADING_STEPS
      : [
          { message: "Uploading evidence\u2026", duration: 500 },
          { message: "Analyzing submission\u2026", duration: 600 },
          { message: "Checking duplicate records\u2026", duration: 600 },
          { message: "Preparing verification result\u2026", duration: 400 }
        ];

    const stepsHtml = steps.map((s, i) =>
      `<div class="ep-loading-step" id="ep-lstep-${i}">
        <span class="ep-step-dot"></span>
        <span>${s.message}</span>
      </div>`
    ).join("");

    out.innerHTML = `<div class="ep-loading-steps">${stepsHtml}</div>`;

    for (let i = 0; i < steps.length; i++) {
      const el = document.getElementById("ep-lstep-" + i);
      if (el) el.classList.add("active");
      await new Promise(resolve => setTimeout(resolve, steps[i].duration));
      if (el) {
        el.classList.remove("active");
        el.classList.add("done");
      }
    }
  }

  async function executeAnalysis() {
    if (!currentPhotoSrc) {
      showError("Please select or upload a photo first.");
      return;
    }

    if (actionsArea) actionsArea.style.display = "none";

    try {
      await showLoadingSteps();
      const result = await EcoLensAPI.verifyPhotoEvidence(currentPhotoSrc, currentPhotoLabel);

      const statusBadge = result.isDuplicate
        ? (typeof EcoLensUI !== "undefined" ? EcoLensUI.renderBadge("failed") : '<span class="ep-badge ep-badge-failed">Verification Failed</span>')
        : (typeof EcoLensUI !== "undefined" ? EcoLensUI.renderBadge("verified") : '<span class="ep-badge ep-badge-verified">Verified</span>');

      const verdictTitle = result.isDuplicate ? "Duplicate Photo Detected" : "Unique Evidence Verified";
      const verdictCls = result.isDuplicate ? "bad" : "ok";

      out.innerHTML = `
        <div class="ep-result-card">
          <div class="ep-result-top">
            <div class="ep-result-verdict" style="color:var(--${verdictCls === 'bad' ? 'red-600' : 'green-900'});">
              ${verdictTitle}
            </div>
            <div>${statusBadge}</div>
          </div>
          <div class="ep-result-body">
            <img src="${currentPhotoSrc}" alt="Verified evidence photo">
            <div class="ep-result-meta">
              <div class="ep-result-meta-row"><strong>Duplicate Detection:</strong> ${result.isDuplicate ? "Flagged \u2014 match found in registered project records" : "Passed \u2014 no match found in gallery"}</div>
              <div class="ep-result-meta-row"><strong>Confidence Score:</strong> ${result.isDuplicate ? "25%" : "100%"}</div>
              <div class="ep-result-meta-row"><strong>Reason:</strong> ${result.message}</div>
              <details class="ep-feed-detail" style="margin-top:8px;">
                <summary>Show Technical Details</summary>
                <div class="ep-feed-detail-line"><strong>Closest Match:</strong> ${result.matchProject}, Month ${result.matchMonth}</div>
                <div class="ep-feed-detail-line"><strong>Hamming Distance:</strong> ${result.hammingDistance}/64</div>
                <div class="ep-feed-detail-line"><strong>Perceptual Hash:</strong> <code>${result.dHash}</code></div>
              </details>
              <div class="ep-demo-notice" style="margin-top:10px;">\u26A0 Demo mode \u2014 mock verification data</div>
            </div>
          </div>
        </div>`;

      if (actionsArea) actionsArea.style.display = "block";
    } catch (err) {
      out.innerHTML = `
        <div class="ep-upload-error">
          Analysis unavailable: ${err.message}. Please try again or test with sample photos.
        </div>`;
      if (actionsArea) actionsArea.style.display = "block";
    }
  }

  // Analyze Evidence button click
  if (analyzeBtn) {
    analyzeBtn.addEventListener("click", executeAnalysis);
  }

  // Drag and drop events
  if (dropzone) {
    ["dragenter", "dragover"].forEach(evt => {
      dropzone.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add("ep-dragover");
      });
    });

    ["dragleave", "drop"].forEach(evt => {
      dropzone.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove("ep-dragover");
      });
    });

    dropzone.addEventListener("drop", (e) => {
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    });

    dropzone.addEventListener("click", () => {
      if (fileInput) fileInput.click();
    });
  }

  // File input change
  if (fileInput) {
    fileInput.addEventListener("change", () => {
      const file = fileInput.files[0];
      if (file) handleFile(file);
    });
  }

  // Demo buttons
  if (buttons) {
    buttons.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-photo]");
      if (btn) {
        showPreview(btn.dataset.photo, btn.dataset.label || "Demo Photo");
      }
    });
  }
}

/* ---------- Dashboard Boot ---------- */

document.addEventListener("DOMContentLoaded", async () => {
  const loading = document.getElementById("ep-loading");
  const hasDemo = document.getElementById("ep-cards");
  const hasTry = document.getElementById("ep-try-demo");

  if (!hasDemo && !hasTry) return;

  try {
    if (hasDemo) {
      // Show skeleton while loading
      epRenderSkeleton();
      if (loading) loading.remove();

      epAllProjects = await EcoLensAPI.getProjects();
      epRenderCards(epAllProjects);

      // Restore the detail panel structure (skeleton replaced it)
      const panel = document.querySelector(".ep-panel");
      if (panel) {
        panel.innerHTML = `
          <div class="ep-panel-head">
            <h3 id="ep-detail-title"></h3>
            <p id="ep-detail-site"></p>
          </div>
          <div id="ep-banner" class="ep-banner"></div>
          <div id="ep-tiles"></div>
          <div class="ep-chartbox"><canvas id="ep-chart" aria-label="Expected vs actual progress chart"></canvas></div>
          <div class="ep-feed" id="ep-feed"></div>`;
      }

      if (epAllProjects.length > 0) {
        await epSelect(epAllProjects[0].id);
      }
    }
    if (hasTry) {
      if (loading) loading.remove();
      epInitTry();
    }
  } catch (err) {
    if (loading) loading.remove();
    console.error("Dashboard initialization error:", err);
    epRenderDashboardError("Could not load projects. Check your connection and try again.");
  }
});
