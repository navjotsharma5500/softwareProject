/**
 * @file scroll.utils.js
 * @description Viewport scroll helpers used across the frontend.
 */

/**
 * Scrolls to the items section on the home page,
 * offsetting by the navbar height.
 *
 * @param {'smooth'|'auto'} behavior - scroll behavior
 */
export const scrollToItemsSection = (behavior = "smooth") => {
  const el = document.getElementById("items-section");
  if (!el) {
    // Fallback: scroll to top if element isn't in the DOM
    window.scrollTo({ top: 0, behavior });
    return;
  }
  const navbar =
    document.querySelector("nav") || document.querySelector("header");
  const navbarHeight =
    navbar && window.getComputedStyle(navbar).position !== "static"
      ? navbar.offsetHeight
      : 80;
  const offset = navbarHeight + 8;
  const top = el.getBoundingClientRect().top + window.pageYOffset;
  window.scrollTo({ top: Math.max(0, top - offset), behavior });
};
