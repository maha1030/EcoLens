/**
 * EcoLens - Responsive Navigation Controller
 * 
 * Manages mobile hamburger navigation, accessibility state,
 * and backdrop dismissal across all pages.
 */
"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector(".nav-links");
  const nav = document.querySelector("nav");

  if (!toggle || !navLinks) return;

  function setNavOpen(isOpen) {
    toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    if (isOpen) {
      navLinks.classList.add("nav-open");
      toggle.classList.add("is-active");
    } else {
      navLinks.classList.remove("nav-open");
      toggle.classList.remove("is-active");
    }
  }

  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = navLinks.classList.contains("nav-open");
    setNavOpen(!isOpen);
  });

  // Close when clicking any nav link
  navLinks.addEventListener("click", (e) => {
    if (e.target.tagName === "A") {
      setNavOpen(false);
    }
  });

  // Close when clicking outside
  document.addEventListener("click", (e) => {
    if (nav && !nav.contains(e.target)) {
      setNavOpen(false);
    }
  });

  // Close on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      setNavOpen(false);
    }
  });
});
