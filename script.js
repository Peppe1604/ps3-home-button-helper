const CONSOLES_KEY = "ps3-home-button-helper.consoles";
const ACTIVE_KEY = "ps3-home-button-helper.active";
const LEGACY_KEY = "ps3-home-button-helper.address";
const THEME_STORAGE_KEY = "ps3-home-button-helper.theme";
const DEFAULT_ADDRESS = "192.168.1.50";
const COMMAND_PATH = "/pad.ps3?_psbtn_go";
const THEME_COLORS = { light: "#f8f7fc", dark: "#080711" };

const form = document.querySelector("#commandForm");
const consoleSelect = document.querySelector("#consoleSelect");
const consoleNameInput = document.querySelector("#consoleName");
const addressInput = document.querySelector("#ps3Address");
const commandUrlOutput = document.querySelector("#commandUrl");
const directLink = document.querySelector("#directLink");
const copyButton = document.querySelector("#copyButton");
const checkButton = document.querySelector("#checkButton");
const installBanner = document.querySelector("#installBanner");
const installButton = document.querySelector("#installButton");
const installText = document.querySelector("#installText");
const addBtn = document.querySelector("#addConsoleBtn");
const removeBtn = document.querySelector("#removeConsoleBtn");
const statusMessage = document.querySelector("#statusMessage");
const themeColorMeta = document.querySelector("#themeColor");
const themeButtons = document.querySelectorAll("[data-theme-option]");
const darkScheme = window.matchMedia("(prefers-color-scheme: dark)");
let commandFrame = null;
let commandTimeoutId = 0;
let consoles = [];
let deferredInstallPrompt = null;

/* ── Console management ── */

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function loadConsoles() {
  try {
    const raw = localStorage.getItem(CONSOLES_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.length) return arr;
    }
  } catch { /* ignore */ }

  // Migrate from legacy single-address format
  let addr = DEFAULT_ADDRESS;
  try {
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) addr = legacy;
  } catch { /* ignore */ }

  return [{ id: uid(), name: "PS3", address: addr }];
}

function persist() {
  try { localStorage.setItem(CONSOLES_KEY, JSON.stringify(consoles)); } catch { /* ignore */ }
}

function loadActiveId() {
  try { return localStorage.getItem(ACTIVE_KEY) || ""; } catch { return ""; }
}

function saveActiveId(id) {
  try { localStorage.setItem(ACTIVE_KEY, id); } catch { /* ignore */ }
}

function activeConsole() {
  const id = loadActiveId();
  return consoles.find(c => c.id === id) || consoles[0] || null;
}

function populateSelect(selectedId) {
  consoleSelect.innerHTML = "";
  consoles.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = c.name || c.address || "New console";
    consoleSelect.appendChild(opt);
  });
  if (selectedId) consoleSelect.value = selectedId;
  removeBtn.disabled = consoles.length <= 1;
}

function selectConsole(id) {
  const entry = consoles.find(c => c.id === id);
  if (!entry) return;
  consoleSelect.value = id;
  consoleNameInput.value = entry.name;
  addressInput.value = entry.address;
  saveActiveId(id);
  updateCommandUrl();
}

function saveCurrentConsole() {
  const entry = activeConsole();
  if (!entry) return;
  let addr = addressInput.value.trim();
  try { addr = normalizeAddress(addr).replace(/^https?:\/\//, ""); } catch { /* keep raw */ }
  entry.name = consoleNameInput.value.trim() || addr || "PS3";
  entry.address = addr;
  persist();
  const opt = consoleSelect.querySelector(`option[value="${CSS.escape(entry.id)}"]`);
  if (opt) opt.textContent = entry.name;
}

function addConsole() {
  const entry = { id: uid(), name: "", address: "" };
  consoles.push(entry);
  persist();
  populateSelect(entry.id);
  selectConsole(entry.id);
  consoleNameInput.focus();
}

function removeConsole() {
  if (consoles.length <= 1) return;
  const cur = activeConsole();
  if (!cur) return;
  consoles = consoles.filter(c => c.id !== cur.id);
  persist();
  populateSelect(consoles[0].id);
  selectConsole(consoles[0].id);
}

/* ── Address & command URL ── */

function normalizeAddress(value) {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error("Enter the local IP address or hostname of your PS3.");
  }
  const withProtocol = /^[a-z][a-z\d+\-.]*:\/\//i.test(trimmed)
    ? trimmed
    : `http://${trimmed}`;
  const parsed = new URL(withProtocol);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Use an HTTP address, for example 192.168.1.50.");
  }
  return `${parsed.protocol}//${parsed.host}`;
}

