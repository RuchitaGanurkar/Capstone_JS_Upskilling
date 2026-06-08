import * as authApi from "../api/auth.js";
import * as ticketsApi from "../api/tickets.js";
import { formatDate } from "../utils/formatDate.js";

function countQs(extra) {
  const p = new URLSearchParams({ _limit: "1" });
  if (extra) {
    for (const k in extra) {
      if (Object.prototype.hasOwnProperty.call(extra, k)) p.set(k, extra[k]);
    }
  }
  return p.toString();
}

function setStat(id, n) {
  const el = document.getElementById(id);
  if (el) el.textContent = n != null && Number.isFinite(n) ? String(n) : "—";
}

function renderRecent(tickets) {
  const ul = document.getElementById("dash-recent-list");
  const empty = document.getElementById("dash-recent-empty");
  if (!ul) return;
  ul.replaceChildren();
  const list = Array.isArray(tickets) ? tickets : [];
  if (list.length === 0) {
    if (empty) empty.hidden = false;
    return;
  }
  if (empty) empty.hidden = true;
  for (let i = 0; i < list.length; i++) {
    const t = list[i];
    const li = document.createElement("li");
    li.className = "dash-recent-item";
    const a = document.createElement("a");
    a.className = "dash-recent-link";
    a.href = "ticket-detail.html?id=" + encodeURIComponent(String(t.id));
    const title = document.createElement("span");
    title.className = "dash-recent-link__title";
    title.textContent = t.title || "Ticket #" + t.id;
    const meta = document.createElement("span");
    meta.className = "dash-recent-link__meta";
    meta.textContent =
      "#" + t.id + " · " + (t.status || "—") + " · " + formatDate(t.createdAt);
    a.appendChild(title);
    a.appendChild(meta);
    li.appendChild(a);
    ul.appendChild(li);
  }
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

    const [totalRes, openRes, progRes, resolvedRes, recentRes] = await Promise.all([
      ticketsApi.getTicketsCount(countQs()),
      ticketsApi.getTicketsCount(countQs({ status: "open" })),
      ticketsApi.getTicketsCount(countQs({ status: "in-progress" })),
      ticketsApi.getTicketsCount(countQs({ status: "resolved" })),
      ticketsApi.listTickets(recentQs),
    ]);

    setStat("dash-stat-total", totalRes.totalCount);
    setStat("dash-stat-open", openRes.totalCount);
    setStat("dash-stat-inprogress", progRes.totalCount);
    setStat("dash-stat-resolved", resolvedRes.totalCount);
    renderRecent(recentRes.data || []);

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
