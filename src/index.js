import { initApp } from "./modules/auth.js";
import { initTicketsList } from "./modules/tickets.js";
import { initTicketDetail } from "./modules/ticketDetail.js";
import { initDashboard } from "./modules/dashboard.js";
import { initTheme } from "./modules/theme.js";

initTheme();

const page = document.body?.dataset?.page;

if (page === "tickets-list") {
  initTicketsList();
} else if (page === "ticket-detail") {
  initTicketDetail();
} else if (page === "dashboard") {
  initDashboard();
} else {
  initApp();
}
