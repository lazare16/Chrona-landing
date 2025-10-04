// -------------------------------------------------------------
// Input container (single input): active state + autofill/BFCache
// -------------------------------------------------------------
(() => {
  const container = document.querySelector('[data-role="email-input"]');
  const input = container?.querySelector(".input");
  if (!container || !input) return;

  const update = () => {
    const active = !!input.value || document.activeElement === input;
    container.classList.toggle("is-active", active);
  };

  // Initial state (handles server-filled values, late WebKit autofill)
  update();
  requestAnimationFrame(update);
  setTimeout(update, 250);

  // Events
  input.addEventListener("focus", update);
  input.addEventListener("blur", update);
  input.addEventListener("input", update);

  // Optional: reflect validity on the container
  input.addEventListener("invalid", () =>
    container.classList.add("is-invalid")
  );
  input.addEventListener("input", () => {
    container.classList.toggle("is-invalid", !input.checkValidity());
  });

  // Re-apply on BFCache restore (back/forward navigation)
  window.addEventListener("pageshow", update);
})();

// -------------------------------------------------------------
// Organized UI script (menu, theme toggle, bottom sheet)
// -------------------------------------------------------------
const ICONS = {
  light: "light_mode",
  dark: "dark_mode",
  // facebook: "facebook",
  // facebookDarkTheme: "facebook-dark-theme",
  // instagram: "instagram",
  // instagramDarkTheme: "instagram-dark-theme",
  // x: "x",
  // xDarkTheme: "x-dark-theme",
};
const SELECTORS = {
  menu: ".menu",
  themeToggle: "#theme-toggle",
  sheet: "#bottomSheet",
  backdrop: "#backdrop",
  openBtn: "#join-waitlist",
  emailForm: "#email-form",
  submitEmailBtn: "#submit-email",
  buttonText: "#button-text",
  buttonLoader: "#button-loader",
  // facebookIcon: "#facebook-id",
  // instagramIcon: "#instagram-id",
  // xIcon: "#x-id",
};
const DRAG_CLOSE_PX = 120;
const FOCUSABLE_SEL =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

const qs = (s, root = document) => root.querySelector(s);

window.addEventListener("DOMContentLoaded", () => {
  // Cache DOM
  const htmlEl = document.documentElement;
  const body = document.body;
  const themeToggleBtn = qs(SELECTORS.themeToggle);
  const sheet = qs(SELECTORS.sheet);
  const backdrop = qs(SELECTORS.backdrop);
  const openBtn = qs(SELECTORS.openBtn);
  const emailForm = qs(SELECTORS.emailForm);
  const submitEmailBtn = qs(SELECTORS.submitEmailBtn);
  const buttonText = qs(SELECTORS.buttonText);
  const buttonLoader = qs(SELECTORS.buttonLoader);
  // const facebookIcon = qs(SELECTORS.facebookIcon);
  // const instagramIcon = qs(SELECTORS.instagramIcon);
  // const xIcon = qs(SELECTORS.xIcon);

  // State
  let isDragging = false;
  let startY = 0;
  let currentY = 0;

  // Setup (icons, initial theme)
  const themeIcon = document.createElement("span");
  themeIcon.classList.add("material-icons");

  const storedTheme = localStorage.getItem("user-theme");
  const osPrefersDark = window.matchMedia?.(
    "(prefers-color-scheme: dark)"
  ).matches;
  const initialTheme = storedTheme || (osPrefersDark ? "dark" : "light");
  htmlEl.setAttribute("data-theme", initialTheme);
  // Show opposite icon (tap indicates the other mode)
  themeIcon.textContent = initialTheme === "light" ? ICONS.dark : ICONS.light;
  //  facebookIcon.setAttribute(
  //    "src",
  //    `${
  //      initialTheme === "light"
  //        ? "./assets/icons/facebook.svg"
  //        : "./assets/icons/facebook-dark-theme.svg"
  //    }`
  //  );
  //  instagramIcon.setAttribute(
  //    "src",
  //    `${
  //      initialTheme === "light"
  //        ? "./assets/icons/instagram.svg"
  //        : "./assets/icons/instagram-dark-theme.svg"
  //    }`
  //  );
  //  xIcon.setAttribute(
  //    "src",
  //    `${
  //      initialTheme === "light"
  //        ? "./assets/icons/x.svg"
  //        : "./assets/icons/x-dark-theme.svg"
  //    }`
  //  );


  themeToggleBtn?.appendChild(themeIcon);


  if (sheet) {
    sheet.setAttribute("role", "dialog");
    sheet.setAttribute("aria-modal", "true");
    sheet.setAttribute("tabindex", "-1"); // focus target fallback
  }

  const toggleTheme = () => {
    const next =
      htmlEl.getAttribute("data-theme") === "light" ? "dark" : "light";
    htmlEl.setAttribute("data-theme", next);
    localStorage.setItem("user-theme", next);
    themeIcon.textContent = next === "light" ? ICONS.dark : ICONS.light;
    // facebookIcon.setAttribute(
    //   "src",
    //   `${
    //     next === "light"
    //       ? "./assets/icons/facebook.svg"
    //       : "./assets/icons/facebook-dark-theme.svg"
    //   }`
    // );
    // instagramIcon.setAttribute(
    //   "src",
    //   `${
    //     next === "light"
    //       ? "./assets/icons/instagram.svg"
    //       : "./assets/icons/instagram-dark-theme.svg"
    //   }`
    // );
    // xIcon.setAttribute(
    //   "src",
    //   `${
    //     next === "light"
    //       ? "./assets/icons/x.svg"
    //       : "./assets/icons/x-dark-theme.svg"
    //   }`
    // );

  };

  // Expose for inline onclick attributes present in HTML
  window.toggleTheme = toggleTheme;

  const getFocusables = () =>
    sheet
      ? [...sheet.querySelectorAll(FOCUSABLE_SEL)].filter(
          (el) => !el.hasAttribute("disabled")
        )
      : [];

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

  function isMobile() {
    const regex =
      /Mobi|Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
    return regex.test(navigator.userAgent);
  }

  const openSheet = () => {
    if (!sheet || !backdrop) return;
    sheet.classList.add("show");
    backdrop.classList.add("show");
    body.classList.add("modal-open");
    document.addEventListener("keydown", onKeydown);
    if (!isMobile) {
      const f = getFocusables()[0];
      (f || sheet).focus();
    }
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
    if (!isMobile) {
      openBtn?.focus();
    }
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

  backdrop?.addEventListener("click", closeSheet);
  openBtn?.addEventListener("click", openSheet);

  if (sheet) {
    sheet.addEventListener(
      "touchstart",
      (e) => startDrag(e.touches[0].clientY),
      {
        passive: true,
      }
    );
    sheet.addEventListener(
      "touchmove",
      (e) => updateDrag(e.touches[0].clientY),
      {
        passive: true,
      }
    );
    sheet.addEventListener("touchend", endDrag);
  }

  // Move email form event listener inside DOMContentLoaded and use correct variable
  emailForm?.addEventListener("submit", (e) => {
    e.preventDefault();

    buttonLoader.style.display = "inline-block";
    buttonText.textContent = "";
    submitEmailBtn.disabled = true;

    setTimeout(() => {
      buttonLoader.style.display = "none";
      buttonText.textContent = "Send Email";
      submitEmailBtn.disabled = false;
    }, 5000);
  });
});