function getCommandUrl() {
  return `${normalizeAddress(addressInput.value)}${COMMAND_PATH}`;
}

function getBaseUrl() {
  return `${normalizeAddress(addressInput.value)}/`;
}

function setStatus(message, isWarning = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("is-warning", isWarning);
}

function updateCommandUrl() {
  try {
    const url = getCommandUrl();
    commandUrlOutput.value = url;
    directLink.href = url;
    setStatus("");
    return url;
  } catch (err) {
    commandUrlOutput.value = "Invalid PS3 address";
    directLink.removeAttribute("href");
    setStatus(err.message, true);
    return "";
  }
}

/* ── Command sending ── */

function clearCommandFrame() {
  if (commandTimeoutId) { window.clearTimeout(commandTimeoutId); commandTimeoutId = 0; }
  if (commandFrame) { commandFrame.remove(); commandFrame = null; }
}

function sendCommandWithFrame(url) {
  clearCommandFrame();
  commandFrame = document.createElement("iframe");
  commandFrame.className = "command-frame";
  commandFrame.title = "PS3 command response";
  commandFrame.setAttribute("aria-hidden", "true");
  commandFrame.tabIndex = -1;

  commandFrame.addEventListener("load", () => {
    clearCommandFrame();
    setStatus("PS/Home command sent. You can stay on this page.");
  }, { once: true });

  commandFrame.addEventListener("error", () => {
    clearCommandFrame();
    setStatus("The browser blocked the background request. Use the direct link instead.", true);
  }, { once: true });

  commandTimeoutId = window.setTimeout(() => {
    clearCommandFrame();
    setStatus("No response was detected. If the PS3 did not react, use the direct link.", true);
  }, 5000);

  setStatus("Sending PS/Home command...");
  commandFrame.src = url;
  document.body.appendChild(commandFrame);
}

async function sendCommandUrl(url) {
  clearCommandFrame();
  setStatus("Sending PS/Home command...");

  if ("fetch" in window && "AbortController" in window) {
    const ctrl = new AbortController();
    const tid = window.setTimeout(() => ctrl.abort(), 5000);
    try {
      await fetch(url, { method: "GET", mode: "no-cors", cache: "no-store", signal: ctrl.signal });
      window.clearTimeout(tid);
      setStatus("PS/Home command sent. You can stay on this page.");
      return;
    } catch { window.clearTimeout(tid); }
  }

  sendCommandWithFrame(url);
}

/* Connection check */

function getCheckFailureMessage(error, baseUrl) {
  if (error && error.name === "AbortError") {
    return "No response before timeout. Check that the PS3 is on, on the same network, and running its web interface.";
  }

  if (window.location.protocol === "https:" && baseUrl.startsWith("http://")) {
    return "The browser blocked the local HTTP check from this HTTPS page. Try Open direct link or run the app from HTTP/local file.";
  }

  return "The PS3 web address could not be reached. Check the IP address, Wi-Fi, and webMAN MOD status.";
}

async function checkConnection() {
  if (!updateCommandUrl()) {
    addressInput.focus();
    return;
  }

  let baseUrl = "";
  try {
    baseUrl = getBaseUrl();
  } catch (err) {
    setStatus(err.message, true);
    addressInput.focus();
    return;
  }

  saveCurrentConsole();

  if (!("fetch" in window) || !("AbortController" in window)) {
    setStatus("This browser cannot run the background check. Open the PS3 address directly.", true);
    return;
  }

  const mayBlockLocalHttp = window.location.protocol === "https:" && baseUrl.startsWith("http://");
  setStatus(mayBlockLocalHttp
    ? "Checking PS3 address. This browser may block local HTTP requests from HTTPS pages..."
    : "Checking PS3 web address...");

  checkButton.disabled = true;
  const ctrl = new AbortController();
  const timeoutId = window.setTimeout(() => ctrl.abort(), 5000);

  try {
    await fetch(baseUrl, {
      method: "GET",
      mode: "no-cors",
      cache: "no-store",
      signal: ctrl.signal
    });
    setStatus("PS3 web address responded. If Home still fails, confirm the pad.ps3 endpoint is enabled.");
  } catch (err) {
    setStatus(getCheckFailureMessage(err, baseUrl), true);
  } finally {
    window.clearTimeout(timeoutId);
    checkButton.disabled = false;
  }
}

