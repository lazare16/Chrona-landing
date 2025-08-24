(function () {
  const menu = document.getElementById('siteMenu');
  const menuToggle = document.getElementById('menuToggle');
  const menuIcon = document.getElementById('menuIcon');

  let lockedScrollY = 0;

  function lockScroll() {
    lockedScrollY = window.scrollY || window.pageYOffset || 0;
    // Freeze body at current position
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
      menuIcon.classList.toggle('fa-bars', !isOpen);
      menuIcon.classList.toggle('fa-xmark', isOpen);
      menuIcon.classList.remove('icon-fade');
    }, 120); // matches CSS fade
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

  // Click handler
  menuToggle.addEventListener('click', toggleMenu);

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('open')) {
      closeMenu();
    }
  });

  // Prevent touchmove from bubbling when menu is open (extra safety on mobile)
  menu.addEventListener('touchmove', (e) => {
    if (menu.classList.contains('open')) e.preventDefault();
  }, { passive: false });

  // Ensure correct icon on load
  swapIcon(false);
  setAria(false);
})();
