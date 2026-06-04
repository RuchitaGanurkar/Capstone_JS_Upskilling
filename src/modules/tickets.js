import * as authApi from "../api/auth.js";
import { get } from "../api/client.js";
import * as ticketsApi from "../api/tickets.js";
import { formatDate } from "../utils/formatDate.js";
import { debounce } from "../utils/debounce.js";

const PAGE_SIZE = 10;
const FETCH_LIMIT = 500;
const PRIORITY_ORDER = { urgent: 0, high: 1, medium: 2, low: 3 };

let usersById = null;
let els = null;
let lastTotalPages = 1;

export const listState = {
  q: "",
  status: "all",
  priority: "all",
  assignee: "all",
  sort: "newest",
  page: 1,
};

export function buildQueryString(state) {
  const p = new URLSearchParams();
  const q = (state.q || "").trim();
  if (q) p.set("q", q);
  if (state.status !== "all") p.set("status", state.status);
  if (state.priority !== "all") p.set("priority", state.priority);
  if (state.assignee !== "all") p.set("assignedTo", String(state.assignee));
  if (state.sort === "status") {
    p.set("_sort", "status");
    p.set("_order", "asc");
  } else if (state.sort === "newest") {
    p.set("_sort", "createdAt");
    p.set("_order", "desc");
  }
  p.set("_limit", String(FETCH_LIMIT));
  return p.toString();
}

function readUrlIntoState() {
  let u;
  try {
    u = new URL(window.location.href);
  } catch {
    return;
  }
  const sp = u.searchParams;
  listState.q = sp.get("q") || "";
  listState.status = sp.get("status") || "all";
  listState.priority = sp.get("priority") || "all";
  listState.assignee = sp.get("assignee") || "all";
  listState.sort = sp.get("sort") || "newest";
  const pg = parseInt(sp.get("page") || "1", 10);
  listState.page = pg >= 1 ? pg : 1;

  const statuses = ["all", "open", "in-progress", "resolved", "closed"];
  if (statuses.indexOf(listState.status) === -1) listState.status = "all";
  const priorities = ["all", "low", "medium", "high", "urgent"];
  if (priorities.indexOf(listState.priority) === -1) listState.priority = "all";
  const sorts = ["newest", "priority", "status"];
  if (sorts.indexOf(listState.sort) === -1) listState.sort = "newest";
}

function urlFromState() {
  const p = new URLSearchParams();
  if (listState.q.trim()) p.set("q", listState.q.trim());
  if (listState.status !== "all") p.set("status", listState.status);
  if (listState.priority !== "all") p.set("priority", listState.priority);
  if (listState.assignee !== "all") p.set("assignee", String(listState.assignee));
  if (listState.sort !== "newest") p.set("sort", listState.sort);
  if (listState.page > 1) p.set("page", String(listState.page));
  const s = p.toString();
  return `${window.location.pathname}${s ? "?" + s : ""}${window.location.hash}`;
}

function syncUrlToAddressBar() {
  const next = urlFromState();
  const cur = window.location.pathname + window.location.search + window.location.hash;
  if (next !== cur) history.replaceState(null, "", next);
}

function applyStateToForm() {
  if (!els) return;
  if (els.search) els.search.value = listState.q;
  if (els.status) els.status.value = listState.status;
  if (els.priority) els.priority.value = listState.priority;
  if (els.sort) els.sort.value = listState.sort;
  if (els.assignee && usersById) {
    const keep = listState.assignee;
    els.assignee.innerHTML = "";
    const o0 = document.createElement("option");
    o0.value = "all";
    o0.textContent = "All assignees";
    els.assignee.appendChild(o0);
    const ids = [...usersById.keys()].sort((a, b) => {
      const na = usersById.get(a).name || "";
      const nb = usersById.get(b).name || "";
      return na.localeCompare(nb);
    });
    for (const id of ids) {
      const u = usersById.get(id);
      const o = document.createElement("option");
      o.value = String(id);
      o.textContent = u.name || "User #" + id;
      els.assignee.appendChild(o);
    }
    if (keep !== "all" && usersById.has(Number(keep))) els.assignee.value = String(keep);
    else {
      listState.assignee = "all";
      els.assignee.value = "all";
    }
  }
}

function sortRows(rows, sortKey) {
  if (sortKey !== "priority") return rows;
  return rows.slice().sort(function (a, b) {
    const ra = PRIORITY_ORDER[a.priority] != null ? PRIORITY_ORDER[a.priority] : 99;
    const rb = PRIORITY_ORDER[b.priority] != null ? PRIORITY_ORDER[b.priority] : 99;
    if (ra !== rb) return ra - rb;
    return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
  });
}

export function renderTable(tickets) {
  const tbody = document.getElementById("tickets-tbody");
  if (!tbody) return;
  const frag = document.createDocumentFragment();
  for (let i = 0; i < tickets.length; i++) {
    const t = tickets[i];
    const tr = document.createElement("tr");
    const cells = [
      String(t.id),
      t.title || "",
      t.customerName || "",
      t.priority || "",
      t.status || "",
      t.assignedTo == null ? "None" : usersById && usersById.get(t.assignedTo)
        ? usersById.get(t.assignedTo).name
        : "User #" + t.assignedTo,
      formatDate(t.createdAt),
    ];
    for (let j = 0; j < cells.length; j++) {
      const td = document.createElement("td");
      td.textContent = cells[j];
      tr.appendChild(td);
    }
    frag.appendChild(tr);
  }
  tbody.replaceChildren(frag);
}

