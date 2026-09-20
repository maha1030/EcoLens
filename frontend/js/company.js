/**
 * EcoLens - Company / Carbon Credit Buyer Dashboard Controller
 *
 * Powers project browsing, side-by-side comparison, detailed score breakdowns,
 * Expected vs Actual progress charts, risk analysis, and shortlist decision support.
 */
"use strict";

let epCompanyProjects = [];
let epSelectedCompanyProjectId = null;
let epCompanyChart = null;
let epShortlistedProjects = new Set();
let epComparedProjects = new Set();

const epEsc = (s) => (typeof EcoLensUI !== "undefined" && EcoLensUI.escapeHtml) ? EcoLensUI.escapeHtml(s) : String(s ?? "");

function epCompFormat(val, unit) {
  if (typeof EcoLensUI !== "undefined") {
    return EcoLensUI.formatValue(val, unit);
  }
  if (val === null || val === undefined || isNaN(val)) return "0";
  return unit === "trees" || unit === "saplings" ? Math.round(val).toLocaleString("en-US") : (Math.round(val * 10) / 10).toLocaleString("en-US");
}

function epCompShortUnit(unit) {
  if (typeof EcoLensUI !== "undefined") {
    return EcoLensUI.shortUnit(unit);
  }
  if (!unit) return "";
  if (unit === "hectares") return "ha";
  return unit;
}

/* ---------- Render Summary Stats ---------- */
function epRenderCompanySummary(projects, dashboardStats = null) {
  const container = document.getElementById("company-summary-stats");
  if (!container) return;

  const total = projects.length;
  const onTrack = projects.filter(p => p.outcomePrediction === "On Track").length;
  const atRisk = projects.filter(p => p.outcomePrediction === "At Risk" || p.outcomePrediction === "Off Track" || (p.status && (p.status.cls === "warn" || p.status.cls === "bad"))).length;
  const highRisk = projects.filter(p => p.riskLevel === "High").length;

  container.innerHTML = `
    <div class="stat-tile">
      <div class="stat-tile-num">${total}</div>
      <div class="stat-tile-label">Projects Available</div>
    </div>
    <div class="stat-tile">
      <div class="stat-tile-num">${onTrack}</div>
      <div class="stat-tile-label">On Track</div>
    </div>
    <div class="stat-tile">
      <div class="stat-tile-num ${atRisk > 0 ? 'warn' : ''}">${atRisk}</div>
      <div class="stat-tile-label">At Risk</div>
    </div>
    <div class="stat-tile">
      <div class="stat-tile-num ${highRisk > 0 ? 'bad' : ''}">${highRisk}</div>
      <div class="stat-tile-label">High Risk</div>
    </div>
  `;
}

