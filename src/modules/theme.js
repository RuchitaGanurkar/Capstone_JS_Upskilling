const STORAGE_KEY = "deskhub-theme";

function getPreferredTheme() {
  if (typeof window === "undefined" || !window.matchMedia) return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function readStoredTheme() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "light" || v === "dark") return v;
  } catch {
  }
  return null;
}

export function getTheme() {
  const t = document.documentElement.getAttribute("data-theme");
  if (t === "light" || t === "dark") return t;
  return "dark";
}

function applyDomTheme(theme) {
  const next = theme === "light" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  syncToggleLabels();
}

export function setTheme(theme) {
  const next = theme === "light" ? "light" : "dark";
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
  }
  applyDomTheme(next);
}

function syncToggleLabels() {
  const t = getTheme();
  const nextLabel = t === "dark" ? "Light mode" : "Dark mode";
  const nodes = document.querySelectorAll("[data-theme-toggle]");
  for (let i = 0; i < nodes.length; i++) {
    const el = nodes[i];
    el.textContent = nextLabel;
    el.setAttribute("aria-label", "Switch to " + (t === "dark" ? "light" : "dark") + " theme");
  }
}

export function initTheme() {
  const stored = readStoredTheme();
  applyDomTheme(stored != null ? stored : getPreferredTheme());

  document.addEventListener("click", function (e) {
    const btn = e.target.closest("[data-theme-toggle]");
    if (!btn) return;
    e.preventDefault();
    setTheme(getTheme() === "dark" ? "light" : "dark");
  });

  if (typeof window !== "undefined" && window.matchMedia) {
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = function () {
      if (readStoredTheme() != null) return;
      applyDomTheme(mq.matches ? "light" : "dark");
    };
    if (typeof mq.addEventListener === "function") mq.addEventListener("change", onChange);
    else if (typeof mq.addEventListener === "function") mq.addEventListener(onChange);
  }
}