export async function refresh() {
  if (!els) return;
  if (!authApi.isAuthenticated()) {
    window.location.replace("index.html");
    return;
  }

  if (els.search) listState.q = els.search.value.trim();

  const loading = document.getElementById("tickets-loading");
  const errBox = document.getElementById("tickets-error");
  const errMsg = document.getElementById("tickets-error-message");
  const empty = document.getElementById("tickets-empty");
  const wrap = document.getElementById("tickets-table-wrap");

  loading.hidden = false;
  errBox.hidden = true;
  empty.hidden = true;
  wrap.hidden = true;

  try {
    if (!usersById) {
      try {
        const users = await get("/users");
        usersById = new Map((Array.isArray(users) ? users : []).map(function (u) {
          return [u.id, u];
        }));
      } catch (e) {
        usersById = null;
      }
    }

    const qs = buildQueryString(listState);
    const res = await ticketsApi.listTickets(qs);
    let rows = res.data || [];
    rows = sortRows(rows, listState.sort);
    const total = res.totalCount != null ? res.totalCount : rows.length;
    let totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    if (listState.page > totalPages) listState.page = totalPages;
    lastTotalPages = totalPages;
    const start = (listState.page - 1) * PAGE_SIZE;
    const pageRows = rows.slice(start, start + PAGE_SIZE);

    applyStateToForm();

    const prevBtn = document.getElementById("tickets-page-prev");
    const nextBtn = document.getElementById("tickets-page-next");
    const nums = document.getElementById("tickets-page-numbers");
    const summary = document.getElementById("tickets-page-summary");

    if (summary) summary.textContent = "Page " + listState.page + " of " + totalPages;

    if (prevBtn) prevBtn.disabled = listState.page <= 1;
    if (nextBtn) nextBtn.disabled = listState.page >= totalPages;

    if (nums) {
      nums.replaceChildren();
      for (let p = 1; p <= totalPages; p++) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "tickets-page-btn" + (p === listState.page ? " is-active" : "");
        b.textContent = String(p);
        b.dataset.page = String(p);
        nums.appendChild(b);
      }
    }

    syncUrlToAddressBar();

    if (pageRows.length === 0) {
      empty.hidden = false;
      return;
    }

    renderTable(pageRows);
    wrap.hidden = false;
  } catch (err) {
    const status = err && err.status != null ? " (" + err.status + ")" : "";
    const aborted = err && err.name === "AbortError";
    const badFetch =
      aborted ||
      (err && err.name === "TypeError") ||
      (err && typeof err.message === "string" && err.message.toLowerCase().indexOf("fetch") !== -1);
    if (errMsg) {
      errMsg.textContent = badFetch ? "json-server is offline" + status : "failed to load tickets" + status + ".";
    }
    errBox.hidden = false;
  } finally {
    loading.hidden = true;
  }
}

const debouncedRefresh = debounce(refresh, 300);

export function initTicketsList() {
  if (document.body && document.body.dataset.page !== "tickets-list") return;
  if (!document.getElementById("view-tickets")) return;
  if (!authApi.isAuthenticated()) {
    window.location.replace("index.html");
    return;
  }

  readUrlIntoState();

  els = {
    search: document.getElementById("tickets-search"),
    status: document.getElementById("tickets-status"),
    priority: document.getElementById("tickets-priority"),
    assignee: document.getElementById("tickets-assignee"),
    sort: document.getElementById("tickets-sort"),
  };

  if (els.search) {
    els.search.addEventListener("input", function () {
      listState.q = els.search.value.trim();
      listState.page = 1;
      debouncedRefresh();
    });
  }

  function onFilterChange() {
    if (els.status) listState.status = els.status.value;
    if (els.priority) listState.priority = els.priority.value;
    if (els.assignee) listState.assignee = els.assignee.value;
    if (els.sort) listState.sort = els.sort.value;
    listState.page = 1;
    refresh();
  }

  if (els.status) els.status.addEventListener("change", onFilterChange);
  if (els.priority) els.priority.addEventListener("change", onFilterChange);
  if (els.assignee) els.assignee.addEventListener("change", onFilterChange);
  if (els.sort) els.sort.addEventListener("change", onFilterChange);

  document.getElementById("tickets-page-prev") &&
    document.getElementById("tickets-page-prev").addEventListener("click", function () {
      if (listState.page > 1) {
        listState.page--;
        refresh();
      }
    });

  document.getElementById("tickets-page-next") &&
    document.getElementById("tickets-page-next").addEventListener("click", function () {
      if (listState.page < lastTotalPages) {
        listState.page++;
        refresh();
      }
    });

  const nums = document.getElementById("tickets-page-numbers");
  if (nums) {
    nums.addEventListener("click", function (e) {
      const btn = e.target.closest("[data-page]");
      if (!btn) return;
      const n = parseInt(btn.getAttribute("data-page"), 10);
      if (n >= 1) {
        listState.page = n;
        refresh();
      }
    });
  }

  window.addEventListener("popstate", function () {
    readUrlIntoState();
    applyStateToForm();
    refresh();
  });

  document.getElementById("tickets-retry") &&
    document.getElementById("tickets-retry").addEventListener("click", refresh);

  document.getElementById("tickets-logout") &&
    document.getElementById("tickets-logout").addEventListener("click", function () {
      authApi.logout();
      window.location.replace("index.html");
    });

  refresh();
}
