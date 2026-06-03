import { get, post, patch, del } from "./client.js";

export function listTickets() {
  return get("/tickets");
}

export function getTicket(id) {
  return get(`/tickets/${encodeURIComponent(id)}`);
}

export function createTicket(body) {
  return post("/tickets", body);
}

export function updateTicket(id, body) {
  return patch(`/tickets/${encodeURIComponent(id)}`, body);
}

export function deleteTicket(id) {
  return del(`/tickets/${encodeURIComponent(id)}`);
}

export function listComments(ticketId) {
  const q = new URLSearchParams({
    ticketId: String(ticketId),
    _sort: "createdAt",
    _order: "asc",
  });
  return get(`/comments?${q.toString()}`);
}

export function addComment(body) {
  return post("/comments", body);
}
