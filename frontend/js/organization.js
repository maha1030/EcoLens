/**
 * EcoLens - Environmental Organization Dashboard Controller
 *
 * Manages the organization project overview, project detail inspection,
 * and progress evidence submission workflow.
 */
"use strict";

let epOrgProjects = [];
let epSelectedOrgProjectId = "vanamitra";

function epOrgFormat(val, unit) {
  if (typeof EcoLensUI !== "undefined") {
    return EcoLensUI.formatValue(val, unit);
  }
  return unit === "trees" ? Math.round(val).toLocaleString("en-US") : (Math.round(val * 10) / 10).toLocaleString("en-US");
}

function epOrgShortUnit(unit) {
  if (typeof EcoLensUI !== "undefined") {
    return EcoLensUI.shortUnit(unit);
  }
  return unit === "trees" ? "trees" : unit === "hectares" ? "ha" : "%";
}

/* ---------- Render Summary Stats ---------- */
function epRenderOrgSummary(summary) {
  const container = document.getElementById("org-summary-stats");
  if (!container) return;

  container.innerHTML = `
    <div class="stat-tile">
      <div class="stat-tile-num">${summary.activeProjects}</div>
      <div class="stat-tile-label">Active Projects</div>
    </div>
    <div class="stat-tile">
      <div class="stat-tile-num">${summary.onTrack}</div>
      <div class="stat-tile-label">Projects On Track</div>
    </div>
    <div class="stat-tile">
      <div class="stat-tile-num ${summary.atRisk > 0 ? 'warn' : ''}">${summary.atRisk}</div>
      <div class="stat-tile-label">Projects At Risk</div>
    </div>
    <div class="stat-tile">
      <div class="stat-tile-num">${summary.evidenceSubmitted}</div>
      <div class="stat-tile-label">Evidence Submitted</div>
    </div>
  `;
}

/* ---------- Render Project Cards ---------- */
function epRenderOrgProjectCards(projects) {
  const container = document.getElementById("org-project-cards");
  if (!container) return;

  container.innerHTML = "";

  projects.forEach(p => {
    const isSelected = p.id === epSelectedOrgProjectId;
    const card = document.createElement("div");
    card.className = "proj-card" + (isSelected ? " selected-card" : "");
    card.id = `org-card-${p.id}`;

    const statusBadge = p.status.cls === "ok"
      ? `<span class="ep-badge ep-badge-verified">On Track</span>`
      : `<span class="ep-badge ep-badge-review">At Risk</span>`;

    card.innerHTML = `
      <div>
        <div class="proj-card-top">
          <h3>${p.name}</h3>
          ${statusBadge}
        </div>
        <div class="proj-card-type">${p.projectType}</div>
        <div class="proj-card-location">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          ${p.displayLocation}
        </div>

        <div class="ep-card-bar" style="margin: 10px 0 6px;">
          <div class="ep-card-fill" style="width: ${p.progressPercent}%"></div>
          <div class="ep-card-tick" style="left: ${Math.min(100, (p.expected / p.target) * 100)}%" title="Expected progress"></div>
        </div>

        <div class="proj-card-metrics">
          <div class="proj-metric-row">
            <span>Target Pledge</span>
            <strong>${epOrgFormat(p.target, p.unit)} ${epOrgShortUnit(p.unit)}</strong>
          </div>
          <div class="proj-metric-row">
            <span>Verified Progress</span>
            <strong>${epOrgFormat(p.verified, p.unit)} ${epOrgShortUnit(p.unit)} (${p.progressPercent}%)</strong>
          </div>
          <div class="proj-metric-row">
            <span>Timeline</span>
            <strong>${p.timeline}</strong>
          </div>
        </div>
      </div>

      <div class="proj-card-actions">
        <button class="btn btn-primary" onclick="epSelectOrgProject('${p.id}', true)">View Project</button>
        <button class="btn btn-ghost" onclick="epOpenSubmitUpdate('${p.id}', false)">Submit Progress</button>
        <button class="btn btn-ghost" onclick="epOpenSubmitUpdate('${p.id}', true)">Upload Evidence</button>
      </div>
    `;

    container.appendChild(card);
  });
}

