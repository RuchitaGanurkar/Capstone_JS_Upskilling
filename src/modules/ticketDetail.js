import * as authApi from "../api/auth.js";
import { get } from "../api/client.js";
import * as ticketsApi from "../api/tickets.js";
import { formatDateTime } from "../utils/formatDate.js";
import { toast, confirmDialog } from "./ui.js";

let ticketId = null;
let currentTicket = null;
let usersById = null;

function idFromUrl() {
  const n = parseInt(new URLSearchParams(location.search).get("id") || "", 10);
  return n >= 1 ? n : null;
}

function showLoading(on) {
  const el = document.getElementById("detail-loading");
  if (el) el.hidden = !on;
}

function showError(on, text) {
  const box = document.getElementById("detail-error");
  const msg = document.getElementById("detail-error-message");
  const shell = document.getElementById("detail-shell");
  if (msg) msg.textContent = text || "";
  if (box) box.hidden = !on;
  if (shell && on) shell.hidden = true;
}

function usersToMap(users) {
  const list = Array.isArray(users) ? users : [];
  const map = new Map();
  for (let i = 0; i < list.length; i++) {
    map.set(list[i].id, list[i]);
  }
  return map;
}

function nameForUser(id) {
  if (id == null) return "Unassigned";
  const u = usersById && usersById.get(id);
  if (u && u.name) return u.name;
  return "User #" + id;
}

