const menu = document.getElementsByClassName("menu")[0];
const toggle_theme_button = document.getElementById("theme-toggle");
const toggle_menu_button = document.getElementById("toggle-menu");
const htmlElement = document.documentElement;
const icon = document.createElement("span");
icon.classList.add("material-icons");
const light_mode_icon = "light_mode";
const dark_mode_icon = "dark_mode";
const menu_open_icon = "menu";
const menu_close_icon = "close";
icon.textContent = dark_mode_icon;
toggle_theme_button.appendChild(icon);

const body = document.body;
const sheet = document.getElementById("bottomSheet");
const backdrop = document.getElementById("backdrop");
const openBtn = document.getElementById("join-waitlist");

const menuIcon = document.createElement("span");
menuIcon.classList.add("material-icons");
menuIcon.textContent = menu_open_icon;
toggle_menu_button.appendChild(menuIcon);

function toggleMenu() {
  if (menu.classList.contains("menu-open")) {
    menu.classList.remove("menu-open");
    menuIcon.textContent = menu_open_icon;
  } else {
    menu.classList.add("menu-open");
    menuIcon.textContent = menu_close_icon;
  }
}

function toggleTheme() {
  if (htmlElement.getAttribute("data-theme") === "light") {
    htmlElement.setAttribute("data-theme", "dark");
    localStorage.setItem("user-theme", "dark");
    icon.textContent = light_mode_icon;
  } else {
    htmlElement.setAttribute("data-theme", "light");
    localStorage.setItem("user-theme", "light");
    icon.textContent = dark_mode_icon;
  }
}

// const firstFocusable = () => sheet.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');



function openSheet() {
  sheet.classList.add("show");
  backdrop.classList.add("show");
  body.classList.add("modal-open");
  // const f = firstFocusable();
  // (f || sheet).focus();
  // document.addEventListener('keydown', onKeydown);
}

function closeSheet() {
  sheet.classList.remove("show");
  backdrop.classList.remove("show");
  body.classList.remove("modal-open");
  document.removeEventListener("keydown", onKeydown);
  openBtn.focus();
}

// function onKeydown(e) {
//   if (e.key === 'Escape') closeSheet();
//   if (e.key === 'Tab') {
//     const focusables = sheet.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
//     const first = focusables[0];
//     const last = focusables[focusables.length - 1];
//     if (e.shiftKey && document.activeElement === first) {
//       last.focus(); e.preventDefault();
//     } else if (!e.shiftKey && document.activeElement === last) {
//       first.focus(); e.preventDefault();
//     }
//   }
// }

backdrop.addEventListener("click", closeSheet);
openBtn.addEventListener("click", openSheet);


// Swipe down to close
const startDrag = (y) => {
  isDragging = true;
  startY = y;
  currentY = y;
  sheet.style.transition = "none";
};
const updateDrag = (y) => {
  if (!isDragging) return;
  currentY = y;
  const delta = Math.max(0, currentY - startY);
  sheet.style.translate = `0 ${delta}px`;
  backdrop.style.opacity = String(Math.max(0, 1 - delta / 300));
};
const endDrag = () => {
  if (!isDragging) return;
  const delta = Math.max(0, currentY - startY);
  sheet.style.transition = "";
  sheet.style.translate = "";
  backdrop.style.opacity = "";
  isDragging = false;
  if (delta > 120) closeSheet();
};

sheet.addEventListener("touchstart", (e) => startDrag(e.touches[0].clientY), {
  passive: true,
});
sheet.addEventListener("touchmove", (e) => updateDrag(e.touches[0].clientY), {
  passive: true,
});
sheet.addEventListener("touchend", endDrag);
