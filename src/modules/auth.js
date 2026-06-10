import * as authApi from "../api/auth.js";
import * as ticketsApi from "../api/tickets.js";
import { fetchDashboardCounts } from "./ticketStats.js";
import { renderRecentTicketLinks } from "./recentTicketsList.js";
import { initArrowKeyListNav } from "./arrowKeyNav.js";
import { showFullScreenLoader, hideFullScreenLoader } from "./ui.js";

function setHomeStat(id, n) {
  const el = document.getElementById(id);
  if (el) el.textContent = n != null && Number.isFinite(n) ? String(n) : "—";
}

async function loadHomeDashboardStats() {
  const loading = document.getElementById("home-dash-loading");
  const errBox = document.getElementById("home-dash-error");
  const errMsg = document.getElementById("home-dash-error-message");
  const stats = document.getElementById("home-dash-stats");
  const recentSection = document.getElementById("home-dash-recent");

  if (!stats) return;

  if (loading) loading.hidden = false;
  if (errBox) errBox.hidden = true;
  stats.hidden = true;
  if (recentSection) recentSection.hidden = true;

  try {
    const recentQs = new URLSearchParams({
      _sort: "createdAt",
      _order: "desc",
      _limit: "5",
    }).toString();

    const [counts, recentRes] = await Promise.all([
      fetchDashboardCounts(),
      ticketsApi.listTickets(recentQs),
    ]);

    setHomeStat("home-stat-total", counts.total);
    setHomeStat("home-stat-open", counts.open);
    setHomeStat("home-stat-inprogress", counts.inprogress);
    setHomeStat("home-stat-resolved", counts.resolved);
    stats.hidden = false;

    renderRecentTicketLinks("home-recent-list", "home-recent-empty", recentRes.data || []);
    if (recentSection) recentSection.hidden = false;
  } catch (err) {
    const status = err && err.status != null ? " (" + err.status + ")" : "";
    if (errMsg) errMsg.textContent = "Could not load dashboard" + status + ".";
    if (errBox) errBox.hidden = false;
  } finally {
    if (loading) loading.hidden = true;
  }
}

export function syncAuthViews() {
  const loginView = document.getElementById("view-login");
  const dashboardView = document.getElementById("view-dashboard");
  const welcome = document.getElementById("welcome-line");
  const topAuthed = document.getElementById("app-top-bar-authed");
  const authed = authApi.isAuthenticated();

  if (loginView) loginView.hidden = authed;
  if (dashboardView) dashboardView.hidden = !authed;
  if (topAuthed) topAuthed.hidden = !authed;

  if (authed) {
    const user = authApi.getCurrentUser();
    if (welcome && user) {
      welcome.textContent = "Signed in as " + user.name + " (" + user.email + ").";
    }
    if (document.getElementById("home-dash-stats")) {
      loadHomeDashboardStats();
    }
  } else {
    const recentSection = document.getElementById("home-dash-recent");
    if (recentSection) recentSection.hidden = true;
    const stats = document.getElementById("home-dash-stats");
    if (stats) stats.hidden = true;
  }
}

export function initApp() {
  const form = document.getElementById("login-form");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const errorEl = document.getElementById("login-error");
  const submitBtn = document.getElementById("login-submit");
  const topLogoutBtn = document.getElementById("top-logout-btn");

  function showError(msg) {
    if (!errorEl) return;
    errorEl.textContent = msg;
    errorEl.hidden = false;
  }

  function clearError() {
    if (!errorEl) return;
    errorEl.textContent = "";
    errorEl.hidden = true;
  }

  syncAuthViews();

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!emailInput || !passwordInput || !submitBtn) return;
    clearError();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    submitBtn.disabled = true;
    try {
      showFullScreenLoader("Signing in…");
      await authApi.login(email, password);
      syncAuthViews();
    } catch (err) {
      showError(err.code === "AUTH_FAILED" ? "Invalid email or password." : "Something went wrong. Try again.");
    } finally {
      hideFullScreenLoader();
      submitBtn.disabled = false;
    }
  });

  topLogoutBtn?.addEventListener("click", function () {
    authApi.logout();
    clearError();
    syncAuthViews();
  });

  initArrowKeyListNav({
    root: document.getElementById("home-dash-recent"),
    itemSelector: "a.dash-recent-link",
    isEnabled: function () {
      const r = document.getElementById("home-dash-recent");
      return !!(r && !r.hidden);
    },
  });

  document.getElementById("home-dash-retry")?.addEventListener("click", function () {
    loadHomeDashboardStats();
  });
}
