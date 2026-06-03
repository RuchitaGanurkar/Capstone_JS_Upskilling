import { initApp } from "./modules/auth.js";
import { initTicketsList } from "./modules/tickets.js";

const page = document.body?.dataset?.page;

if (page === "tickets-list") {
  initTicketsList();
} else {
  initApp();
}
