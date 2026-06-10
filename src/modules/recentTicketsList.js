import { formatDate } from "../utils/formatDate.js";

export function renderRecentTicketLinks(listId, emptyId, tickets) {
  const ul = document.getElementById(listId);
  const empty = emptyId ? document.getElementById(emptyId) : null;
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