function fillTicket(t) {
  currentTicket = t;

  const set = function (id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  set("detail-heading", "Ticket #" + t.id);
  set("detail-id", String(t.id));
  set("detail-title", t.title || "");
  set("detail-category", t.category || "—");
  set("detail-created", formatDateTime(t.createdAt));
  set("detail-updated", formatDateTime(t.updatedAt));
  set("detail-customer-name", t.customerName || "—");
  set("detail-customer-email", t.customerEmail || "—");

  const desc = document.getElementById("detail-description");
  if (desc) desc.textContent = t.description || "";

  const st = document.getElementById("detail-status");
  if (st) st.value = t.status || "open";

  const pr = document.getElementById("detail-priority");
  if (pr) pr.value = t.priority || "medium";

  const as = document.getElementById("detail-assignee");
  if (as) {
    as.innerHTML = "";
    const o0 = document.createElement("option");
    o0.value = "";
    o0.textContent = "Unassigned";
    as.appendChild(o0);
    if (usersById) {
      const ids = Array.from(usersById.keys()).sort(function (a, b) {
        const na = (usersById.get(a) && usersById.get(a).name) || "";
        const nb = (usersById.get(b) && usersById.get(b).name) || "";
        return na.localeCompare(nb);
      });
      for (let i = 0; i < ids.length; i++) {
        const uid = ids[i];
        const u = usersById.get(uid);
        const o = document.createElement("option");
        o.value = String(uid);
        o.textContent = (u && u.name) || "User #" + uid;
        as.appendChild(o);
      }
    }
    as.value = t.assignedTo != null ? String(t.assignedTo) : "";
  }
}

function fillComments(list) {
  const ul = document.getElementById("detail-comments-list");
  const empty = document.getElementById("detail-comments-empty");
  if (!ul) return;

  ul.replaceChildren();
  const arr = Array.isArray(list) ? list : [];

  if (arr.length === 0) {
    if (empty) empty.hidden = false;
    return;
  }
  if (empty) empty.hidden = true;

  for (let i = 0; i < arr.length; i++) {
    const c = arr[i];
    const li = document.createElement("li");
    li.className = "detail-comment";

    const head = document.createElement("div");
    head.className = "detail-comment__head";

    const author = document.createElement("span");
    author.className = "detail-comment__author";
    author.textContent = nameForUser(c.authorId);

    const when = document.createElement("time");
    when.className = "detail-comment__time";
    when.dateTime = c.createdAt || "";
    when.textContent = formatDateTime(c.createdAt);

    head.appendChild(author);
    head.appendChild(when);

    const body = document.createElement("p");
    body.className = "detail-comment__body";
    body.textContent = c.content || "";

    li.appendChild(head);
    li.appendChild(body);
    ul.appendChild(li);
  }
}

async function loadAll() {
  if (ticketId == null) return;
  showLoading(true);
  showError(false, "");

  try {
    const results = await Promise.all([
      ticketsApi.getTicket(ticketId),
      ticketsApi.listComments(ticketId),
      get("/users").catch(function () {
        return [];
      }),
    ]);
    usersById = usersToMap(results[2]);
    fillTicket(results[0]);
    fillComments(results[1]);
    const shell = document.getElementById("detail-shell");
    if (shell) shell.hidden = false;
  } catch (err) {
    const status = err && err.status != null ? " (" + err.status + ")" : "";
    const text =
      err && err.status === 404 ? "Ticket not found." : "Could not load ticket" + status + ".";
    showError(true, text);
  } finally {
    showLoading(false);
  }
}

function syncStatusSelect(sel) {
  if (!sel || !currentTicket) return;
  sel.value = currentTicket.status || "open";
}

function syncPrioritySelect(sel) {
  if (!sel || !currentTicket) return;
  sel.value = currentTicket.priority || "medium";
}

function syncAssigneeSelect(sel) {
  if (!sel || !currentTicket) return;
  sel.value = currentTicket.assignedTo != null ? String(currentTicket.assignedTo) : "";
}

export function initTicketDetail() {
  if (document.body && document.body.dataset.page !== "ticket-detail") return;
  if (!document.getElementById("view-ticket-detail")) return;

  if (!authApi.isAuthenticated()) {
    window.location.replace("index.html");
    return;
  }

  ticketId = idFromUrl();
  if (ticketId == null) {
    toast("Missing ticket id", { variant: "error" });
    window.location.replace("tickets.html");
    return;
  }

  const retry = document.getElementById("detail-retry");
  if (retry) retry.addEventListener("click", loadAll);

  const logout = document.getElementById("detail-logout");
  if (logout) {
    logout.addEventListener("click", function () {
      authApi.logout();
      window.location.replace("index.html");
    });
  }

  const del = document.getElementById("detail-delete");
  if (del) {
    del.addEventListener("click", async function () {
      const ok = await confirmDialog("Are you sure?", {
        confirmText: "Yes",
        cancelText: "No",
      });
      if (!ok) return;
      try {
        await ticketsApi.deleteTicket(ticketId);
        toast("Ticket deleted", { variant: "success" });
        window.location.replace("tickets.html");
      } catch (e) {
        toast("Could not delete ticket", { variant: "error" });
      }
    });
  }

  const st = document.getElementById("detail-status");
  if (st) {
    st.addEventListener("change", async function () {
      try {
        await ticketsApi.updateTicket(ticketId, { status: st.value });
        toast("Saved", { variant: "success" });
        await loadAll();
      } catch (e) {
        toast("Update failed", { variant: "error" });
        syncStatusSelect(st);
      }
    });
  }

  const pr = document.getElementById("detail-priority");
  if (pr) {
    pr.addEventListener("change", async function () {
      try {
        await ticketsApi.updateTicket(ticketId, { priority: pr.value });
        toast("Saved", { variant: "success" });
        await loadAll();
      } catch (e) {
        toast("Update failed", { variant: "error" });
        syncPrioritySelect(pr);
      }
    });
  }

  const as = document.getElementById("detail-assignee");
  if (as) {
    as.addEventListener("change", async function () {
      const raw = as.value;
      const assignedTo = raw === "" ? null : parseInt(raw, 10);
      try {
        await ticketsApi.updateTicket(ticketId, { assignedTo: assignedTo });
        toast("Saved", { variant: "success" });
        await loadAll();
      } catch (e) {
        toast("Update failed", { variant: "error" });
        syncAssigneeSelect(as);
      }
    });
  }

  loadAll();
}