/* Theme */

function loadSavedTheme() {
  try {
    const t = localStorage.getItem(THEME_STORAGE_KEY);
    return t === "light" || t === "dark" ? t : "auto";
  } catch { return "auto"; }
}

function getEffectiveTheme(theme) {
  return theme === "light" || theme === "dark" ? theme : darkScheme.matches ? "dark" : "light";
}

function saveTheme(theme) {
  try { localStorage.setItem(THEME_STORAGE_KEY, theme); } catch { /* ignore */ }
}

function applyTheme(theme) {
  const sel = theme === "light" || theme === "dark" ? theme : "auto";
  if (sel === "auto") { delete document.documentElement.dataset.theme; }
  else { document.documentElement.dataset.theme = sel; }

  themeButtons.forEach(btn => {
    btn.setAttribute("aria-pressed", String(btn.dataset.themeOption === sel));
  });

  if (themeColorMeta) themeColorMeta.content = THEME_COLORS[getEffectiveTheme(sel)];
  saveTheme(sel);
}

/* Install prompt */

function isStandaloneApp() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function isAppleMobile() {
  const ua = navigator.userAgent || "";
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function updateInstallBanner() {
  if (!installBanner || isStandaloneApp()) {
    if (installBanner) installBanner.hidden = true;
    return;
  }

  if (deferredInstallPrompt) {
    installText.textContent = "Install this helper for quick home-screen access.";
    installButton.hidden = false;
    installButton.disabled = false;
    installBanner.hidden = false;
    return;
  }

  if (isAppleMobile()) {
    installText.textContent = "iPhone/iPad: open in Safari, then Share > Add to Home Screen.";
    installButton.hidden = true;
    installBanner.hidden = false;
    return;
  }

  installBanner.hidden = true;
}

async function promptInstallApp() {
  if (!deferredInstallPrompt) {
    updateInstallBanner();
    return;
  }

  installButton.disabled = true;
  deferredInstallPrompt.prompt();
  const choice = await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;

  setStatus(choice.outcome === "accepted" ? "App install started." : "Install dismissed.");
  updateInstallBanner();
}

/* ── Init ── */

consoles = loadConsoles();
persist();
applyTheme(loadSavedTheme());

const savedId = loadActiveId();
const initId = consoles.find(c => c.id === savedId) ? savedId : consoles[0].id;
populateSelect(initId);
selectConsole(initId);
updateInstallBanner();

/* ── Events ── */

consoleSelect.addEventListener("change", () => selectConsole(consoleSelect.value));
consoleNameInput.addEventListener("change", saveCurrentConsole);
addressInput.addEventListener("input", updateCommandUrl);
addressInput.addEventListener("change", () => { saveCurrentConsole(); updateCommandUrl(); });
addBtn.addEventListener("click", addConsole);
removeBtn.addEventListener("click", removeConsole);

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const url = updateCommandUrl();
  if (!url) { addressInput.focus(); return; }
  saveCurrentConsole();
  if (navigator.vibrate) navigator.vibrate(50);
  sendCommandUrl(url);
});

copyButton.addEventListener("click", async () => {
  const url = updateCommandUrl();
  if (!url) { addressInput.focus(); return; }
  try {
    await navigator.clipboard.writeText(url);
    saveCurrentConsole();
    setStatus("Command URL copied.");
  } catch { setStatus("Copy failed. Select the command URL manually.", true); }
});

checkButton.addEventListener("click", checkConnection);
installButton.addEventListener("click", promptInstallApp);

themeButtons.forEach(btn => {
  btn.addEventListener("click", () => applyTheme(btn.dataset.themeOption));
});

function handleSystemThemeChange() {
  if (loadSavedTheme() === "auto") applyTheme("auto");
}

if (typeof darkScheme.addEventListener === "function") {
  darkScheme.addEventListener("change", handleSystemThemeChange);
} else if (typeof darkScheme.addListener === "function") {
  darkScheme.addListener(handleSystemThemeChange);
}

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  updateInstallBanner();
});

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  setStatus("App installed.");
  updateInstallBanner();
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(() => {
      // The app still works when service workers are unavailable or blocked.
    });
  });
}
