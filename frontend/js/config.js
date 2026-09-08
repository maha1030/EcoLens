/**
 * EcoLens - Centralized Configuration
 *
 * BACKEND INTEGRATION NOTE:
 * When connecting to a real backend, set USE_MOCK to false and
 * set API_BASE_URL to your backend endpoint (e.g. "/api/v1").
 * All API functions in api.js will then call real endpoints
 * instead of returning mock data.
 */
"use strict";

const EcoLensConfig = {
  /* ---- API Settings ---- */
  API_BASE_URL: "",          // Empty = mock mode; set to "/api/v1" for real backend
  USE_MOCK: true,            // true = demo/mock responses; false = call real endpoints

  /* ---- File Upload Validation ---- */
  MAX_FILE_SIZE_MB: 10,
  ACCEPTED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  ACCEPTED_EXTENSIONS: [".jpg", ".jpeg", ".png", ".webp", ".gif"],

  /* ---- Multi-Step Loading Messages ---- */
  LOADING_STEPS: [
    { message: "Uploading evidence\u2026", duration: 500 },
    { message: "Analyzing submission\u2026", duration: 600 },
    { message: "Checking duplicate records\u2026", duration: 600 },
    { message: "Preparing verification result\u2026", duration: 400 }
  ],

  /* ---- Consistent Status System ---- */
  STATUS: {
    verified:  { label: "Verified",            cls: "ep-badge-verified", icon: "\u2713" },
    pending:   { label: "Pending Analysis",    cls: "ep-badge-pending",  icon: "\u2026" },
    review:    { label: "Needs Review",        cls: "ep-badge-review",   icon: "\u26A0" },
    failed:    { label: "Verification Failed", cls: "ep-badge-failed",   icon: "\u2717" },
    offtrack:  { label: "Off Track",           cls: "ep-badge-failed",   icon: "\u2717" },
    ontrack:   { label: "On Track",            cls: "ep-badge-verified", icon: "\u2713" }
  },

  /* ---- Dashboard Status Mapping (forecast ratio to status) ---- */
  getProjectStatus(ratio) {
    if (ratio >= 1.0) return { label: "ON TRACK",  cls: "ok" };
    if (ratio >= 0.9) return { label: "AT RISK",   cls: "warn" };
    return               { label: "OFF TRACK", cls: "bad" };
  },

  /* ---- Helpers ---- */
  validateFile(file) {
    if (!file) return { valid: false, error: "No file selected." };

    const maxBytes = this.MAX_FILE_SIZE_MB * 1024 * 1024;
    if (file.size > maxBytes) {
      return { valid: false, error: "File exceeds " + this.MAX_FILE_SIZE_MB + " MB limit. Please choose a smaller image." };
    }

    if (!this.ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      const ext = file.name.split(".").pop().toLowerCase();
      const validExt = this.ACCEPTED_EXTENSIONS.some(function(e) { return e.replace(".", "") === ext; });
      if (!validExt) {
        return { valid: false, error: "Unsupported format. Please use JPEG, PNG, WebP, or GIF." };
      }
    }

    return { valid: true, error: null };
  }
};
