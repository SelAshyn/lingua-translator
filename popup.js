const languageSelect = document.getElementById("language");
const originalBox = document.getElementById("original");
const resultBox = document.getElementById("result");
const translateButton = document.getElementById("translate");
const translateLabel = translateButton.querySelector(".btn__label");
const copyButton = document.getElementById("copy");
const copyLabel = copyButton.querySelector(".btn__label");
const clearButton = document.getElementById("clear");
const themeToggle = document.getElementById("theme-toggle");
const toast = document.getElementById("status");
const charCount = document.getElementById("char-count");
const statusChip = document.getElementById("status-chip");
const statusChipLabel = document.getElementById("status-chip-label");
const kbdHint = document.getElementById("kbd-hint");

const THEME_KEY = "select-translator-theme";
const API_URL =
  "https://selected-text-translator-api.rhishav-translator.workers.dev/api/translate";

// Must match the supportedTargets set in your Cloudflare Worker.
const SUPPORTED_LANGUAGES = new Set([
  "AR", "BG", "CS", "DA", "DE", "EL", "EN", "ES",
  "ET", "FI", "FR", "HU", "HI", "ID", "IT", "JA", "KO",
  "LT", "LV", "NB", "NE", "NL", "PL", "PT", "RO", "RU",
  "SK", "SL", "SV", "TR", "UK", "ZH"
]);

const RESULT_PLACEHOLDER = "Translation appears here.";

let translatedText = "";
let isBusy = false;
let toastTimer = null;
let copyTimer = null;

// ---- Keyboard hint (Cmd on Mac, Ctrl elsewhere) ----

if (kbdHint) {
  const isMac = /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent);
  kbdHint.textContent = isMac ? "⌘ ↵" : "Ctrl ↵";
}

// ---- Dark mode ----

function applyTheme(theme) {
  const isDark = theme === "dark";

  document.body.classList.toggle("dark", isDark);

  if (themeToggle) {
    themeToggle.setAttribute("aria-pressed", String(isDark));
    themeToggle.setAttribute(
      "title",
      isDark ? "Switch to light mode" : "Switch to dark mode"
    );
  }
}

function systemTheme() {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getSavedTheme() {
  return new Promise((resolve) => {
    try {
      if (!chrome.storage?.sync) {
        resolve(systemTheme());
        return;
      }

      chrome.storage.sync.get(THEME_KEY, (result) => {
        // No saved choice yet: follow the operating system.
        resolve(result?.[THEME_KEY] || systemTheme());
      });
    } catch {
      resolve(systemTheme());
    }
  });
}

function saveTheme(theme) {
  try {
    chrome.storage?.sync?.set?.({ [THEME_KEY]: theme });
  } catch (error) {
    console.warn("Could not save theme:", error);
  }
}

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const nextTheme = document.body.classList.contains("dark")
      ? "light"
      : "dark";

    applyTheme(nextTheme);
    saveTheme(nextTheme);
  });
}

getSavedTheme().then(applyTheme);

// ---- Toast + status chip ----

function showToast(message, { type = "info", duration = 2500 } = {}) {
  if (!toast) return;

  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.toggle("is-error", type === "error");
  toast.classList.add("is-visible");

  toastTimer = setTimeout(() => {
    toast.classList.remove("is-visible");
  }, duration);
}

function setChip(state, label) {
  statusChip.classList.remove("is-ready", "is-busy", "is-error");
  statusChip.classList.add(`is-${state}`);
  statusChipLabel.textContent = label;
}

function refreshChip() {
  if (isBusy) {
    setChip("busy", "Translating");
  } else if (!navigator.onLine) {
    setChip("error", "Offline");
  } else {
    setChip("ready", "Ready");
  }
}

window.addEventListener("online", refreshChip);
window.addEventListener("offline", refreshChip);

// ---- Helpers ----

function normalizeLanguageCode(value) {
  const code = String(value || "").trim().toUpperCase();

  // Do not silently convert language names into guessed language codes.
  if (!SUPPORTED_LANGUAGES.has(code)) {
    throw new Error(
      `Unsupported target language: "${value}". Check the language option value in popup.html.`
    );
  }

  return code;
}

function setResult(text, state = "") {
  resultBox.textContent = text;
  resultBox.classList.toggle("is-empty", state === "empty");
  resultBox.classList.toggle("is-error", state === "error");

  // Restart the reveal animation each time a real result arrives.
  resultBox.classList.remove("reveal");
  if (state === "") {
    void resultBox.offsetWidth;
    resultBox.classList.add("reveal");
  }
}