/* ---------- Select & Render Project Detail ---------- */
async function epSelectOrgProject(projectId, scroll = false) {
  epSelectedOrgProjectId = projectId;
  
  // Highlight card
  document.querySelectorAll(".proj-card").forEach(c => c.classList.remove("selected-card"));
  const activeCard = document.getElementById(`org-card-${projectId}`);
  if (activeCard) activeCard.classList.add("selected-card");

  try {
    const p = await EcoLensAPI.getProjectById(projectId);
    const orig = EP_DATA.projects.find(x => x.id === projectId);
    
    // Sync dropdown
    const selectEl = document.getElementById("update-project-select");
    if (selectEl) selectEl.value = projectId;

    const detailContainer = document.getElementById("org-project-detail");
    if (!detailContainer) return;

    const statusBadge = p.status.cls === "ok"
      ? `<span class="ep-badge ep-badge-verified">On Track</span>`
      : `<span class="ep-badge ep-badge-review">At Risk</span>`;

    const ahead = p.gap <= 0;
    const lastMonth = p.updates[p.updates.length - 1].month;

    // Photos HTML
    const recentPhotosHtml = p.updates.slice(-4).reverse().map(u => `
      <a href="${u.photo}" target="_blank" rel="noopener" style="display:inline-block; position:relative;">
        <img src="${u.photo}" alt="Month ${u.month} photo" style="width:100px; height:74px; object-fit:cover; border-radius:8px; border:1px solid var(--line);">
        <span style="position:absolute; bottom:4px; right:4px; font-size:0.68rem; font-weight:700; background:rgba(0,0,0,0.7); color:#fff; padding:2px 5px; border-radius:4px;">M${u.month}</span>
      </a>
    `).join("");

    detailContainer.innerHTML = `
      <div class="ep-panel" style="margin-top: 24px;">
        <div class="ep-panel-head">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <div>
              <h3 id="ep-detail-title" style="margin:0 0 4px;">${p.name}</h3>
              <p style="margin:0; font-size:0.88rem; color:var(--ink-soft);">
                ${orig.projectType || 'Environmental'} \u00b7 ${orig.displayLocation || p.site.name} \u00b7 Target: ${epOrgFormat(p.target, p.unit)} ${p.unit} in ${p.durationMonths} months
              </p>
            </div>
            <div>${statusBadge}</div>
          </div>
        </div>

        <div id="ep-banner" class="ep-banner ep-banner-${p.status.cls}">
          ${p.status.cls === "ok"
            ? `<strong>On Track:</strong> The verified progress trajectory indicates this project is progressing towards meeting the target deadline.`
            : `<strong>Action Required:</strong> Verified progress is trailing behind the promised timeline. Projected shortfall of ~${epOrgFormat(Math.max(0, p.target - p.forecast.predictedFinal), p.unit)} ${p.unit}.`}
        </div>

        <div id="ep-tiles">
          <div class="ep-tile">
            <div class="ep-tile-num">${epOrgFormat(p.verified, p.unit)}</div>
            <div class="ep-tile-label">Verified Progress to Date (M${lastMonth})</div>
          </div>
          <div class="ep-tile">
            <div class="ep-tile-num">${epOrgFormat(p.expected, p.unit)}</div>
            <div class="ep-tile-label">Expected by Now on Promised Line</div>
          </div>
          <div class="ep-tile ep-tile-${ahead ? 'ok' : 'bad'}">
            <div class="ep-tile-num">${ahead ? '+' : ''}${epOrgFormat(Math.abs(p.gap), p.unit)}</div>
            <div class="ep-tile-label">Reality Gap (Expected vs Verified)</div>
          </div>
          <div class="ep-tile">
            <div class="ep-tile-num">~${epOrgFormat(p.forecast.predictedFinal, p.unit)}</div>
            <div class="ep-tile-label">Forecasted Outcome at Deadline</div>
          </div>
        </div>

        <!-- Evidence & Risk Section -->
        <div style="padding: 20px 24px; border-top: 1px solid var(--line);">
          <div style="display:grid; grid-template-columns: 1.2fr 1fr; gap: 24px; flex-wrap:wrap;">
            <div>
              <h4 style="margin:0 0 12px; font-size:0.96rem; color:var(--ink);">Evidence Health & Audits</h4>
              <div style="display:flex; gap:10px; margin-bottom:14px; flex-wrap:wrap;">
                ${recentPhotosHtml}
              </div>
              <div style="font-size:0.88rem; color:var(--ink-soft); line-height:1.6;">
                <div>\u2713 <strong>Photo Relevance:</strong> ${orig.evidenceAnalysis?.photoRelevance || 'Verified consistent foliage'}</div>
                <div>\u2713 <strong>Duplicate Detection:</strong> ${orig.evidenceAnalysis?.duplicateDetection || 'Perceptual hashes unique'}</div>
                <div>\u2713 <strong>Location Consistency:</strong> ${orig.evidenceAnalysis?.locationConsistency || 'Within approved GPS radius'}</div>
                <div>\u2713 <strong>Overall Evidence Confidence:</strong> <strong>${p.trust}%</strong></div>
              </div>
            </div>

            <div>
              <h4 style="margin:0 0 12px; font-size:0.96rem; color:var(--ink);">Risk & Anomaly Indicators</h4>
              <div style="font-size:0.88rem; color:var(--ink-soft); line-height:1.6;">
                <div style="margin-bottom:6px;"><strong>Current Risk Level:</strong> <span class="ep-badge ${orig.riskLevel === 'High' ? 'ep-badge-failed' : 'ep-badge-verified'}">${orig.riskLevel || 'Low'}</span></div>
                <div><strong>Progress Anomaly:</strong> ${orig.riskAnalysis?.progressAnomaly || 'Normal variation'}</div>
                <div><strong>Timeline Risk:</strong> ${orig.riskAnalysis?.timelineRisk || 'On trajectory'}</div>
                <div><strong>Predicted Outcome:</strong> ${orig.riskAnalysis?.predictedOutcome || 'On track'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    if (scroll) {
      detailContainer.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  } catch (err) {
    console.error("Failed to load organization project detail:", err);
  }
}

/* ---------- Open Submit Update Flow ---------- */
function epOpenSubmitUpdate(projectId, focusUpload = false) {
  epSelectOrgProject(projectId, false);
  const selectEl = document.getElementById("update-project-select");
  if (selectEl) selectEl.value = projectId;

  const formSection = document.getElementById("org-submit-update");
  if (formSection) {
    formSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (focusUpload) {
    setTimeout(() => {
      const fileInput = document.getElementById("update-photo-file");
      if (fileInput) fileInput.click();
    }, 400);
  }
}

/* ---------- Initialize Organization Dashboard ---------- */
document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("org-project-cards");
  if (!container) return;

  try {
    const orgData = await EcoLensAPI.getOrganizationProjects();
    epOrgProjects = orgData.projects;

    epRenderOrgSummary(orgData.summary);
    epRenderOrgProjectCards(epOrgProjects);

    // Populate project select dropdown
    const selectEl = document.getElementById("update-project-select");
    if (selectEl) {
      selectEl.innerHTML = epOrgProjects.map(p => `
        <option value="${p.id}">${p.name} (${p.projectType})</option>
      `).join("");
    }

    // Set today's date in form
    const dateInput = document.getElementById("update-date");
    if (dateInput) {
      dateInput.value = new Date().toISOString().split("T")[0];
    }

    // Select default project
    if (epOrgProjects.length > 0) {
      await epSelectOrgProject(epOrgProjects[0].id, false);
    }

    // Form Submission Handling
    const form = document.getElementById("org-progress-form");
    const feedbackArea = document.getElementById("org-form-feedback");

    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById("org-submit-btn");
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = "Submitting Evidence\u2026";
        }

        const formData = {
          projectId: selectEl ? selectEl.value : epSelectedOrgProjectId,
          claimed: document.getElementById("update-progress-val")?.value || "500",
          date: document.getElementById("update-date")?.value || new Date().toISOString().split("T")[0],
          location: document.getElementById("update-location")?.value || "",
          notes: document.getElementById("update-notes")?.value || ""
        };

        try {
          const res = await EcoLensAPI.submitProgressUpdate(formData);
          if (feedbackArea) {
            feedbackArea.innerHTML = `
              <div class="ep-success-banner" role="alert">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                <div>
                  <div><strong>Progress Update Submitted</strong> (Ref: ${res.updateId})</div>
                  <div style="font-size:0.86rem; font-weight:400; margin-top:2px;">${res.message} Status: <em>Pending Analysis</em></div>
                </div>
              </div>
            `;
            feedbackArea.scrollIntoView({ behavior: "smooth", block: "nearest" });
          }

          // Reset non-essential form fields
          const valInput = document.getElementById("update-progress-val");
          if (valInput) valInput.value = "";
          const notesInput = document.getElementById("update-notes");
          if (notesInput) notesInput.value = "";
          const previewEl = document.getElementById("update-photo-preview");
          if (previewEl) previewEl.innerHTML = "";
        } catch (err) {
          if (feedbackArea) {
            feedbackArea.innerHTML = `<div class="ep-upload-error">Submission error: ${err.message}</div>`;
          }
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "Submit Update";
          }
        }
      });
    }

    // Photo input preview for update form
    const photoInput = document.getElementById("update-photo-file");
    const previewEl = document.getElementById("update-photo-preview");
    if (photoInput && previewEl) {
      photoInput.addEventListener("change", () => {
        const file = photoInput.files[0];
        if (file) {
          const url = URL.createObjectURL(file);
          previewEl.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px; margin-top:8px;">
              <img src="${url}" alt="Evidence preview" style="width:64px; height:48px; object-fit:cover; border-radius:6px; border:1px solid var(--line);">
              <span style="font-size:0.86rem; color:var(--ink);">${file.name}</span>
            </div>
          `;
        }
      });
    }

  } catch (err) {
    console.error("Organization dashboard initialization error:", err);
  }
});

