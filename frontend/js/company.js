/**
 * EcoLens - Company / Carbon Credit Buyer Dashboard Controller
 *
 * Powers project browsing, side-by-side comparison, detailed score breakdowns,
 * Expected vs Actual progress charts, risk analysis, and shortlist decision support.
 */
"use strict";

let epCompanyProjects = [];
let epSelectedCompanyProjectId = "vanamitra";
let epCompanyChart = null;
let epShortlistedProjects = new Set();
let epComparedProjects = new Set(["vanamitra", "pichavaram", "zerowaste"]);

function epCompFormat(val, unit) {
  if (typeof EcoLensUI !== "undefined") {
    return EcoLensUI.formatValue(val, unit);
  }
  return unit === "trees" ? Math.round(val).toLocaleString("en-US") : (Math.round(val * 10) / 10).toLocaleString("en-US");
}

function epCompShortUnit(unit) {
  if (typeof EcoLensUI !== "undefined") {
    return EcoLensUI.shortUnit(unit);
  }
  return unit === "trees" ? "trees" : unit === "hectares" ? "ha" : "%";
}

/* ---------- Render Summary Stats ---------- */
function epRenderCompanySummary(projects) {
  const container = document.getElementById("company-summary-stats");
  if (!container) return;

  const total = projects.length;
  const onTrack = projects.filter(p => p.outcomePrediction === "On Track").length;
  const atRisk = projects.filter(p => p.outcomePrediction === "At Risk").length;
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

  projects.forEach(p => {
    const isSelected = p.id === epSelectedCompanyProjectId;
    const isShortlisted = epShortlistedProjects.has(p.id);
    const isCompared = epComparedProjects.has(p.id);

    const card = document.createElement("div");
    card.className = "proj-card" + (isSelected ? " selected-card" : "");
    card.id = `company-card-${p.id}`;

    const riskBadge = p.riskLevel === "High"
      ? `<span class="ep-badge ep-badge-failed">High Risk</span>`
      : `<span class="ep-badge ep-badge-verified">Low Risk</span>`;

    const outcomeBadge = p.outcomePrediction === "On Track"
      ? `<span class="ep-badge ep-badge-verified">On Track</span>`
      : `<span class="ep-badge ep-badge-review">At Risk</span>`;

    card.innerHTML = `
      <div>
        <div class="proj-card-top">
          <h3>${p.name}</h3>
          <div style="text-align:right;">
            <div style="font-size:1.35rem; font-weight:800; color:var(--green-900); line-height:1;">${p.ecoLensScore}<span style="font-size:0.75rem; color:var(--ink-faint); font-weight:600;">/100</span></div>
            <div style="font-size:0.68rem; font-weight:700; color:var(--ink-faint); text-transform:uppercase;">EcoLens Score</div>
          </div>
        </div>
        <div class="proj-card-type">${p.projectType}</div>
        <div class="proj-card-location">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          ${p.displayLocation}
        </div>

        <div style="display:flex; gap:8px; margin-bottom:12px;">
          ${riskBadge}
          ${outcomeBadge}
        </div>

        <div class="ep-card-bar" style="margin: 8px 0 6px;">
          <div class="ep-card-fill" style="width: ${p.progressPercent}%"></div>
        </div>

        <div class="proj-card-metrics">
          <div class="proj-metric-row">
            <span>Target</span>
            <strong>${epCompFormat(p.target, p.unit)} ${epCompShortUnit(p.unit)}</strong>
          </div>
          <div class="proj-metric-row">
            <span>Current Progress</span>
            <strong>${epCompFormat(p.verified, p.unit)} ${epCompShortUnit(p.unit)}</strong>
          </div>
          <div class="proj-metric-row">
            <span>Completion</span>
            <strong>${p.progressPercent}%</strong>
          </div>
          <div class="proj-metric-row">
            <span>Outcome Prediction</span>
            <strong style="color:var(--${p.outcomePrediction === 'On Track' ? 'green-900' : 'red-600'});">${p.outcomePrediction}</strong>
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
function epToggleCompare(projectId) {
  if (epComparedProjects.has(projectId)) {
    if (epComparedProjects.size > 2) {
      epComparedProjects.delete(projectId);
    } else {
      alert("Please keep at least 2 projects selected for comparison.");
      return;
    }
  } else {
    epComparedProjects.add(projectId);
  }
  epRenderCompanyCards(epCompanyProjects);
  epRenderComparisonTable();
}

/* ---------- Render Comparison Table ---------- */
function epRenderComparisonTable() {
  const container = document.getElementById("company-comparison-table");
  if (!container) return;

  const compared = epCompanyProjects.filter(p => epComparedProjects.has(p.id));
  if (compared.length === 0) return;

  let ths = `<th>Metric</th>`;
  compared.forEach(p => {
    ths += `
      <th>
        <div style="font-size:0.96rem; font-weight:700;">${p.name}</div>
        <div style="font-size:0.75rem; font-weight:500; text-transform:none; color:var(--ink-soft);">${p.projectType} \u00b7 ${p.displayLocation}</div>
      </th>
    `;
  });

  const rows = [
    { label: "Target Pledge", key: (p) => `${epCompFormat(p.target, p.unit)} ${epCompShortUnit(p.unit)}` },
    { label: "Current Progress", key: (p) => `${epCompFormat(p.verified, p.unit)} ${epCompShortUnit(p.unit)} (${p.progressPercent}%)` },
    { label: "Progress Score", key: (p) => `<strong>${p.progressScore}/100</strong>` },
    { label: "Evidence Score", key: (p) => `<strong>${p.evidenceScore}/100</strong>` },
    { label: "Consistency Score", key: (p) => `<strong>${p.consistencyScore}/100</strong>` },
    { 
      label: "Risk Level", 
      key: (p) => p.riskLevel === "High" 
        ? `<span class="ep-badge ep-badge-failed">High Risk</span>` 
        : `<span class="ep-badge ep-badge-verified">Low Risk</span>` 
    },
    { 
      label: "Outcome Prediction", 
      key: (p) => p.outcomePrediction === "On Track" 
        ? `<span class="ep-badge ep-badge-verified">On Track</span>` 
        : `<span class="ep-badge ep-badge-review">At Risk</span>` 
    },
    { 
      label: "Overall EcoLens Score", 
      key: (p) => `<span style="font-size:1.15rem; font-weight:800; color:var(--green-900);">${p.ecoLensScore}</span><span style="font-size:0.8rem; color:var(--ink-faint);">/100</span>` 
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
  epSelectedCompanyProjectId = projectId;

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
      metaEl.textContent = `${p.projectType} \u00b7 ${p.displayLocation} \u00b7 Target: ${epCompFormat(p.target, p.unit)} ${p.unit} \u00b7 Timeline: ${p.timeline}`;
    }

    // Score Breakdown
    const scoreGrid = document.getElementById("eval-score-grid");
    if (scoreGrid) {
      scoreGrid.innerHTML = `
        <div class="score-tile">
          <div class="score-tile-val">${p.progressScore}<span style="font-size:0.9rem; color:var(--ink-faint);">/100</span></div>
          <div class="score-tile-label">Progress Score</div>
        </div>
        <div class="score-tile">
          <div class="score-tile-val">${p.evidenceScore}<span style="font-size:0.9rem; color:var(--ink-faint);">/100</span></div>
          <div class="score-tile-label">Evidence Score</div>
        </div>
        <div class="score-tile">
          <div class="score-tile-val">${p.consistencyScore}<span style="font-size:0.9rem; color:var(--ink-faint);">/100</span></div>
          <div class="score-tile-label">Consistency Score</div>
        </div>
        <div class="score-tile" style="border: 2px solid var(--green-600); background:var(--green-100);">
          <div class="score-tile-val score-highlight">${p.ecoLensScore}<span style="font-size:0.9rem; color:var(--green-900);">/100</span></div>
          <div class="score-tile-label" style="color:var(--green-900);">Overall EcoLens Score</div>
        </div>
      `;
    }

    // Key Risk & Prediction Callouts
    const calloutEl = document.getElementById("eval-callout-banner");
    if (calloutEl) {
      calloutEl.className = `ep-banner ep-banner-${p.status.cls}`;
      calloutEl.innerHTML = p.outcomePrediction === "On Track"
        ? `<strong>Outcome Prediction: ON TRACK.</strong> The verified progress trajectory indicates consistent milestone fulfillment with low delivery risk.`
        : `<strong>Outcome Prediction: AT RISK.</strong> Reality gap detected (${epCompFormat(Math.abs(p.gap), p.unit)} ${epCompShortUnit(p.unit)}). Linear trend indicates potential deadline shortfall.`;
    }

    // Reality Gap metric tiles
    const gapTiles = document.getElementById("eval-reality-tiles");
    if (gapTiles) {
      const ahead = p.gap <= 0;
      gapTiles.innerHTML = `
        <div class="ep-tile">
          <div class="ep-tile-num">${epCompFormat(p.expected, p.unit)}</div>
          <div class="ep-tile-label">Expected Progress to Date</div>
        </div>
        <div class="ep-tile">
          <div class="ep-tile-num">${epCompFormat(p.verified, p.unit)}</div>
          <div class="ep-tile-label">Actual Verified Progress (${p.progressPercent}%)</div>
        </div>
        <div class="ep-tile ep-tile-${ahead ? 'ok' : 'bad'}">
          <div class="ep-tile-num">${ahead ? '+' : ''}${epCompFormat(Math.abs(p.gap), p.unit)}</div>
          <div class="ep-tile-label">Reality Gap (Expected vs Actual)</div>
        </div>
        <div class="ep-tile">
          <div class="ep-tile-num">~${epCompFormat(p.forecast.predictedFinal, p.unit)}</div>
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
            <div class="proj-metric-row"><span>Evidence Confidence</span><strong style="color:var(--green-900);">${ev.evidenceConfidence || '90%'}</strong></div>
          </div>
        </div>

        <div style="background:var(--surface); border:1px solid var(--line); border-radius:var(--radius); padding:22px; box-shadow:var(--shadow);">
          <h4 style="margin:0 0 14px; font-size:1.05rem; color:var(--ink); display:flex; align-items:center; gap:8px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Risk Analysis
          </h4>
          <div style="font-size:0.9rem; line-height:1.7;">
            <div class="proj-metric-row"><span>Current Risk Level</span><strong><span class="ep-badge ${p.riskLevel === 'High' ? 'ep-badge-failed' : 'ep-badge-verified'}">${p.riskLevel}</span></strong></div>
            <div class="proj-metric-row"><span>Progress Anomaly</span><strong>${rk.progressAnomaly || 'Normal'}</strong></div>
            <div class="proj-metric-row"><span>Timeline Risk</span><strong>${rk.timelineRisk || 'Low'}</strong></div>
            <div class="proj-metric-row"><span>Predicted Outcome</span><strong style="color:var(--${p.outcomePrediction === 'On Track' ? 'green-900' : 'red-600'});">${p.outcomePrediction}</strong></div>
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
    const labels = [];
    for (let m = 0; m <= p.durationMonths; m++) labels.push(m);

    const promise = labels.map((m) => (p.target * m) / p.durationMonths);
    const verified = labels.map((m) => {
      const hit = p.cumVerified.find((c) => c[0] === m);
      return hit ? hit[1] : null;
    });

    const f = p.forecast;
    const fs = f.forecastSeries;
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
            label: "Actual Verified Progress",
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
          y: { title: { display: true, text: p.unit }, beginAtZero: true }
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

  const isShortlisted = epShortlistedProjects.has(epSelectedCompanyProjectId);
  if (isShortlisted) {
    btn.className = "btn btn-primary";
    btn.innerHTML = "\u2713 Shortlisted for Decision";
  } else {
    btn.className = "btn btn-primary";
    btn.innerHTML = "+ Shortlist Project";
  }
}

function epToggleShortlist() {
  const btn = document.getElementById("btn-shortlist-project");
  const notificationArea = document.getElementById("decision-feedback");

  if (epShortlistedProjects.has(epSelectedCompanyProjectId)) {
    epShortlistedProjects.delete(epSelectedCompanyProjectId);
    if (notificationArea) {
      notificationArea.innerHTML = `<div class="ep-upload-error" style="background:#f2f4f1; color:var(--ink-soft); border:1px solid var(--line);">Project removed from candidate shortlist.</div>`;
    }
  } else {
    epShortlistedProjects.add(epSelectedCompanyProjectId);
    const p = epCompanyProjects.find(x => x.id === epSelectedCompanyProjectId);
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
    epCompanyProjects = await EcoLensAPI.getCompanyProjects();

    epRenderCompanySummary(epCompanyProjects);
    epRenderCompanyCards(epCompanyProjects);
    epRenderComparisonTable();

    // Check for query param ?project=
    const params = new URLSearchParams(window.location.search);
    const initialProject = params.get("project");
    if (initialProject && epCompanyProjects.some(p => p.id === initialProject)) {
      epSelectedCompanyProjectId = initialProject;
    }

    if (epCompanyProjects.length > 0) {
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
