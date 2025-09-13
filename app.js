// Organized UI script
// -------------------------------------------------------------
// 1) Constants / Config
// -------------------------------------------------------------
const ICONS = {
  light: "light_mode",
  dark: "dark_mode",
  menuOpen: "menu",
  menuClose: "close",
};
const SELECTORS = {
  menu: ".menu",
  themeToggle: "#theme-toggle",
  menuToggle: "#toggle-menu",
  sheet: "#bottomSheet",
  backdrop: "#backdrop",
  openBtn: "#join-waitlist",
};
const DRAG_CLOSE_PX = 120;
const FOCUSABLE_SEL =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

// -------------------------------------------------------------
// 2) Utils
// -------------------------------------------------------------
const qs = (s, root = document) => root.querySelector(s);

// -------------------------------------------------------------
// 3) Run after DOM is ready (safe even if script is in <head>)
// -------------------------------------------------------------
window.addEventListener("DOMContentLoaded", () => {
  // -----------------------------------------------------------
  // 4) Cache DOM
  // -----------------------------------------------------------
  const htmlEl = document.documentElement;
  const body = document.body;
  const menu = qs(SELECTORS.menu);
  const themeToggleBtn = qs(SELECTORS.themeToggle);
  const menuToggleBtn = qs(SELECTORS.menuToggle);
  const sheet = qs(SELECTORS.sheet);
  const backdrop = qs(SELECTORS.backdrop);
  const openBtn = qs(SELECTORS.openBtn);

  // -----------------------------------------------------------
  // 5) State
  // -----------------------------------------------------------
  let isDragging = false;
  let startY = 0;
  let currentY = 0;

  // -----------------------------------------------------------
  // 6) Setup (icons, initial theme)
  // -----------------------------------------------------------
  // Theme toggle icon
  const themeIcon = document.createElement("span");
  themeIcon.classList.add("material-icons");

  const storedTheme = localStorage.getItem("user-theme");
  const osPrefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  const initialTheme = storedTheme || (osPrefersDark ? "dark" : "light");
  htmlEl.setAttribute("data-theme", initialTheme);
  // Show the opposite icon (tap indicates the other mode)
  themeIcon.textContent = initialTheme === "light" ? ICONS.dark : ICONS.light;
  themeToggleBtn?.appendChild(themeIcon);

  // Menu toggle icon
  const menuIcon = document.createElement("span");
  menuIcon.classList.add("material-icons");
  menuIcon.textContent = ICONS.menuOpen;
  menuToggleBtn?.appendChild(menuIcon);
  menuToggleBtn?.setAttribute("aria-expanded", "false");

  // Optional dialog semantics
  if (sheet) {
    sheet.setAttribute("role", "dialog");
    sheet.setAttribute("aria-modal", "true");
  }

  // -----------------------------------------------------------
  // 7) Handlers
  // -----------------------------------------------------------
  const toggleMenu = () => {
    if (!menu) return;
    const open = menu.classList.toggle("menu-open");
    menuIcon.textContent = open ? ICONS.menuClose : ICONS.menuOpen;
    menuToggleBtn?.setAttribute("aria-expanded", String(open));
  };

  const toggleTheme = () => {
    const current = htmlEl.getAttribute("data-theme") === "light" ? "dark" : "light";
    htmlEl.setAttribute("data-theme", current);
    localStorage.setItem("user-theme", current);
    themeIcon.textContent = current === "light" ? ICONS.dark : ICONS.light;
    menu.classList.remove("menu-open");
    menuIcon.textContent = ICONS.menuOpen;
  };

  const getFocusables = () =>
    sheet ? [...sheet.querySelectorAll(FOCUSABLE_SEL)].filter(el => !el.hasAttribute("disabled")) : [];

  const onKeydown = (e) => {
    if (!sheet || !sheet.classList.contains("show")) return;

    if (e.key === "Escape") {
      e.preventDefault();
      closeSheet();
      return;
    }
    if (e.key === "Tab") {
      const focusables = getFocusables();
      if (focusables.length === 0) {
        e.preventDefault();
        sheet.focus();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  const openSheet = () => {
    if (!sheet || !backdrop) return;
    sheet.classList.add("show");
    backdrop.classList.add("show");
    body.classList.add("modal-open");
    document.addEventListener("keydown", onKeydown);
    const f = getFocusables()[0];
    (f || sheet).focus();
  };

  const closeSheet = () => {
    if (!sheet || !backdrop) return;
    sheet.classList.remove("show");
    backdrop.classList.remove("show");
    body.classList.remove("modal-open");
    // Reset inline styles from drag
    sheet.style.transition = "";
    sheet.style.transform = "";
    backdrop.style.opacity = "";
    document.removeEventListener("keydown", onKeydown);
    openBtn?.focus();
  };

  // Swipe down to close
  const startDrag = (y) => {
    if (!sheet) return;
    isDragging = true;
    startY = y;
    currentY = y;
    sheet.style.transition = "none";
  };
  const updateDrag = (y) => {
    if (!isDragging || !sheet || !backdrop) return;
    currentY = y;
    const delta = Math.max(0, currentY - startY);
    sheet.style.transform = `translateY(${delta}px)`;
    backdrop.style.opacity = String(Math.max(0, 1 - delta / 300));
  };
  const endDrag = () => {
    if (!isDragging || !sheet || !backdrop) return;
    const delta = Math.max(0, currentY - startY);
    isDragging = false;
    sheet.style.transition = "";
    sheet.style.transform = "";
    backdrop.style.opacity = "";
    if (delta > DRAG_CLOSE_PX) closeSheet();
  };

  // -----------------------------------------------------------
  // 8) Event wiring
  // -----------------------------------------------------------
  themeToggleBtn?.addEventListener("click", toggleTheme);
  menuToggleBtn?.addEventListener("click", toggleMenu);

  backdrop?.addEventListener("click", closeSheet);
  openBtn?.addEventListener("click", openSheet);

  if (sheet) {
    sheet.addEventListener("touchstart", (e) => startDrag(e.touches[0].clientY), { passive: true });
    sheet.addEventListener("touchmove", (e) => updateDrag(e.touches[0].clientY), { passive: true });
    sheet.addEventListener("touchend", endDrag);
  }
});
