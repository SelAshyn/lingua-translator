/* content.js
 *
 * Watches for text selection on the page and floats a "Translate" button
 * just above the selected text. Clicking it asks the background service
 * worker to open the extension popup with that text pre-loaded.
 */

const FAB_ID = "select-translator-fab";
const THEME_KEY = "select-translator-theme";

let fab = null;
let selectedText = "";
let positionTimer = null;

// Mirror the popup's dark mode onto the page so the floating button
// matches the theme the user chose.
function applyPageTheme(theme) {
  const isDark = theme === "dark";
  document.documentElement.setAttribute(
    "data-theme",
    isDark ? "dark" : "light"
  );
}

function loadPageTheme() {
  try {
    chrome.storage?.sync?.get?.(THEME_KEY, (result) => {
      applyPageTheme(result?.[THEME_KEY] || "light");
    });
  } catch {
    applyPageTheme("light");
  }
}

// Keep the floating button in sync if the user toggles the theme while
// the page is open.
try {
  chrome.storage?.onChanged?.addListener((changes, area) => {
    if (area === "sync" && changes[THEME_KEY]) {
      applyPageTheme(changes[THEME_KEY].newValue);
    }
  });
} catch {
  // storage listeners may not be available in every context.
}

loadPageTheme();

function getFab() {
  if (fab) return fab;

  fab = document.createElement("button");
  fab.id = FAB_ID;
  fab.type = "button";
  fab.className = "select-translator-fab";
  fab.setAttribute("aria-label", "Translate selected text");
  fab.innerHTML =
    '<svg class="fab-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
    '<path d="M4 11h14" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>' +
    '<path d="M11 7l4 4-4 4" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path d="M20 13H6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>' +
    '<path d="M13 17l-4 4-4-4" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>' +
    "</svg>" +
    '<span class="fab-label">Translate</span>';

  fab.addEventListener("click", onFabClick);
  document.body.appendChild(fab);
  return fab;
}

function positionFab(range) {
  const rect = range.getBoundingClientRect();
  const fabEl = getFab();
  const fabW = 142;
  const fabH = 34;
  const gap = 8;

  // Prefer floating above the selection; fall back to below if there is no room.
  let top = rect.top - fabH - gap;
  let below = false;
  if (top < 2) {
    top = rect.bottom + gap;
    below = true;
  }

  let left = rect.left + rect.width / 2 - fabW / 2;
  left = Math.max(6, Math.min(left, window.innerWidth - fabW - 6));

  fabEl.style.left = Math.round(left) + "px";
  fabEl.style.top = Math.round(top) + "px";
  fabEl.classList.toggle("is-below", below);
}

function showFab(range) {
  const fabEl = getFab();
  selectedText = range.toString().trim();
  if (!selectedText) {
    hideFab();
    return;
  }
  positionFab(range);
  fabEl.style.display = "inline-flex";
}

function hideFab() {
  if (fab) fab.style.display = "none";
}

function onSelectionChange() {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) {
    hideFab();
    return;
  }
  const range = sel.getRangeAt(0);
  if (range.collapsed) {
    hideFab();
    return;
  }
  showFab(range);
}

function scheduleUpdate() {
  clearTimeout(positionTimer);
  positionTimer = setTimeout(onSelectionChange, 60);
}

document.addEventListener("selectionchange", scheduleUpdate);
document.addEventListener("mouseup", scheduleUpdate);
window.addEventListener("scroll", scheduleUpdate, true);
window.addEventListener("resize", scheduleUpdate);

async function onFabClick() {
  const text = selectedText;
  if (!text) return;

  // Capture is done; hide the button. Opening the popup may clear the
  // page selection, so we never rely on it being intact afterwards.
  hideFab();

  try {
    await chrome.runtime.sendMessage({ action: "openPopup", text });
  } catch (error) {
    // Fall back to opening the popup window directly if the service worker
    // could not be reached (e.g. it was suspended between messages).
    console.error("select-translator: could not open popup via background", error);
    const url = chrome.runtime.getURL("popup.html");
    window.open(url, "_popup", "width=360,height=620,popup=yes");
  }
}