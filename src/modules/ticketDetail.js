import * as authApi from "../api/auth.js";
import { get } from "../api/client.js";
import * as ticketsApi from "../api/tickets.js";
import { formatDateTime } from "../utils/formatDate.js";
import { toast, confirmDialog, showFullScreenLoader, hideFullScreenLoader } from "./ui.js";

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

function setDetailTextEditMode(on) {
  const titleEl = document.getElementById("detail-title");
  const panel = document.getElementById("detail-edit-panel");
  const custBlock = document.getElementById("detail-block-customer");
  const descBlock = document.getElementById("detail-block-description");
  const btnEdit = document.getElementById("detail-edit");
  if (panel) panel.hidden = !on;
  if (titleEl) titleEl.hidden = on;
  if (custBlock) custBlock.hidden = on;
  if (descBlock) descBlock.hidden = on;
  if (btnEdit) {
    btnEdit.textContent = on ? "Editing…" : "Edit ticket";
    btnEdit.disabled = on;
  }
}

function syncDetailEditInputsFromTicket(t) {
  const ti = document.getElementById("detail-edit-title");
  const cn = document.getElementById("detail-edit-customerName");
  const ce = document.getElementById("detail-edit-customerEmail");
  const de = document.getElementById("detail-edit-description");
  if (ti) ti.value = t.title || "";
  if (cn) cn.value = t.customerName || "";
  if (ce) ce.value = t.customerEmail || "";
  if (de) de.value = t.description || "";
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
  syncDetailEditInputsFromTicket(t);
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

function beginCommentEdit(li, c, bodyEl, actionsEl) {
  const ta = document.createElement("textarea");
  ta.className = "detail-comment__editor input-slot input-slot--live";
  ta.rows = 4;
  ta.value = bodyEl.textContent || "";
  bodyEl.replaceWith(ta);
  actionsEl.replaceChildren();

  const row = document.createElement("div");
  row.className = "detail-comment-edit-actions";

  const cancel = document.createElement("button");
  cancel.type = "button";
  cancel.className = "btn btn-secondary btn-xs";
  cancel.textContent = "Cancel";

  const save = document.createElement("button");
  save.type = "button";
  save.className = "btn btn-primary btn-xs";
  save.textContent = "Save";

  async function reloadComments() {
    const list = await ticketsApi.listComments(ticketId);
    fillComments(list);
  }

  cancel.addEventListener("click", function () {
    reloadComments().catch(function () {
      toast("Could not reload comments", { variant: "error" });
    });
  });

  save.addEventListener("click", async function () {
    const text = ta.value.trim();
    if (!text) {
      toast("Comment cannot be empty", { variant: "error" });
      return;
    }
    showFullScreenLoader("Saving comment…");
    try {
      await ticketsApi.updateComment(c.id, { content: text });
      await reloadComments();
      toast("Comment updated", { variant: "success" });
    } catch (e) {
      toast("Could not update comment", { variant: "error" });
    } finally {
      hideFullScreenLoader();
    }
  });

  row.appendChild(cancel);
  row.appendChild(save);
  actionsEl.appendChild(row);
}

function fillComments(list) {
  const ul = document.getElementById("detail-comments-list");
  const empty = document.getElementById("detail-comments-empty");
  if (!ul) return;

  ul.replaceChildren();
  const arr = Array.isArray(list) ? list : [];
  arr.sort(function (a, b) {
    return String(a.createdAt || "").localeCompare(String(b.createdAt || ""));
  });

  if (arr.length === 0) {
    if (empty) empty.hidden = false;
    return;
  }
  if (empty) empty.hidden = true;

  const me = authApi.getCurrentUser();

  for (let i = 0; i < arr.length; i++) {
    const c = arr[i];
    const li = document.createElement("li");
    li.className = "detail-comment";
    li.dataset.commentId = String(c.id);

    const head = document.createElement("div");
    head.className = "detail-comment__head";

    const meta = document.createElement("div");
    meta.className = "detail-comment__meta";

    const author = document.createElement("span");
    author.className = "detail-comment__author";
    author.textContent = nameForUser(c.authorId);

    const when = document.createElement("time");
    when.className = "detail-comment__time";
    when.dateTime = c.createdAt || "";
    when.textContent = formatDateTime(c.createdAt);

    meta.appendChild(author);
    meta.appendChild(when);
    head.appendChild(meta);

    const body = document.createElement("p");
    body.className = "detail-comment__body";
    body.textContent = c.content || "";

    li.appendChild(head);
    li.appendChild(body);

    const actions = document.createElement("div");
    actions.className = "detail-comment__actions";

    const canEdit =
      me && me.id != null && c.authorId != null && Number(me.id) === Number(c.authorId);
    if (canEdit) {
      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "btn btn-xs btn-comment-edit";
      editBtn.textContent = "Edit comment";
      editBtn.setAttribute("aria-label", "Edit this comment");
      editBtn.addEventListener("click", function () {
        beginCommentEdit(li, c, body, actions);
      });
      actions.appendChild(editBtn);
      li.appendChild(actions);
    }

    ul.appendChild(li);
  }
}

async function loadAll() {
  if (ticketId == null) return;
  setDetailTextEditMode(false);
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
      showFullScreenLoader("Deleting ticket…");
      try {
        await ticketsApi.deleteTicket(ticketId);
        toast("Ticket deleted", { variant: "success" });
        window.location.replace("tickets.html");
      } catch (e) {
        toast("Could not delete ticket", { variant: "error" });
      } finally {
        hideFullScreenLoader();
      }
    });
  }

  const btnEdit = document.getElementById("detail-edit");
  if (btnEdit) {
    btnEdit.addEventListener("click", function () {
      if (!currentTicket) return;
      syncDetailEditInputsFromTicket(currentTicket);
      setDetailTextEditMode(true);
    });
  }

  const btnCancel = document.getElementById("detail-edit-cancel");
  if (btnCancel) {
    btnCancel.addEventListener("click", function () {
      if (currentTicket) syncDetailEditInputsFromTicket(currentTicket);
      setDetailTextEditMode(false);
    });
  }

  const btnSave = document.getElementById("detail-edit-save");
  if (btnSave) {
    btnSave.addEventListener("click", async function () {
      const ti = document.getElementById("detail-edit-title");
      const cn = document.getElementById("detail-edit-customerName");
      const ce = document.getElementById("detail-edit-customerEmail");
      const de = document.getElementById("detail-edit-description");
      const title = ti ? ti.value.trim() : "";
      const customerName = cn ? cn.value.trim() : "";
      const customerEmail = ce ? ce.value.trim() : "";
      const description = de ? de.value.trim() : "";
      if (title.length < 3) {
        toast("Title must be at least 3 characters", { variant: "error" });
        return;
      }
      if (customerName.length < 2) {
        toast("Customer name is too short", { variant: "error" });
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
        toast("Enter a valid customer email", { variant: "error" });
        return;
      }
      if (description.length < 10) {
        toast("Description must be at least 10 characters", { variant: "error" });
        return;
      }
      showFullScreenLoader("Saving ticket…");
      try {
        await ticketsApi.updateTicket(ticketId, {
          title: title,
          customerName: customerName,
          customerEmail: customerEmail,
          description: description,
          updatedAt: new Date().toISOString(),
        });
        toast("Ticket updated", { variant: "success" });
        await loadAll();
      } catch (e) {
        toast("Could not save changes", { variant: "error" });
      } finally {
        hideFullScreenLoader();
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

  const commentForm = document.getElementById("detail-comment-form");
  const commentInput = document.getElementById("detail-comment-input");
  if (commentForm && commentInput) {
    commentForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const content = commentInput.value.trim();
      if (!content) {
        toast("Write a comment first", { variant: "error" });
        return;
      }
      const user = authApi.getCurrentUser();
      if (!user || user.id == null) {
        toast("You must be signed in to comment", { variant: "error" });
        return;
      }
      showFullScreenLoader("Posting comment…");
      try {
        await ticketsApi.addComment({
          ticketId: ticketId,
          authorId: user.id,
          content: content,
          createdAt: new Date().toISOString(),
        });
        const comments = await ticketsApi.listComments(ticketId);
        fillComments(comments);
        commentInput.value = "";
        toast("Comment added", { variant: "success" });
      } catch (err) {
        toast("Could not add comment", { variant: "error" });
      } finally {
        hideFullScreenLoader();
      }
    });
  }

  loadAll();
}