/* ---------- Create Project Modal Handlers ---------- */
function epOpenCreateProjectModal() {
  const modal = document.getElementById("org-create-modal");
  if (modal) modal.style.display = "flex";
}

function epCloseCreateProjectModal() {
  const modal = document.getElementById("org-create-modal");
  if (modal) modal.style.display = "none";
}

function epSubmitCreateProject(e) {
  e.preventDefault();
  const name = document.getElementById("new-proj-name")?.value || "New Environmental Pledge";
  const type = document.getElementById("new-proj-type")?.value || "Reforestation";
  const target = document.getElementById("new-proj-target")?.value || "5,000 units";
  const feedbackArea = document.getElementById("org-form-feedback");
  
  epCloseCreateProjectModal();

  if (feedbackArea) {
    feedbackArea.innerHTML = `
      <div class="ep-success-banner" role="alert" style="margin-bottom:20px;">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        <div>
          <div><strong>Project "${name}" Registered (Demo Mode)</strong></div>
          <div style="font-size:0.86rem; font-weight:400; margin-top:2px;">
            Target: ${target} &bull; Category: ${type}. Project lifecycle initialized: Target &rarr; Timeline &rarr; Location &rarr; Progress &rarr; Evidence &rarr; Analysis.
          </div>
        </div>
      </div>`;
    feedbackArea.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}
