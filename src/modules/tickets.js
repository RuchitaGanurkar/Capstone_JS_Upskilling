import * as authApi from "../api/auth.js";
import { get } from "../api/client.js";
import * as ticketsApi from "../api/tickets.js";
import { formatDate } from "../utils/formatDate.js";
 
let usersById = null; // initial loading look for user id

function redirectToLogin() {
  window.location.replace("index.html"); // if user id is absent in localstorage it redirect to login
}

async function loadUsersOnce() { // loads user 
  if (usersById) return usersById;
  const users = await get("/users");
  usersById = new Map((Array.isArray(users) ? users : []).map((u) => [u.id, u]));
  return usersById;
}

function assigneeName(assignedTo) { // loads assignee name
  if (assignedTo == null) return "None";
  const u = usersById?.get(assignedTo);
  return u?.name ?? `User #${assignedTo}`;
}

export function renderTable(tickets) { // loads ticket table 
  const tbody = document.getElementById("tickets-tbody");
  if (!tbody) return;

  const fragment = document.createDocumentFragment();
  for (const t of tickets) {
    const tr = document.createElement("tr"); // handle table rows

    const cells = [
      String(t.id),
      t.title ?? "",
      t.customerName ?? "",
      t.priority ?? "",
      t.status ?? "",
      assigneeName(t.assignedTo),
      formatDate(t.createdAt),
    ];

    for (const text of cells) {
      const td = document.createElement("td"); // handle table columns
      td.textContent = text;
      tr.appendChild(td);
    }
    fragment.appendChild(tr);
  }
  tbody.replaceChildren(fragment);
}

function setVisible(el, visible) {
  if (!el) return;
  el.hidden = !visible;
}

let domRefs = null;

export async function refresh() {
  if (!domRefs) return;
  if (!authApi.isAuthenticated()) {
    redirectToLogin();
    return;
  }

  const { loadingEl, errorEl, errorMsg, emptyEl, wrapEl } = domRefs; // dom elements

  setVisible(loadingEl, true);
  setVisible(errorEl, false);
  setVisible(emptyEl, false);
  setVisible(wrapEl, false);

  try {
    const [tickets] = await Promise.all([ticketsApi.listTickets(), loadUsersOnce()]);
    const list = Array.isArray(tickets) ? tickets : [];

    if (list.length === 0) {
      setVisible(emptyEl, true);
      return;
    }

    renderTable(list);
    setVisible(wrapEl, true);
  } catch (err) {
    if (errorMsg) {
      const status = err?.status != null ? ` (${err.status})` : "";
      const aborted = err?.name === "AbortError";
      const unreachable =
        aborted ||
        err?.name === "TypeError" ||
        (typeof err?.message === "string" && err.message.toLowerCase().includes("fetch"));
      errorMsg.textContent = unreachable
        ? `json-server is offline${status}`
        : `failed to load tickets${status}.`;
    }
    setVisible(errorEl, true);
  } finally {
    setVisible(loadingEl, false);
  }
}

export function initTicketsList() {
  if (document.body?.dataset?.page !== "tickets-list") return;

  const ticketsRoot = document.getElementById("view-tickets");
  if (!ticketsRoot) return;

  if (!authApi.isAuthenticated()) {
    redirectToLogin();
    return;
  }

  domRefs = {
    loadingEl: document.getElementById("tickets-loading"),
    errorEl: document.getElementById("tickets-error"),
    errorMsg: document.getElementById("tickets-error-message"),
    emptyEl: document.getElementById("tickets-empty"),
    wrapEl: document.getElementById("tickets-table-wrap"),
  };

  const retryBtn = document.getElementById("tickets-retry");
  const logoutBtn = document.getElementById("tickets-logout");

  retryBtn?.addEventListener("click", () => {
    refresh();
  });

  logoutBtn?.addEventListener("click", () => {
    authApi.logout();
    redirectToLogin();
  });

  refresh();
}
