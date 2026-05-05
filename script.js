const STORAGE_KEY = "ps3-home-button-helper.address";
const DEFAULT_ADDRESS = "192.168.1.50";
const COMMAND_PATH = "/pad.ps3?_psbtn_go";

const form = document.querySelector("#commandForm");
const addressInput = document.querySelector("#ps3Address");
const commandUrlOutput = document.querySelector("#commandUrl");
const directLink = document.querySelector("#directLink");
const copyButton = document.querySelector("#copyButton");
const statusMessage = document.querySelector("#statusMessage");

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

function openCommandUrl(commandUrl) {
  const opened = window.open(commandUrl, "_blank");

  if (!opened) {
    setStatus("The browser blocked the new tab. Use the direct link instead.", true);
    return;
  }

  try {
    opened.opener = null;
  } catch {
    // Some browsers lock the popup immediately after navigation.
  }

  setStatus("Command opened. The PS3 may show an empty browser response.");
}

addressInput.value = loadSavedAddress();
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
  openCommandUrl(commandUrl);
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

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(() => {
      // The app still works when service workers are unavailable or blocked.
    });
  });
}
