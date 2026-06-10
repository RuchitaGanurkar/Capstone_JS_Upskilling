import * as authApi from "../api/auth.js";
import * as ticketsApi from "../api/tickets.js";
import { fetchDashboardCounts } from "./ticketStats.js";
import { renderRecentTicketLinks } from "./recentTicketsList.js";

function setStat(id, n) {
  const el = document.getElementById(id);
  if (el) el.textContent = n != null && Number.isFinite(n) ? String(n) : "—";
}

async function loadDashboard() {
  const loading = document.getElementById("dash-loading");
  const errBox = document.getElementById("dash-error");
  const errMsg = document.getElementById("dash-error-message");
  const shell = document.getElementById("dash-shell");

  if (loading) loading.hidden = false;
  if (errBox) errBox.hidden = true;
  if (shell) shell.hidden = true;

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

    setStat("dash-stat-total", counts.total);
    setStat("dash-stat-open", counts.open);
    setStat("dash-stat-inprogress", counts.inprogress);
    setStat("dash-stat-resolved", counts.resolved);
    renderRecentTicketLinks("dash-recent-list", "dash-recent-empty", recentRes.data || []);

    if (shell) shell.hidden = false;
  } catch (err) {
    const status = err && err.status != null ? " (" + err.status + ")" : "";
    if (errMsg) errMsg.textContent = "Could not load dashboard" + status + ".";
    if (errBox) errBox.hidden = false;
  } finally {
    if (loading) loading.hidden = true;
  }
}

export function initDashboard() {
  if (document.body && document.body.dataset.page !== "dashboard") return;
  if (!document.getElementById("view-dashboard-page")) return;

  if (!authApi.isAuthenticated()) {
    window.location.replace("index.html");
    return;
  }

  const logout = document.getElementById("dash-logout");
  if (logout) {
    logout.addEventListener("click", function () {
      authApi.logout();
      window.location.replace("index.html");
    });
  }

  const retry = document.getElementById("dash-retry");
  if (retry) retry.addEventListener("click", loadDashboard);

  loadDashboard();
}
