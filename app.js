 // -------------------------------------------------------------
  // Input containers: active state + autofill/bfcache handling
  // -------------------------------------------------------------
  function setupInputContainers(root = document) {
    const containers = root.querySelectorAll('.input-container');

    function updateState(container) {
      const input = container.querySelector('.input');
      if (!input) return;
      const hasValue = !!input.value;
      container.classList.toggle('is-active', hasValue || document.activeElement === input);
    }

    containers.forEach((container) => {
      const input = container.querySelector('.input');
      if (!input) return;

      // Initial state (handles bfcache, server-filled values, etc.)
      updateState(container);

      // Events
      input.addEventListener('focus', () => updateState(container));
      input.addEventListener('blur',  () => updateState(container));
      input.addEventListener('input', () => updateState(container));

      // Heuristic: detect WebKit autofill post-load
      window.requestAnimationFrame(() => updateState(container));
      setTimeout(() => updateState(container), 250);
    });
  }

  // Re-apply on BFCache restore
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) setupInputContainers();
  });

  // Observe DOM for dynamically-added .input-container blocks
  const mo = new MutationObserver((muts) => {
    for (const m of muts) {
      m.addedNodes.forEach((node) => {
        if (!(node instanceof Element)) return;
        if (node.matches?.('.input-container')) {
          setupInputContainers(node);
        } else if (node.querySelectorAll) {
          const inner = node.querySelectorAll('.input-container');
          if (inner.length) setupInputContainers(node);
        }
      });
    }
  });
  mo.observe(document.documentElement, { childList: true, subtree: true });

  // Run once ASAP for any existing inputs
  if (document.readyState !== 'loading') {
    setupInputContainers();
  } else {
    document.addEventListener('DOMContentLoaded', () => setupInputContainers());
  }

  // -------------------------------------------------------------
  // Organized UI script (menu, theme toggle, bottom sheet)
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

  const qs = (s, root = document) => root.querySelector(s);

  window.addEventListener("DOMContentLoaded", () => {
    // Cache DOM
    const htmlEl = document.documentElement;
    const body = document.body;
    const menu = qs(SELECTORS.menu);
    const themeToggleBtn = qs(SELECTORS.themeToggle);
    const menuToggleBtn = qs(SELECTORS.menuToggle);
    const sheet = qs(SELECTORS.sheet);
    const backdrop = qs(SELECTORS.backdrop);
    const openBtn = qs(SELECTORS.openBtn);

    // State
    let isDragging = false;
    let startY = 0;
    let currentY = 0;

    // Setup (icons, initial theme)
    const themeIcon = document.createElement("span");
    themeIcon.classList.add("material-icons");

    const storedTheme = localStorage.getItem("user-theme");
    const osPrefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    const initialTheme = storedTheme || (osPrefersDark ? "dark" : "light");
    htmlEl.setAttribute("data-theme", initialTheme);
    // Show opposite icon (tap indicates the other mode)
    themeIcon.textContent = initialTheme === "light" ? ICONS.dark : ICONS.light;
    themeToggleBtn?.appendChild(themeIcon);

    const menuIcon = document.createElement("span");
    menuIcon.classList.add("material-icons");
    menuIcon.textContent = ICONS.menuOpen;
    menuToggleBtn?.appendChild(menuIcon);
    menuToggleBtn?.setAttribute("aria-expanded", "false");

    if (sheet) {
      sheet.setAttribute("role", "dialog");
      sheet.setAttribute("aria-modal", "true");
      sheet.setAttribute("tabindex", "-1"); // focus target fallback
    }

    // Handlers
    const toggleMenu = () => {
      if (!menu) return;
      const open = menu.classList.toggle("menu-open");
      menuIcon.textContent = open ? ICONS.menuClose : ICONS.menuOpen;
      menuToggleBtn?.setAttribute("aria-expanded", String(open));
    };

    const toggleTheme = () => {
      const next = htmlEl.getAttribute("data-theme") === "light" ? "dark" : "light";
      htmlEl.setAttribute("data-theme", next);
      localStorage.setItem("user-theme", next);
      themeIcon.textContent = next === "light" ? ICONS.dark : ICONS.light;
      // Close the menu if open to reflect action
      menu?.classList?.remove("menu-open");
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

    // Event wiring
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