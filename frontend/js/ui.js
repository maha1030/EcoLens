/**
 * EcoLens - UI Component Utilities
 *
 * Centralized UI helpers for consistent badges, formatters,
 * and notification/error elements across all EcoLens pages.
 */
"use strict";

const EcoLensUI = {
  /**
   * Render a consistent status badge element or HTML string.
   * Supported keys: 'verified', 'review', 'failed', 'pending'
   *
   * @param {string} statusKey
   * @returns {string} HTML markup
   */
  renderBadge(statusKey) {
    const cfg = typeof EcoLensConfig !== "undefined" ? EcoLensConfig.STATUS : null;
    const s = (cfg && cfg[statusKey]) || {
      label: statusKey,
      cls: "ep-badge-pending",
      icon: "•"
    };
    return `<span class="ep-badge ${s.cls}" aria-label="${s.label}"><span aria-hidden="true">${s.icon}</span> ${s.label}</span>`;
  },

  /**
   * Format numerical values according to project metric unit.
   *
   * @param {number} value
   * @param {string} unit - 'trees', 'hectares', or '%'
   * @returns {string}
   */
  formatValue(value, unit) {
    if (unit === "trees") {
      return Math.round(value).toLocaleString("en-US");
    }
    return (Math.round(value * 10) / 10).toLocaleString("en-US");
  },

  /**
   * Short unit display helper.
   *
   * @param {string} unit
   * @returns {string}
   */
  shortUnit(unit) {
    if (unit === "trees") return "trees";
    if (unit === "hectares") return "ha";
    return "%";
  },

  /**
   * Create an inline error alert element
   *
   * @param {string} message
   * @returns {string} HTML markup
   */
  renderErrorNotice(message) {
    return `<div class="ep-error-inline" role="alert"><strong>Notice:</strong> ${message}</div>`;
  }
};
