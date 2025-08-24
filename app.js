(function () {
  // ============ MENU ============ //
  const menu = document.getElementById('siteMenu');
  const menuToggle = document.getElementById('menuToggle');
  const menuIcon = document.getElementById('menuIcon');

  let lockedScrollY = 0;

  function lockScroll() {
    lockedScrollY = window.scrollY || window.pageYOffset || 0;
    document.body.style.top = `-${lockedScrollY}px`;
    document.body.classList.add('menu-open');
  }

  function unlockScroll() {
    document.body.classList.remove('menu-open');
    document.body.style.top = '';
    window.scrollTo(0, lockedScrollY);
  }

  function setAria(isOpen) {
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    menu.setAttribute('aria-hidden', String(!isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
  }

  function swapIcon(isOpen) {
  menuIcon.classList.add('icon-fade');
  setTimeout(() => {
    menuIcon.textContent = isOpen ? 'close' : 'menu'; // Google icons
    menuIcon.classList.remove('icon-fade');
  }, 120);
}


  function openMenu() {
    menu.classList.add('open');
    swapIcon(true);
    setAria(true);
    lockScroll();
  }

  function closeMenu() {
    menu.classList.remove('open');
    swapIcon(false);
    setAria(false);
    unlockScroll();
  }

  function toggleMenu() {
    const isOpening = !menu.classList.contains('open');
    isOpening ? openMenu() : closeMenu();
  }

  menuToggle.addEventListener('click', toggleMenu);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('open')) {
      closeMenu();
    }
  });

  // Extra safety on mobile
  menu.addEventListener('touchmove', (e) => {
    if (menu.classList.contains('open')) e.preventDefault();
  }, { passive: false });

  // Ensure correct icon/aria on load
  swapIcon(false);
  setAria(false);

  // ============ THEME ============ //
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = document.getElementById('themeIcon');

 function setTheme(isDark) {
  document.body.classList.toggle('dark-theme', isDark);

  if (isDark) {
    themeIcon.textContent = 'light_mode'; // sun
    themeToggle?.setAttribute('aria-label', 'Switch to light theme');
    themeToggle?.setAttribute('aria-pressed', 'true');
  } else {
    themeIcon.textContent = 'dark_mode'; // moon
    themeToggle?.setAttribute('aria-label', 'Switch to dark theme');
    themeToggle?.setAttribute('aria-pressed', 'false');
  }
}


  // Initial theme: saved -> system preference
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const saved = localStorage.getItem('theme'); // "dark" | "light" | null
  const initialDark = saved ? saved === 'dark' : prefersDark;
  setTheme(initialDark);

  themeToggle?.addEventListener('click', () => {
    const nextDark = !document.body.classList.contains('dark-theme');
    setTheme(nextDark);
    localStorage.setItem('theme', nextDark ? 'dark' : 'light');

    // Close menu if open (same scope => safe)
    if (menu.classList.contains('open')) closeMenu();
  });
})();