function resetCopyButton() {
  clearTimeout(copyTimer);
  copyButton.classList.remove("is-success");
  copyLabel.textContent = "Copy";
}

function updateUiState() {
  const hasText = Boolean(originalBox.value.trim());
  const length = originalBox.value.length;

  translateButton.disabled = isBusy || !hasText;
  clearButton.hidden = length === 0;
  charCount.textContent = `${length.toLocaleString()} ${
    length === 1 ? "character" : "characters"
  }`;
}

function setBusy(busy) {
  isBusy = busy;

  translateButton.classList.toggle("is-loading", busy);
  translateButton.setAttribute("aria-busy", String(busy));
  translateLabel.textContent = busy ? "Translating…" : "Translate";

  if (busy) copyButton.disabled = true;

  refreshChip();
  updateUiState();
}

async function getSelectedText() {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  if (!tab?.id) {
    throw new Error("Could not find the active browser tab.");
  }

  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => window.getSelection()?.toString().trim() || ""
  });

  return results?.[0]?.result || "";
}

async function getPendingText() {
  try {
    const response = await chrome.runtime.sendMessage({
      action: "getPendingText"
    });

    return response?.text || "";
  } catch {
    return "";
  }
}

// ---- Translation ----

async function translateText(text, targetLanguage) {
  const target = normalizeLanguageCode(targetLanguage);

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      text: text.trim(),
      target_lang: target
    })
  });

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error("The translation server returned an invalid response.");
  }

  if (!response.ok) {
    throw new Error(
      data.error || `Translation server error: HTTP ${response.status}`
    );
  }

  if (typeof data.translation !== "string" || !data.translation) {
    throw new Error("The translation server returned no translation.");
  }

  return data.translation;
}

// ---- Load selected text ----

async function loadSelection() {
  setResult(RESULT_PLACEHOLDER, "empty");
  copyButton.disabled = true;
  translatedText = "";
  refreshChip();

  try {
    let captured = await getPendingText();

    if (!captured) {
      captured = await getSelectedText();
    }

    if (captured) {
      originalBox.value = captured;
    } else {
      originalBox.value = "";
      showToast("No text selected. Select text on the page or type above.", {
        duration: 3500
      });
    }
  } catch (error) {
    console.warn("Selection read error:", error);
    originalBox.value = "";
    showToast("Couldn’t read the selection. Type or paste text instead.", {
      type: "error",
      duration: 3500
    });
  } finally {
    updateUiState();
  }
}

// ---- Event listeners ----

originalBox.addEventListener("input", updateUiState);

clearButton.addEventListener("click", () => {
  originalBox.value = "";
  translatedText = "";
  setResult(RESULT_PLACEHOLDER, "empty");
  copyButton.disabled = true;
  resetCopyButton();
  updateUiState();
  originalBox.focus();
});

translateButton.addEventListener("click", async () => {
  const text = originalBox.value.trim();

  if (!text || isBusy) return;

  resetCopyButton();
  setBusy(true);
  setResult("Translating…", "empty");

  try {
    translatedText = await translateText(text, languageSelect.value);

    setResult(translatedText);
    copyButton.disabled = false;
    showToast("Translated");
  } catch (error) {
    translatedText = "";
    setResult("Translation failed. Check your connection and try again.", "error");
    showToast(error.message || "Translation failed", {
      type: "error",
      duration: 4000
    });
    console.error("Translation error:", error);
  } finally {
    setBusy(false);
    // Keep Copy enabled only when there is a result to copy.
    copyButton.disabled = !translatedText;
  }
});

copyButton.addEventListener("click", async () => {
  if (!translatedText) return;

  try {
    await navigator.clipboard.writeText(translatedText);

    clearTimeout(copyTimer);
    copyButton.classList.add("is-success");
    copyLabel.textContent = "Copied ✓";
    copyTimer = setTimeout(resetCopyButton, 1500);
  } catch {
    showToast("Couldn’t copy. Select the text and copy it manually.", {
      type: "error",
      duration: 3500
    });
  }
});

document.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    event.preventDefault();
    if (!translateButton.disabled) {
      translateButton.click();
    }
  }
});

// ---- Initialize ----

updateUiState();
loadSelection();