/**
 * EcoLens - Environmental Organization Dashboard Controller
 *
 * Manages the organization project overview, project detail inspection,
 * and progress evidence submission workflow.
 */
"use strict";

let epOrgProjects = [];
let epSelectedOrgProjectId = null;
let epIsSubmittingProgress = false;

function epGetLocalIsoDate() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

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

function epEsc(str) {
  if (typeof EcoLensUI !== "undefined" && EcoLensUI.escapeHtml) {
    return EcoLensUI.escapeHtml(str);
  }
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* ---------- Render Summary Stats ---------- */
function epRenderOrgSummary(summary) {
  const container = document.getElementById("org-summary-stats");
  if (!container) return;

  container.innerHTML = `
    <div class="stat-tile">
      <div class="stat-tile-num">${summary.activeProjects || 0}</div>
      <div class="stat-tile-label">Active Projects</div>
    </div>
    <div class="stat-tile">
      <div class="stat-tile-num">${summary.onTrack || 0}</div>
      <div class="stat-tile-label">Projects On Track</div>
    </div>
    <div class="stat-tile">
      <div class="stat-tile-num ${summary.atRisk > 0 ? 'warn' : ''}">${summary.atRisk || 0}</div>
      <div class="stat-tile-label">Projects At Risk</div>
    </div>
    <div class="stat-tile">
      <div class="stat-tile-num">${summary.evidenceSubmitted || 0}</div>
      <div class="stat-tile-label">Evidence Submitted</div>
    </div>
  `;
}

/* ---------- Render Project Cards ---------- */
function epRenderOrgProjectCards(projects) {
  const container = document.getElementById("org-project-cards");
  if (!container) return;

  container.innerHTML = "";

  if (!projects || projects.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 30px; text-align: center; background: var(--surface); border: 1px dashed var(--line); border-radius: var(--radius);">
        <h4 style="margin:0 0 8px; color: var(--ink);">No projects found</h4>
        <p style="margin:0 0 16px; font-size: 0.9rem; color: var(--ink-soft);">Register your first environmental project pledge to begin tracking progress and uploading evidence.</p>
        <button class="btn btn-primary" onclick="epOpenCreateProjectModal()">+ Create New Project</button>
      </div>
    `;
    return;
  }

  projects.forEach(p => {
    const isSelected = String(p.id) === String(epSelectedOrgProjectId);
    const card = document.createElement("div");
    card.className = "proj-card" + (isSelected ? " selected-card" : "");
    card.id = `org-card-${p.id}`;

    const statusBadge = (p.status && p.status.cls === "ok")
      ? `<span class="ep-badge ep-badge-verified">${p.status.label || "On Track"}</span>`
      : `<span class="ep-badge ep-badge-review">${p.status ? p.status.label : "Off Track"}</span>`;

    card.innerHTML = `
      <div>
        <div class="proj-card-top">
          <h3>${epEsc(p.name)}</h3>
          ${statusBadge}
        </div>
        <div class="proj-card-type">${epEsc(p.projectType || p.kind || 'Environmental')}</div>
        <div class="proj-card-location">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          ${epEsc(p.displayLocation || (p.site ? p.site.name : 'Site Location'))}
        </div>

        <div class="ep-card-bar" style="margin: 10px 0 6px;">
          <div class="ep-card-fill" style="width: ${p.progressPercent || 0}%"></div>
          <div class="ep-card-tick" style="left: ${Math.min(100, p.target ? ((p.expected || 0) / p.target) * 100 : 0)}%" title="Expected progress"></div>
        </div>

        <div class="proj-card-metrics">
          <div class="proj-metric-row">
            <span>Target Pledge</span>
            <strong>${epOrgFormat(p.target || 0, p.unit)} ${epOrgShortUnit(p.unit)}</strong>
          </div>
          <div class="proj-metric-row">
            <span>Recorded Progress</span>
            <strong>${epOrgFormat(p.verified || 0, p.unit)} ${epOrgShortUnit(p.unit)} (${p.progressPercent || 0}%)</strong>
          </div>
          <div class="proj-metric-row">
            <span>Timeline</span>
            <strong>${p.timeline || `${p.durationMonths || 12} months`}</strong>
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
  if (!projectId) return;
  epSelectedOrgProjectId = String(projectId);
  
  // Highlight card
  document.querySelectorAll(".proj-card").forEach(c => c.classList.remove("selected-card"));
  const activeCard = document.getElementById(`org-card-${projectId}`);
  if (activeCard) activeCard.classList.add("selected-card");

  try {
    const p = await EcoLensAPI.getProjectById(projectId);
    
    // Sync dropdown
    const selectEl = document.getElementById("update-project-select");
    if (selectEl) selectEl.value = String(projectId);

    const detailContainer = document.getElementById("org-project-detail");
    if (!detailContainer) return;

    const statusBadge = (p.status && p.status.cls === "ok")
      ? `<span class="ep-badge ep-badge-verified">${p.status.label || "On Track"}</span>`
      : `<span class="ep-badge ep-badge-review">${p.status ? p.status.label : "Off Track"}</span>`;

    const ahead = (p.gap || 0) <= 0;
    const updates = p.updates || [];
    const lastMonth = updates.length > 0 ? updates[updates.length - 1].month : 1;

    // Photos HTML
    const evidenceItems = p.evidenceItems || [];
    const recentPhotosHtml = evidenceItems.length > 0 ? evidenceItems.slice(0, 4).map((ev, idx) => `
      <a href="${epEsc(ev.file_url)}" target="_blank" rel="noopener" style="display:inline-block; position:relative;">
        <img src="${epEsc(ev.file_url)}" crossorigin="anonymous" alt="${epEsc(ev.file_name || 'Evidence photo')}" style="width:100px; height:74px; object-fit:cover; border-radius:8px; border:1px solid var(--line);" title="${epEsc(ev.description || ev.file_name || '')}">
        <span style="position:absolute; bottom:4px; right:4px; font-size:0.68rem; font-weight:700; background:rgba(0,0,0,0.7); color:#fff; padding:2px 5px; border-radius:4px;">#${ev.evidence_id || idx + 1}</span>
      </a>
    `).join("") : '<p style="font-size:0.86rem; color:var(--ink-faint); margin:0;">No evidence photos uploaded yet.</p>';

    const shortfall = (p.forecast && p.forecast.predictedFinal < (p.target || 0))
      ? ((p.target || 0) - p.forecast.predictedFinal)
      : 0;
    const bannerText = (p.status && p.status.cls === "ok")
      ? `<strong>On Track:</strong> The recorded progress trajectory indicates this project is progressing towards meeting the target deadline.`
      : (shortfall > 0
        ? `<strong>${p.status ? p.status.label : 'Action Required'}:</strong> Recorded progress is trailing behind the promised timeline. Projected shortfall of ~${epOrgFormat(shortfall, p.unit)} ${p.unit}.`
        : `<strong>${p.status ? p.status.label : 'Action Required'}:</strong> Current progress trails the scheduled milestone, but the projected trend reaches the promised target of ${epOrgFormat(p.target || 0, p.unit)} ${p.unit} by the deadline.`);

    const riskBadgeCls = p.riskLevel === 'High' ? 'ep-badge-failed' : (p.riskLevel === 'Low' ? 'ep-badge-verified' : 'ep-badge-pending');
    const riskLabel = p.riskLevel ? `${p.riskLevel} Risk` : 'Pending Data';
    const outcomeBadgeCls = p.outcomePrediction === 'On Track' ? 'ep-badge-verified' : ((p.outcomePrediction === 'At Risk' || p.outcomePrediction === 'Off Track') ? 'ep-badge-review' : 'ep-badge-pending');

    detailContainer.innerHTML = `
      <div class="ep-panel" style="margin-top: 24px;">
        <div class="ep-panel-head">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <div>
              <h3 id="ep-detail-title" style="margin:0 0 4px;">${epEsc(p.name)}</h3>
              <p style="margin:0; font-size:0.88rem; color:var(--ink-soft);">
                ${epEsc(p.projectType || 'Environmental')} \u00b7 ${epEsc(p.displayLocation || (p.site ? p.site.name : 'Site'))} \u00b7 Target: ${epOrgFormat(p.target || 0, p.unit)} ${p.unit} in ${p.durationMonths || 12} months
              </p>
            </div>
            <div>${statusBadge}</div>
          </div>
        </div>

        <div id="ep-banner" class="ep-banner ep-banner-${p.status ? p.status.cls : 'ok'}">
          ${bannerText}
        </div>

        <div id="ep-tiles">
          <div class="ep-tile">
            <div class="ep-tile-num">${epOrgFormat(p.verified || 0, p.unit)}</div>
            <div class="ep-tile-label">Recorded Progress to Date (M${lastMonth})</div>
          </div>
          <div class="ep-tile">
            <div class="ep-tile-num">${epOrgFormat(p.expected || 0, p.unit)}</div>
            <div class="ep-tile-label">Expected by Now on Promised Line</div>
          </div>
          <div class="ep-tile ep-tile-${ahead ? 'ok' : 'bad'}">
            <div class="ep-tile-num">${ahead ? '+' : ''}${epOrgFormat(Math.abs(p.gap || 0), p.unit)}</div>
            <div class="ep-tile-label">Reality Gap (Expected vs Recorded)</div>
          </div>
          <div class="ep-tile">
            <div class="ep-tile-num">~${epOrgFormat(p.forecast ? p.forecast.predictedFinal : (p.target || 0), p.unit)}</div>
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
                <div>\u2713 <strong>Photo Relevance:</strong> ${epEsc(p.evidenceAnalysis?.photoRelevance || 'Verification Pending')}</div>
                <div>\u2713 <strong>Duplicate Detection:</strong> ${epEsc(p.evidenceAnalysis?.duplicateDetection || 'Verification Pending')}</div>
                <div>\u2713 <strong>Location Consistency:</strong> ${epEsc(p.evidenceAnalysis?.locationConsistency || 'Verification Pending (Field GPS coordinates not recorded in database)')}</div>
                <div>\u2713 <strong>Overall Evidence Confidence:</strong> <strong>${p.evidenceAnalysis?.evidenceConfidence || (p.trust ? `${p.trust}%` : 'Pending Data')}</strong></div>
              </div>
            </div>

            <div>
              <h4 style="margin:0 0 12px; font-size:0.96rem; color:var(--ink);">Risk & Anomaly Indicators</h4>
              <div style="font-size:0.88rem; color:var(--ink-soft); line-height:1.6;">
                <div style="margin-bottom:6px;"><strong>Current Risk Level:</strong> <span class="ep-badge ${riskBadgeCls}">${riskLabel}</span></div>
                <div><strong>Progress Anomaly:</strong> ${epEsc(p.riskAnalysis?.progressAnomaly || 'Normal variation')}</div>
                <div><strong>Timeline Risk:</strong> ${epEsc(p.riskAnalysis?.timelineRisk || 'On trajectory')}</div>
                <div><strong>Predicted Outcome:</strong> <span class="ep-badge ${outcomeBadgeCls}">${epEsc(p.outcomePrediction || 'Pending Data')}</span></div>
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
  if (projectId) epSelectOrgProject(projectId, false);
  const selectEl = document.getElementById("update-project-select");
  if (selectEl && projectId) selectEl.value = String(projectId);

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
    epOrgProjects = orgData.projects || [];

    epRenderOrgSummary(orgData.summary || { activeProjects: epOrgProjects.length, onTrack: epOrgProjects.length, atRisk: 0, evidenceSubmitted: 0 });
    epRenderOrgProjectCards(epOrgProjects);

    // Populate project select dropdown
    const selectEl = document.getElementById("update-project-select");
    if (selectEl) {
      if (epOrgProjects.length > 0) {
        selectEl.innerHTML = epOrgProjects.map(p => `
          <option value="${p.id}">${epEsc(p.name)} (${epEsc(p.projectType || p.kind || 'Project')})</option>
        `).join("");
      } else {
        selectEl.innerHTML = `<option value="">No active projects</option>`;
      }
    }

    // Set today's date in form
    const dateInput = document.getElementById("update-date");
    if (dateInput) {
      dateInput.value = epGetLocalIsoDate();
    }

    // Select default project
    if (epOrgProjects.length > 0) {
      epSelectedOrgProjectId = String(epOrgProjects[0].id);
      await epSelectOrgProject(epOrgProjects[0].id, false);
    }

    // Form Submission Handling
    const form = document.getElementById("org-progress-form");
    const feedbackArea = document.getElementById("org-form-feedback");

    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (epIsSubmittingProgress) return;
        epIsSubmittingProgress = true;

        const submitBtn = document.getElementById("org-submit-btn");
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = "Submitting Evidence\u2026";
        }

        const projectId = selectEl ? selectEl.value : epSelectedOrgProjectId;
        const claimed = document.getElementById("update-progress-val")?.value || "500";
        const date = document.getElementById("update-date")?.value || epGetLocalIsoDate();
        const location = document.getElementById("update-location")?.value || "";
        const notes = document.getElementById("update-notes")?.value || "";
        const photoInput = document.getElementById("update-photo-file");

        let latitude = null;
        let longitude = null;
        if (location && location.includes(",")) {
          const parts = location.split(",").map(s => parseFloat(s.trim()));
          if (!isNaN(parts[0]) && parts[0] >= -90 && parts[0] <= 90 &&
              !isNaN(parts[1]) && parts[1] >= -180 && parts[1] <= 180) {
            latitude = parts[0];
            longitude = parts[1];
          }
        }

        if (!projectId) {
          alert("Please select or create a project first.");
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "Submit Update"; }
          epIsSubmittingProgress = false;
          return;
        }

        try {
          // 1. Post progress update
          const res = await EcoLensAPI.submitProgressUpdate({
            projectId,
            claimed,
            date,
            location,
            notes,
            latitude,
            longitude
          });

          // 2. Upload evidence photo if selected
          let evidenceErrMessage = null;
          if (photoInput && photoInput.files && photoInput.files[0]) {
            try {
              const progressUpdateId = res.id || res.updateId || null;
              await EcoLensAPI.uploadEvidence(projectId, photoInput.files[0], notes, progressUpdateId);
            } catch (evErr) {
              console.warn("Evidence photo upload notice:", evErr.message);
              evidenceErrMessage = evErr.message;
            }
          }

          if (feedbackArea) {
            if (evidenceErrMessage) {
              feedbackArea.innerHTML = `
                <div class="ep-upload-error" role="alert" style="margin-bottom:12px; padding:12px 16px; background:#fee2e2; border:1px solid #f87171; color:#991b1b; border-radius:8px;">
                  <strong>Progress update saved, but evidence photo upload failed:</strong> ${evidenceErrMessage}
                </div>
              `;
            } else {
              feedbackArea.innerHTML = `
                <div class="ep-success-banner" role="alert">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  <div>
                    <div><strong>Progress Update Submitted</strong> (Ref: ${res.updateId})</div>
                    <div style="font-size:0.86rem; font-weight:400; margin-top:2px;">${res.message} Status: <em>Pending Analysis</em></div>
                  </div>
                </div>
              `;
            }
            feedbackArea.scrollIntoView({ behavior: "smooth", block: "nearest" });
          }

          // Refresh details & cards
          const updatedOrg = await EcoLensAPI.getOrganizationProjects();
          epOrgProjects = updatedOrg.projects || [];
          epRenderOrgSummary(updatedOrg.summary);
          epRenderOrgProjectCards(epOrgProjects);
          await epSelectOrgProject(projectId, false);

          // Reset non-essential form fields
          const valInput = document.getElementById("update-progress-val");
          if (valInput) valInput.value = "";
          const notesInput = document.getElementById("update-notes");
          if (notesInput) notesInput.value = "";
          const previewEl = document.getElementById("update-photo-preview");
          if (previewEl) previewEl.innerHTML = "";
          if (photoInput) photoInput.value = "";
        } catch (err) {
          if (feedbackArea) {
            feedbackArea.innerHTML = `<div class="ep-upload-error">Submission error: ${err.message}</div>`;
          }
        } finally {
          epIsSubmittingProgress = false;
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

async function epSubmitCreateProject(e) {
  e.preventDefault();
  const name = document.getElementById("new-proj-name")?.value || "New Environmental Pledge";
  const type = document.getElementById("new-proj-type")?.value || "Reforestation";
  const targetStr = document.getElementById("new-proj-target")?.value || "5000";
  const durationStr = document.getElementById("new-proj-duration")?.value || "12 months";
  const locStr = document.getElementById("new-proj-location")?.value || "18.754, 73.406";
  const feedbackArea = document.getElementById("org-form-feedback");

  const targetVal = parseFloat(targetStr.replace(/[^0-9.]/g, "")) || 1000.0;
  const unit = targetStr.includes("ha") ? "hectares" : targetStr.includes("%") ? "%" : "trees";
  
  const coords = locStr.split(",").map(s => parseFloat(s.trim()));
  const lat = coords[0] || 18.754;
  const lng = coords[1] || 73.406;

  try {
    const newProj = await EcoLensAPI.createProject({
      name,
      organization: "Vanamitra Foundation",
      project_type: type,
      target_value: targetVal,
      target_unit: unit,
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 365*24*60*60*1000).toISOString(),
      latitude: lat,
      longitude: lng,
      description: `${type} project pledge`
    });

    epCloseCreateProjectModal();

    // Reload projects
    const orgData = await EcoLensAPI.getOrganizationProjects();
    epOrgProjects = orgData.projects || [];
    epRenderOrgSummary(orgData.summary);
    epRenderOrgProjectCards(epOrgProjects);

    // Refresh select dropdown
    const selectEl = document.getElementById("update-project-select");
    if (selectEl && epOrgProjects.length > 0) {
      selectEl.innerHTML = epOrgProjects.map(p => `
        <option value="${p.id}">${epEsc(p.name)} (${epEsc(p.projectType || p.kind || 'Project')})</option>
      `).join("");
    }

    const createdId = newProj.id ? String(newProj.id) : (epOrgProjects.length ? String(epOrgProjects[epOrgProjects.length-1].id) : null);
    if (createdId) {
      await epSelectOrgProject(createdId, false);
    }

    if (feedbackArea) {
      feedbackArea.innerHTML = `
        <div class="ep-success-banner" role="alert" style="margin-bottom:20px;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          <div>
            <div><strong>Project "${epEsc(newProj.name || name)}" Registered</strong></div>
            <div style="font-size:0.86rem; font-weight:400; margin-top:2px;">
              Target: ${targetVal} ${unit} &bull; Category: ${type}. Project lifecycle initialized on backend database!
            </div>
          </div>
        </div>`;
      feedbackArea.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  } catch (err) {
    alert("Error creating project: " + err.message);
  }
}
