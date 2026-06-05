import { initApp } from "./modules/auth.js";
import { initTicketsList } from "./modules/tickets.js";
import { initTicketDetail } from "./modules/ticketDetail.js";

const page = document.body?.dataset?.page;

if (page === "tickets-list") {
  initTicketsList();
} else if (page === "ticket-detail") {
  initTicketDetail();
} else {
  initApp();
}
