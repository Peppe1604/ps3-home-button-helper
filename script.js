const STORAGE_KEY = "ps3-home-button-helper.address";
const THEME_STORAGE_KEY = "ps3-home-button-helper.theme";
const DEFAULT_ADDRESS = "192.168.1.50";
const COMMAND_PATH = "/pad.ps3?_psbtn_go";
const THEME_COLORS = {
  light: "#f4f6f5",
  dark: "#0f1416"
};

const form = document.querySelector("#commandForm");
const addressInput = document.querySelector("#ps3Address");
const commandUrlOutput = document.querySelector("#commandUrl");
const directLink = document.querySelector("#directLink");
const copyButton = document.querySelector("#copyButton");
const statusMessage = document.querySelector("#statusMessage");
const themeColorMeta = document.querySelector("#themeColor");
const themeButtons = document.querySelectorAll("[data-theme-option]");
const darkScheme = window.matchMedia("(prefers-color-scheme: dark)");
let commandFrame = null;
let commandTimeoutId = 0;

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
  const origin = normalizeAddress(addressInput.value);
  return `${origin}${COMMAND_PATH}`;
}

function setStatus(message, isWarning = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("is-warning", isWarning);
}

function loadSavedAddress() {
  try {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_ADDRESS;
  } catch {
    return DEFAULT_ADDRESS;
  }
}

function loadSavedTheme() {
  try {
    const theme = localStorage.getItem(THEME_STORAGE_KEY);
    return theme === "light" || theme === "dark" ? theme : "auto";
  } catch {
    return "auto";
  }
}

function getEffectiveTheme(theme) {
  if (theme === "light" || theme === "dark") {
    return theme;
  }

  return darkScheme.matches ? "dark" : "light";
}

function saveTheme(theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Theme persistence can be unavailable on file:// or in strict privacy modes.
  }
}

function applyTheme(theme) {
  const selectedTheme = theme === "light" || theme === "dark" ? theme : "auto";

  if (selectedTheme === "auto") {
    delete document.documentElement.dataset.theme;
  } else {
    document.documentElement.dataset.theme = selectedTheme;
  }

  themeButtons.forEach((button) => {
    const isActive = button.dataset.themeOption === selectedTheme;
    button.setAttribute("aria-pressed", String(isActive));
  });

  if (themeColorMeta) {
    themeColorMeta.content = THEME_COLORS[getEffectiveTheme(selectedTheme)];
  }

  saveTheme(selectedTheme);
}

function updateCommandUrl() {
  try {
    const commandUrl = getCommandUrl();
    commandUrlOutput.value = commandUrl;
    directLink.href = commandUrl;
    setStatus("");
    return commandUrl;
  } catch (error) {
    commandUrlOutput.value = "Invalid PS3 address";
    directLink.removeAttribute("href");
    setStatus(error.message, true);
    return "";
  }
}

function saveAddress() {
  let origin = "";

  try {
    origin = normalizeAddress(addressInput.value);
  } catch {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Local storage can be unavailable on file:// or in strict privacy modes.
    }
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, origin.replace(/^https?:\/\//, ""));
  } catch {
    // The app still works when the browser refuses persistence.
  }
}

function clearCommandFrame() {
  if (commandTimeoutId) {
    window.clearTimeout(commandTimeoutId);
    commandTimeoutId = 0;
  }

  if (commandFrame) {
    commandFrame.remove();
    commandFrame = null;
  }
}

function sendCommandWithFrame(commandUrl) {
  clearCommandFrame();

  commandFrame = document.createElement("iframe");
  commandFrame.className = "command-frame";
  commandFrame.title = "PS3 command response";
  commandFrame.setAttribute("aria-hidden", "true");
  commandFrame.tabIndex = -1;

  commandFrame.addEventListener(
    "load",
    () => {
      clearCommandFrame();
      setStatus("PS/Home command sent. You can stay on this page.");
    },
    { once: true }
  );

  commandFrame.addEventListener(
    "error",
    () => {
      clearCommandFrame();
      setStatus("The browser blocked the background request. Use the direct link instead.", true);
    },
    { once: true }
  );

  commandTimeoutId = window.setTimeout(() => {
    clearCommandFrame();
    setStatus(
      "No response was detected. If the PS3 did not react, use the direct link.",
      true
    );
  }, 5000);

  setStatus("Sending PS/Home command...");
  commandFrame.src = commandUrl;
  document.body.appendChild(commandFrame);
}

async function sendCommandUrl(commandUrl) {
  clearCommandFrame();
  setStatus("Sending PS/Home command...");

  if ("fetch" in window && "AbortController" in window) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 5000);

    try {
      await fetch(commandUrl, {
        method: "GET",
        mode: "no-cors",
        cache: "no-store",
        signal: controller.signal
      });
      window.clearTimeout(timeoutId);
      setStatus("PS/Home command sent. You can stay on this page.");
      return;
    } catch {
      window.clearTimeout(timeoutId);
    }
  }

  sendCommandWithFrame(commandUrl);
}

addressInput.value = loadSavedAddress();
applyTheme(loadSavedTheme());
updateCommandUrl();

addressInput.addEventListener("input", updateCommandUrl);

addressInput.addEventListener("change", () => {
  saveAddress();
  updateCommandUrl();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const commandUrl = updateCommandUrl();

  if (!commandUrl) {
    addressInput.focus();
    return;
  }

  saveAddress();
  sendCommandUrl(commandUrl);
});

copyButton.addEventListener("click", async () => {
  const commandUrl = updateCommandUrl();

  if (!commandUrl) {
    addressInput.focus();
    return;
  }

  try {
    await navigator.clipboard.writeText(commandUrl);
    saveAddress();
    setStatus("Command URL copied.");
  } catch {
    setStatus("Copy failed. Select the command URL manually.", true);
  }
});

themeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    applyTheme(button.dataset.themeOption);
  });
});

function handleSystemThemeChange() {
  if (loadSavedTheme() === "auto") {
    applyTheme("auto");
  }
}

if (typeof darkScheme.addEventListener === "function") {
  darkScheme.addEventListener("change", handleSystemThemeChange);
} else if (typeof darkScheme.addListener === "function") {
  darkScheme.addListener(handleSystemThemeChange);
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(() => {
      // The app still works when service workers are unavailable or blocked.
    });
  });
}