/* ---------- Render Browse Projects Cards ---------- */
function epRenderCompanyCards(projects) {
  const container = document.getElementById("company-project-cards");
  if (!container) return;

  container.innerHTML = "";

  if (!projects || projects.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 30px; text-align: center; background: var(--surface); border: 1px dashed var(--line); border-radius: var(--radius);">
        <h4 style="margin:0 0 8px; color: var(--ink);">No projects available</h4>
        <p style="margin:0; font-size: 0.9rem; color: var(--ink-soft);">No environmental pledge projects were returned by the backend database.</p>
      </div>
    `;
    return;
  }

  projects.forEach(p => {
    const isSelected = String(p.id) === String(epSelectedCompanyProjectId);
    const isShortlisted = epShortlistedProjects.has(String(p.id));
    const isCompared = epComparedProjects.has(String(p.id));

    const card = document.createElement("div");
    card.className = "proj-card" + (isSelected ? " selected-card" : "");
    card.id = `company-card-${p.id}`;

    const riskBadge = p.riskLevel === "High"
      ? `<span class="ep-badge ep-badge-failed">High Risk</span>`
      : (p.riskLevel === "Low"
        ? `<span class="ep-badge ep-badge-verified">Low Risk</span>`
        : `<span class="ep-badge ep-badge-pending">${p.riskLevel || 'Pending Data'}</span>`);

    const trajectoryBadge = (p.status && p.status.cls === "ok")
      ? `<span class="ep-badge ep-badge-verified">${epEsc(p.status.label)}</span>`
      : (p.status && p.status.cls === "warn"
        ? `<span class="ep-badge ep-badge-review">${epEsc(p.status.label)}</span>`
        : `<span class="ep-badge ep-badge-failed">${epEsc(p.status ? p.status.label : 'Off Track')}</span>`);

    const scoreDisplay = (p.ecoLensScore !== undefined && p.ecoLensScore !== "N/A")
      ? `${p.ecoLensScore}<span style="font-size:0.75rem; color:var(--ink-faint); font-weight:600;">/100</span>`
      : `<span style="font-size:0.95rem; font-weight:700; color:var(--ink-soft);">N/A</span>`;

    card.innerHTML = `
      <div>
        <div class="proj-card-top">
          <h3>${epEsc(p.name)}</h3>
          <div style="text-align:right;">
            <div style="font-size:1.35rem; font-weight:800; color:var(--green-900); line-height:1;">${scoreDisplay}</div>
            <div style="font-size:0.68rem; font-weight:700; color:var(--ink-faint); text-transform:uppercase;">EcoLens Score</div>
          </div>
        </div>
        <div class="proj-card-type">${epEsc(p.projectType || p.kind || 'Environmental')}</div>
        <div class="proj-card-location">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          ${epEsc(p.displayLocation || (p.site ? p.site.name : 'Site Location'))}
        </div>

        <div style="display:flex; gap:8px; margin-bottom:12px;">
          ${riskBadge}
          ${trajectoryBadge}
        </div>

        <div class="ep-card-bar" style="margin: 8px 0 6px;">
          <div class="ep-card-fill" style="width: ${p.progressPercent || 0}%"></div>
        </div>

        <div class="proj-card-metrics">
          <div class="proj-metric-row">
            <span>Target</span>
            <strong>${epCompFormat(p.target || 0, p.unit)} ${epCompShortUnit(p.unit)}</strong>
          </div>
          <div class="proj-metric-row">
            <span>Current Progress</span>
            <strong>${epCompFormat(p.verified || 0, p.unit)} ${epCompShortUnit(p.unit)}</strong>
          </div>
          <div class="proj-metric-row">
            <span>Completion</span>
            <strong>${p.progressPercent || 0}%</strong>
          </div>
          <div class="proj-metric-row">
            <span>Outcome Prediction</span>
            <strong style="color:var(--${p.outcomePrediction === 'On Track' ? 'green-900' : 'red-600'});">${p.outcomePrediction || 'Pending Data'}</strong>
          </div>
        </div>
      </div>

      <div class="proj-card-actions">
        <button class="btn btn-primary" onclick="epSelectCompanyProject('${p.id}', true)">View Analysis</button>
        <button class="btn btn-ghost" onclick="epToggleCompare('${p.id}')">${isCompared ? '✓ Selected to Compare' : '+ Compare'}</button>
      </div>
    `;

    container.appendChild(card);
  });
}

/* ---------- Toggle Comparison Project ---------- */
async function epToggleCompare(projectId) {
  const pIdStr = String(projectId);
  if (epComparedProjects.has(pIdStr)) {
    epComparedProjects.delete(pIdStr);
  } else {
    epComparedProjects.add(pIdStr);
  }
  epRenderCompanyCards(epCompanyProjects);
  await epRenderComparisonTable();
}

/* ---------- Render Comparison Table ---------- */
async function epRenderComparisonTable() {
  const container = document.getElementById("company-comparison-table");
  if (!container) return;

  if (epComparedProjects.size === 0) {
    container.innerHTML = `
      <div style="padding: 24px; text-align: center; background: var(--surface); border: 1px dashed var(--line); border-radius: var(--radius); margin-top: 14px;">
        <p style="margin:0; font-size: 0.9rem; color: var(--ink-soft);">Select 1 or more projects using "+ Compare" above to view side-by-side benchmarking.</p>
      </div>
    `;
    return;
  }

  const ids = Array.from(epComparedProjects);
  if (ids.length < 2) {
    container.innerHTML = `
      <div style="padding: 32px 20px; text-align: center; color: var(--ink-soft); background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius);">
        <p style="margin: 0 0 6px; font-weight: 700; color: var(--ink); font-size: 0.95rem;">Select at least 2 projects to compare</p>
        <p style="margin: 0; font-size: 0.85rem;">Check multiple projects in the list above to view side-by-side benchmark comparisons.</p>
      </div>
    `;
    return;
  }

  let compared = [];
  try {
    if (typeof EcoLensConfig !== "undefined" && !EcoLensConfig.USE_MOCK) {
      compared = await EcoLensAPI.getCompareProjects(ids);
    } else {
      compared = epCompanyProjects.filter(p => epComparedProjects.has(String(p.id)));
    }
  } catch (err) {
    console.warn("API comparison fetch error, falling back to local:", err.message);
    compared = epCompanyProjects.filter(p => epComparedProjects.has(String(p.id)));
  }

  if (compared.length === 0) return;

  let ths = `<th>Metric</th>`;
  compared.forEach(p => {
    ths += `<th>${epEsc(p.name)}</th>`;
  });

  const rows = [
    { label: "Target Pledge", key: (p) => `${epCompFormat(p.target, p.unit)} ${epCompShortUnit(p.unit)}` },
    { label: "Current Progress", key: (p) => `${epCompFormat(p.verified, p.unit)} ${epCompShortUnit(p.unit)} (${p.progressPercent || 0}%)` },
    { label: "Progress Score", key: (p) => `<strong>${p.progressScore !== "N/A" ? p.progressScore + "/50" : "N/A"}</strong>` },
    { label: "Risk Score", key: (p) => `<strong>${p.evidenceScore !== "N/A" ? p.evidenceScore + "/25" : "N/A"}</strong>` },
    { label: "Consistency Score", key: (p) => `<strong>${p.consistencyScore !== "N/A" ? p.consistencyScore + "/25" : "N/A"}</strong>` },
    { 
      label: "Risk Level", 
      key: (p) => p.riskLevel === "High" 
        ? `<span class="ep-badge ep-badge-failed">High Risk</span>` 
        : (p.riskLevel === "Low"
          ? `<span class="ep-badge ep-badge-verified">Low Risk</span>`
          : `<span class="ep-badge ep-badge-pending">${p.riskLevel || 'Pending Data'}</span>`)
    },
    { 
      label: "Outcome Prediction", 
      key: (p) => p.outcomePrediction === "On Track" 
        ? `<span class="ep-badge ep-badge-verified">On Track</span>` 
        : (p.outcomePrediction === "At Risk" || p.outcomePrediction === "Off Track"
          ? `<span class="ep-badge ep-badge-review">${p.outcomePrediction}</span>`
          : `<span class="ep-badge ep-badge-pending">${p.outcomePrediction || 'Pending Data'}</span>`)
    },
    { 
      label: "Overall EcoLens Score", 
      key: (p) => p.ecoLensScore !== "N/A"
        ? `<span style="font-size:1.15rem; font-weight:800; color:var(--green-900);">${p.ecoLensScore}</span><span style="font-size:0.8rem; color:var(--ink-faint);">/100</span>`
        : `<span style="font-size:0.95rem; font-weight:700; color:var(--ink-soft);">N/A</span>`
    },
    {
      label: "Action",
      key: (p) => `<button class="btn btn-ghost" style="font-size:0.82rem; padding:6px 12px;" onclick="epSelectCompanyProject('${p.id}', true)">Review Analysis &rarr;</button>`
    }
  ];

  let tbodyHtml = "";
  rows.forEach(r => {
    tbodyHtml += `<tr><td class="metric-label">${r.label}</td>`;
    compared.forEach(p => {
      tbodyHtml += `<td>${r.key(p)}</td>`;
    });
    tbodyHtml += `</tr>`;
  });

  container.innerHTML = `
    <table class="compare-table">
      <thead><tr>${ths}</tr></thead>
      <tbody>${tbodyHtml}</tbody>
    </table>
  `;
}

/* ---------- Detailed Project Evaluation ---------- */
async function epSelectCompanyProject(projectId, scroll = false) {
  if (!projectId) return;
  epSelectedCompanyProjectId = String(projectId);

  // Highlight card
  document.querySelectorAll(".proj-card").forEach(c => c.classList.remove("selected-card"));
  const activeCard = document.getElementById(`company-card-${projectId}`);
  if (activeCard) activeCard.classList.add("selected-card");

  try {
    const p = await EcoLensAPI.getProjectEvaluation(projectId);

    // Update Header Meta
    const nameEl = document.getElementById("eval-project-name");
    if (nameEl) nameEl.textContent = p.name;
    const metaEl = document.getElementById("eval-project-meta");
    if (metaEl) {
      metaEl.textContent = `${p.projectType || p.kind || 'Environmental'} \u00b7 ${p.displayLocation || 'Site'} \u00b7 Target: ${epCompFormat(p.target || 0, p.unit)} ${p.unit} \u00b7 Timeline: ${p.timeline || `${p.durationMonths || 12} months`}`;
    }

    // Score Breakdown
    const scoreGrid = document.getElementById("eval-score-grid");
    if (scoreGrid) {
      const pScoreStr = p.progressScore !== "N/A" ? `${p.progressScore}<span style="font-size:0.9rem; color:var(--ink-faint);">/50</span>` : "N/A";
      const eScoreStr = p.evidenceScore !== "N/A" ? `${p.evidenceScore}<span style="font-size:0.9rem; color:var(--ink-faint);">/25</span>` : "N/A";
      const cScoreStr = p.consistencyScore !== "N/A" ? `${p.consistencyScore}<span style="font-size:0.9rem; color:var(--ink-faint);">/25</span>` : "N/A";
      const oScoreStr = p.ecoLensScore !== "N/A" ? `${p.ecoLensScore}<span style="font-size:0.9rem; color:var(--green-900);">/100</span>` : "N/A";

      scoreGrid.innerHTML = `
        <div class="score-tile">
          <div class="score-tile-val">${pScoreStr}</div>
          <div class="score-tile-label">Progress Score (/50)</div>
        </div>
        <div class="score-tile">
          <div class="score-tile-val">${eScoreStr}</div>
          <div class="score-tile-label">Risk Score (/25)</div>
        </div>
        <div class="score-tile">
          <div class="score-tile-val">${cScoreStr}</div>
          <div class="score-tile-label">Consistency Score (/25)</div>
        </div>
        <div class="score-tile" style="border: 2px solid var(--green-600); background:var(--green-100);">
          <div class="score-tile-val score-highlight">${oScoreStr}</div>
          <div class="score-tile-label" style="color:var(--green-900);">Overall EcoLens Score (/100)</div>
        </div>
      `;
    }

    // Key Risk & Prediction Callouts
    const calloutEl = document.getElementById("eval-callout-banner");
    if (calloutEl) {
      calloutEl.className = `ep-banner ep-banner-${p.status ? p.status.cls : 'ok'}`;
      const ahead = (p.gap || 0) <= 0;
      if (ahead) {
        calloutEl.innerHTML = `<strong>Schedule Trajectory: ON TRACK.</strong> The recorded progress trajectory indicates milestone fulfillment on or ahead of schedule.`;
      } else {
        const shortfall = (p.forecast && p.forecast.predictedFinal < (p.target || 0))
          ? (p.target - p.forecast.predictedFinal)
          : 0;
        if (shortfall > 0) {
          calloutEl.innerHTML = `<strong>Schedule Trajectory: ${p.status ? p.status.label : 'OFF TRACK'}.</strong> Reality gap of ${epCompFormat(Math.abs(p.gap || 0), p.unit)} ${epCompShortUnit(p.unit)} detected. Trend forecast indicates a potential deadline shortfall of ~${epCompFormat(shortfall, p.unit)} ${epCompShortUnit(p.unit)}.`;
        } else {
          calloutEl.innerHTML = `<strong>Schedule Trajectory: ${p.status ? p.status.label : 'OFF TRACK'} (Milestone Gap).</strong> Current progress trails the expected milestone by ${epCompFormat(Math.abs(p.gap || 0), p.unit)} ${epCompShortUnit(p.unit)}, but linear rate projection indicates potential deadline fulfillment (~${epCompFormat(p.forecast ? p.forecast.predictedFinal : p.target, p.unit)} ${epCompShortUnit(p.unit)}).`;
        }
      }
    }

    // Reality Gap metric tiles
    const gapTiles = document.getElementById("eval-reality-tiles");
    if (gapTiles) {
      const ahead = (p.gap || 0) <= 0;
      gapTiles.innerHTML = `
        <div class="ep-tile">
          <div class="ep-tile-num">${epCompFormat(p.expected || 0, p.unit)}</div>
          <div class="ep-tile-label">Expected Progress to Date</div>
        </div>
        <div class="ep-tile">
          <div class="ep-tile-num">${epCompFormat(p.verified || 0, p.unit)}</div>
          <div class="ep-tile-label">Actual Recorded Progress (${p.progressPercent || 0}%)</div>
        </div>
        <div class="ep-tile ep-tile-${ahead ? 'ok' : 'bad'}">
          <div class="ep-tile-num">${ahead ? '+' : ''}${epCompFormat(Math.abs(p.gap || 0), p.unit)}</div>
          <div class="ep-tile-label">Reality Gap (Expected vs Actual)</div>
        </div>
        <div class="ep-tile">
          <div class="ep-tile-num">~${epCompFormat(p.forecast ? p.forecast.predictedFinal : (p.target || 0), p.unit)}</div>
          <div class="ep-tile-label">Predicted Final Outcome</div>
        </div>
      `;
    }

    // Evidence & Risk Analysis Columns
    const analysisEl = document.getElementById("eval-evidence-risk-grid");
    if (analysisEl) {
      const ev = p.evidenceAnalysis || {};
      const rk = p.riskAnalysis || {};

      analysisEl.innerHTML = `
        <div style="background:var(--surface); border:1px solid var(--line); border-radius:var(--radius); padding:22px; box-shadow:var(--shadow);">
          <h4 style="margin:0 0 14px; font-size:1.05rem; color:var(--ink); display:flex; align-items:center; gap:8px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            Evidence Analysis
          </h4>
          <div style="font-size:0.9rem; line-height:1.7;">
            <div class="proj-metric-row"><span>Photo Relevance</span><strong>${ev.photoRelevance || 'Verified'}</strong></div>
            <div class="proj-metric-row"><span>Duplicate Detection</span><strong>${ev.duplicateDetection || 'Passed'}</strong></div>
            <div class="proj-metric-row"><span>Location Consistency</span><strong>${ev.locationConsistency || 'Consistent'}</strong></div>
            <div class="proj-metric-row"><span>Evidence Confidence</span><strong style="color:var(--green-900);">${ev.evidenceConfidence || 'Pending Data'}</strong></div>
          </div>
        </div>

        <div style="background:var(--surface); border:1px solid var(--line); border-radius:var(--radius); padding:22px; box-shadow:var(--shadow);">
          <h4 style="margin:0 0 14px; font-size:1.05rem; color:var(--ink); display:flex; align-items:center; gap:8px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Risk Analysis
          </h4>
          <div style="font-size:0.9rem; line-height:1.7;">
            <div class="proj-metric-row"><span>Current Risk Level</span><strong><span class="ep-badge ${p.riskLevel === 'High' ? 'ep-badge-failed' : 'ep-badge-verified'}">${p.riskLevel || 'Pending Data'}</span></strong></div>
            <div class="proj-metric-row"><span>Progress Anomaly</span><strong>${rk.progressAnomaly || 'Normal'}</strong></div>
            <div class="proj-metric-row"><span>Timeline Risk</span><strong>${rk.timelineRisk || 'Low'}</strong></div>
            <div class="proj-metric-row"><span>Predicted Outcome</span><strong style="color:var(--${p.outcomePrediction === 'On Track' ? 'green-900' : 'red-600'});">${p.outcomePrediction || 'Pending Data'}</strong></div>
          </div>
        </div>
      `;
    }

    // Update Shortlist Button State
    epUpdateShortlistButton();

    // Render Chart
    epRenderCompanyChart(p);

    if (scroll) {
      const section = document.getElementById("company-project-analysis");
      if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
    }

  } catch (err) {
    console.error("Failed to render project evaluation:", err);
  }
}

/* ---------- Chart.js Evaluation Chart ---------- */
function epRenderCompanyChart(p) {
  const canvas = document.getElementById("company-eval-chart");
  if (!canvas || typeof Chart === "undefined") return;

  try {
    const duration = p.durationMonths || 12;
    const labels = [];
    for (let m = 0; m <= duration; m++) labels.push(m);

    const promise = labels.map((m) => (p.target * m) / duration);
    const cumVerified = p.cumVerified || [];
    const verified = labels.map((m) => {
      const hit = cumVerified.find((c) => c[0] === m);
      return hit ? hit[1] : null;
    });

    const f = p.forecast || { predictedFinal: p.target || 0, forecastSeries: [[1, 0], [duration, p.target || 0]] };
    const fs = f.forecastSeries && f.forecastSeries.length ? f.forecastSeries : [[1, 0], [duration, f.predictedFinal]];
    const fromM = fs[0][0], fromV = fs[0][1], toM = fs[fs.length - 1][0];
    const forecast = [{ x: fromM, y: fromV }, { x: toM, y: f.predictedFinal }];

    const cfg = {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Expected Progress Line",
            data: promise,
            borderColor: "#14532d",
            borderWidth: 2,
            pointRadius: 0,
            fill: false,
            tension: 0
          },
          {
            label: "Actual Recorded Progress",
            data: verified,
            borderColor: "#16a34a",
            backgroundColor: "#16a34a",
            borderWidth: 2.5,
            pointRadius: 3.5,
            spanGaps: true,
            tension: 0.15
          },
          {
            label: "Predicted Outcome Trajectory",
            data: forecast,
            borderColor: "#dc2626",
            borderDash: [6, 4],
            borderWidth: 2,
            pointRadius: 0,
            fill: false,
            tension: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "nearest", intersect: false },
        plugins: {
          legend: { labels: { boxWidth: 16, font: { size: 12 } } },
          tooltip: {
            callbacks: {
              label: (c) => `${c.dataset.label}: ${epCompFormat(c.parsed.y, p.unit)} ${epCompShortUnit(p.unit)}`
            }
          }
        },
        scales: {
          x: { title: { display: true, text: "Month of Commitment" }, ticks: { maxTicksLimit: 13 } },
          y: { title: { display: true, text: epCompShortUnit(p.unit) || "units" }, beginAtZero: true }
        }
      }
    };

    if (epCompanyChart) epCompanyChart.destroy();
    epCompanyChart = new Chart(canvas, cfg);
  } catch (err) {
    console.error("Error rendering company evaluation chart:", err);
  }
}

/* ---------- Shortlist Button Interaction ---------- */
function epUpdateShortlistButton() {
  const btn = document.getElementById("btn-shortlist-project");
  if (!btn) return;

  const isShortlisted = epShortlistedProjects.has(String(epSelectedCompanyProjectId));
  if (isShortlisted) {
    btn.className = "btn btn-primary";
    btn.innerHTML = "\u2713 Shortlisted for Decision";
  } else {
    btn.className = "btn btn-primary";
    btn.innerHTML = "+ Shortlist Project";
  }
}

function epToggleShortlist() {
  const notificationArea = document.getElementById("decision-feedback");
  const pIdStr = String(epSelectedCompanyProjectId);

  if (epShortlistedProjects.has(pIdStr)) {
    epShortlistedProjects.delete(pIdStr);
    if (notificationArea) {
      notificationArea.innerHTML = `<div class="ep-upload-error" style="background:#f2f4f1; color:var(--ink-soft); border:1px solid var(--line);">Project removed from candidate shortlist.</div>`;
    }
  } else {
    epShortlistedProjects.add(pIdStr);
    const p = epCompanyProjects.find(x => String(x.id) === pIdStr);
    if (notificationArea) {
      notificationArea.innerHTML = `
        <div class="ep-success-banner">
          \u2713 <strong>${p ? p.name : 'Project'}</strong> has been added to your candidate shortlist for carbon credit / sustainability support decisions.
        </div>
      `;
    }
  }

  epUpdateShortlistButton();
  epRenderCompanyCards(epCompanyProjects);
}

/* ---------- Initialize Company Dashboard ---------- */
document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("company-project-cards");
  if (!container) return;

  try {
    let dashboardStats = null;
    try {
      dashboardStats = await EcoLensAPI.getCompanyDashboard();
    } catch (dErr) {
      console.warn("Company dashboard summary fetch notice:", dErr.message);
    }

    epCompanyProjects = await EcoLensAPI.getCompanyProjects();

    // Default compared set to first 3 projects if available
    if (epCompanyProjects.length > 0) {
      epCompanyProjects.forEach(p => epComparedProjects.add(String(p.id)));
    }

    epRenderCompanySummary(epCompanyProjects, dashboardStats);
    epRenderCompanyCards(epCompanyProjects);
    await epRenderComparisonTable();

    // Check for query param ?project=
    const params = new URLSearchParams(window.location.search);
    const initialProject = params.get("project");
    if (initialProject && epCompanyProjects.some(p => String(p.id) === String(initialProject))) {
      epSelectedCompanyProjectId = String(initialProject);
    } else if (epCompanyProjects.length > 0) {
      epSelectedCompanyProjectId = String(epCompanyProjects[0].id);
    }

    if (epSelectedCompanyProjectId) {
      await epSelectCompanyProject(epSelectedCompanyProjectId, Boolean(initialProject));
    }

    // Attach shortlist button listener
    const shortlistBtn = document.getElementById("btn-shortlist-project");
    if (shortlistBtn) {
      shortlistBtn.addEventListener("click", epToggleShortlist);
    }

    // Review another project button listener
    const reviewAnotherBtn = document.getElementById("btn-review-another");
    if (reviewAnotherBtn) {
      reviewAnotherBtn.addEventListener("click", () => {
        const browseSec = document.getElementById("company-browse-section");
        if (browseSec) browseSec.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }

  } catch (err) {
    console.error("Company dashboard initialization error:", err);
  }
});
