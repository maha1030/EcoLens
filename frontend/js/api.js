/**
 * EcoLens Frontend Mock API Client
 * 
 * BACKEND INTEGRATION NOTE:
 * This module abstracts data access for the EcoLens frontend.
 * When connecting to your backend services (FastAPI, Express, Django, etc.),
 * replace the simulated mock responses with fetch() calls to your backend endpoints.
 * 
 * Example:
 *   async getProjects() {
 *     const res = await fetch('/api/v1/projects');
 *     return await res.json();
 *   }
 */
"use strict";

const EcoLensAPI = {
  /**
   * Fetch all registered environmental pledge projects.
   * Returns project summaries with targets, verified totals, trust scores, and status.
   */
  async getProjects() {
    // Simulated network latency (instant for demo, adjustable if needed)
    return EP_DATA.projects.map(p => {
      const verified = p.updates.reduce((sum, u) => sum + u.verified, 0);
      const claimed = p.updates.reduce((sum, u) => sum + u.claimed, 0);
      const lastMonth = p.updates[p.updates.length - 1].month;
      const expected = (p.target * lastMonth) / p.durationMonths;
      
      // Calculate forecast
      const forecast = EcoLensAPI._calculateForecast(p);
      const ratio = forecast.predictedFinal / p.target;
      const status = ratio >= 1.0 
        ? { label: "ON TRACK", cls: "ok" }
        : ratio >= 0.9 
          ? { label: "AT RISK", cls: "warn" }
          : { label: "OFF TRACK", cls: "bad" };

      const trust = Math.round(
        p.updates.reduce((sum, u) => sum + u.confidence, 0) / p.updates.length
      );

      return {
        id: p.id,
        name: p.name,
        org: p.org,
        kind: p.kind,
        unit: p.unit,
        target: p.target,
        durationMonths: p.durationMonths,
        startDate: p.startDate,
        deadline: p.deadline,
        site: p.site,
        verified,
        claimed,
        expected,
        trust,
        status,
        forecast
      };
    });
  },

  /**
   * Fetch a single project with its complete update history and verification feed.
   */
  async getProjectById(projectId) {
    const project = EP_DATA.projects.find(p => p.id === projectId);
    if (!project) throw new Error(`Project not found: ${projectId}`);

    const cumVerified = [];
    let sumV = 0;
    for (const u of project.updates) {
      sumV += u.verified;
      cumVerified.push([u.month, sumV]);
    }

    const cumClaimed = [];
    let sumC = 0;
    for (const u of project.updates) {
      sumC += u.claimed;
      cumClaimed.push([u.month, sumC]);
    }

    const lastMonth = project.updates[project.updates.length - 1].month;
    const verified = sumV;
    const expected = (project.target * lastMonth) / project.durationMonths;
    const gap = expected - verified;
    const forecast = EcoLensAPI._calculateForecast(project);
    const ratio = forecast.predictedFinal / project.target;
    const status = ratio >= 1.0 
      ? { label: "ON TRACK", cls: "ok" }
      : ratio >= 0.9 
        ? { label: "AT RISK", cls: "warn" }
        : { label: "OFF TRACK", cls: "bad" };

    const trust = Math.round(
      project.updates.reduce((sum, u) => sum + u.confidence, 0) / project.updates.length
    );

    return {
      ...project,
      verified,
      expected,
      gap,
      trust,
      status,
      forecast,
      cumVerified,
      cumClaimed
    };
  },

  /**
   * Mock evidence photo verification service.
   * Simulates duplicate detection and image hashing against registered database photos.
   */
  async verifyPhotoEvidence(fileOrUrl, label = "evidence photo") {
    // Simulate realistic 350ms verification processing latency
    await new Promise(resolve => setTimeout(resolve, 350));

    const isRecycledDemo = typeof fileOrUrl === "string" && fileOrUrl.includes("tree-03.jpg");
    const isFreshDemo = typeof fileOrUrl === "string" && fileOrUrl.includes("fresh-sample.jpg");

    if (isRecycledDemo) {
      return {
        isDuplicate: true,
        verdict: "DUPLICATE - this exact photo was already submitted",
        cls: "bad",
        matchProject: "Vanamitra Reforestation",
        matchMonth: 3,
        hammingDistance: 0,
        dHash: "00a4c28e931401f0",
        message: "Perceptual hash match found with Month 3 report. Duplicate submission flagged."
      };
    }

    if (isFreshDemo) {
      return {
        isDuplicate: false,
        verdict: "NEW EVIDENCE - no match anywhere in the gallery",
        cls: "ok",
        matchProject: "Vanamitra Reforestation",
        matchMonth: 8,
        hammingDistance: 28,
        dHash: "e872c01948ba003f",
        message: "Unique perceptual hash. No duplicate detected across 22 registered project reports."
      };
    }

    // Custom uploaded file
    return {
      isDuplicate: false,
      verdict: "NEW EVIDENCE - verified unique image",
      cls: "ok",
      matchProject: "Vanamitra Reforestation",
      matchMonth: 5,
      hammingDistance: 31,
      dHash: "f14c80b912a76de3",
      message: "Perceptual hash distance is safely above duplicate threshold (31/64). Verification passed."
    };
  },

  /**
   * Upload evidence photo for verification.
   * BACKEND INTEGRATION: Replace mock logic with POST to /api/v1/evidence/upload
   *
   * @param {File} file - The image file to upload
   * @returns {Promise<{id: string, status: string, message: string}>}
   */
  async uploadEvidence(file) {
    // Validate file using centralized config
    if (typeof EcoLensConfig !== "undefined") {
      const validation = EcoLensConfig.validateFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }
    }

    /* BACKEND INTEGRATION:
     * if (!EcoLensConfig.USE_MOCK) {
     *   const form = new FormData();
     *   form.append("evidence", file);
     *   const res = await fetch(EcoLensConfig.API_BASE_URL + "/evidence/upload", {
     *     method: "POST", body: form
     *   });
     *   if (!res.ok) throw new Error("Upload failed: " + res.statusText);
     *   return await res.json();
     * }
     */

    // Mock: simulate upload latency
    await new Promise(resolve => setTimeout(resolve, 200));
    return {
      id: "demo-" + Date.now(),
      status: "uploaded",
      message: "Evidence photo received (demo mode)."
    };
  },

  /**
   * Retrieve a verification result by evidence ID.
   * BACKEND INTEGRATION: Replace mock logic with GET /api/v1/evidence/:id/result
   *
   * @param {string} evidenceId - The evidence upload ID
   * @returns {Promise<Object>} Verification result
   */
  async getVerificationResult(evidenceId) {
    /* BACKEND INTEGRATION:
     * if (!EcoLensConfig.USE_MOCK) {
     *   const res = await fetch(EcoLensConfig.API_BASE_URL + "/evidence/" + evidenceId + "/result");
     *   if (!res.ok) throw new Error("Verification unavailable: " + res.statusText);
     *   return await res.json();
     * }
     */

    // Mock: return a generic pass result
    await new Promise(resolve => setTimeout(resolve, 150));
    return {
      evidenceId: evidenceId,
      isDuplicate: false,
      verdict: "NEW EVIDENCE - verified unique image",
      cls: "ok",
      matchProject: "Vanamitra Reforestation",
      matchMonth: 5,
      hammingDistance: 31,
      dHash: "f14c80b912a76de3",
      message: "Demo mode: perceptual hash distance is safely above duplicate threshold (31/64). Verification passed.",
      isDemo: true
    };
  },

  /**
   * Fetch projects formatted for the Company / Carbon Credit Buyer dashboard.
   */
  async getCompanyProjects() {
    const projects = await this.getProjects();
    return projects.map(p => {
      const orig = EP_DATA.projects.find(x => x.id === p.id);
      const progressPercent = Math.min(100, Math.round((p.verified / p.target) * 100));
      return {
        ...p,
        projectType: orig.projectType || "Environmental",
        displayLocation: orig.displayLocation || (orig.site ? orig.site.name : "Global"),
        timeline: orig.timeline || `${orig.durationMonths} months`,
        progressPercent,
        ecoLensScore: orig.ecoLensScore || p.trust,
        progressScore: orig.progressScore || 85,
        evidenceScore: orig.evidenceScore || 90,
        consistencyScore: orig.consistencyScore || 95,
        riskLevel: orig.riskLevel || (p.status.cls === "bad" ? "High" : "Low"),
        outcomePrediction: orig.outcomePrediction || (p.status.cls === "bad" ? "At Risk" : "On Track"),
        riskAnalysis: orig.riskAnalysis || {},
        evidenceAnalysis: orig.evidenceAnalysis || {}
      };
    });
  },

  /**
   * Fetch full evaluation details for a specific project (Company view).
   */
  async getProjectEvaluation(projectId) {
    const p = await this.getProjectById(projectId);
    const orig = EP_DATA.projects.find(x => x.id === projectId);
    const progressPercent = Math.min(100, Math.round((p.verified / p.target) * 100));
    return {
      ...p,
      projectType: orig.projectType || "Environmental",
      displayLocation: orig.displayLocation || (orig.site ? orig.site.name : "Global"),
      timeline: orig.timeline || `${orig.durationMonths} months`,
      progressPercent,
      ecoLensScore: orig.ecoLensScore || p.trust,
      progressScore: orig.progressScore || 85,
      evidenceScore: orig.evidenceScore || 90,
      consistencyScore: orig.consistencyScore || 95,
      riskLevel: orig.riskLevel || (p.status.cls === "bad" ? "High" : "Low"),
      outcomePrediction: orig.outcomePrediction || (p.status.cls === "bad" ? "At Risk" : "On Track"),
      riskAnalysis: orig.riskAnalysis || {},
      evidenceAnalysis: orig.evidenceAnalysis || {}
    };
  },

  /**
   * Fetch projects formatted for the Environmental Organization dashboard.
   */
  async getOrganizationProjects() {
    const projects = await this.getCompanyProjects();
    const activeProjects = projects.length;
    const onTrack = projects.filter(p => p.status.cls === "ok").length;
    const atRisk = projects.filter(p => p.status.cls !== "ok").length;
    const evidenceSubmitted = EP_DATA.projects.reduce((sum, p) => sum + p.updates.length, 0);

    return {
      summary: {
        activeProjects,
        onTrack,
        atRisk,
        evidenceSubmitted
      },
      projects
    };
  },

  /**
   * Submit a new progress update for a project (Organization view).
   * In demo mode, simulates async upload and returns confirmation.
   */
  async submitProgressUpdate(updateData) {
    await new Promise(resolve => setTimeout(resolve, 600));
    return {
      success: true,
      updateId: "upd-" + Date.now(),
      message: "Progress update submitted successfully. EcoLens verification checks queued.",
      timestamp: new Date().toISOString()
    };
  },

  /**
   * Helper: Calculate linear regression forecast & 95% confidence bands
   */
  _calculateForecast(project) {
    const pts = [];
    let sum = 0;
    for (const u of project.updates) {
      sum += u.verified;
      pts.push([u.month, sum]);
    }

    const n = pts.length;
    const mx = pts.reduce((s, p) => s + p[0], 0) / n;
    const my = pts.reduce((s, p) => s + p[1], 0) / n;
    let sxy = 0, sxx = 0;
    for (const [x, y] of pts) {
      sxy += (x - mx) * (y - my);
      sxx += (x - mx) ** 2;
    }
    const slope = sxx !== 0 ? sxy / sxx : 0;
    const intercept = my - slope * mx;

    let ss = 0;
    for (const [x, y] of pts) {
      ss += (y - (intercept + slope * x)) ** 2;
    }
    const residStd = Math.sqrt(ss / Math.max(1, n - 2));
    const lastMonth = pts[pts.length - 1][0];
    const predicted = Math.max(0, intercept + slope * project.durationMonths);
    const sumDiffSq = pts.reduce((s, p) => s + (p[0] - mx) ** 2, 0);
    const band = 1.96 * residStd * Math.sqrt(
      1 + 1 / pts.length + (sumDiffSq > 0 ? (project.durationMonths - lastMonth) ** 2 / sumDiffSq : 0)
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
};
