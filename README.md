## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run the API + UI together (one command)
npm run dev
```

# Phase 1 - Foundations & Login

**Goal:** get the dev loop running, build the login flow end-to-end

- Run npm run dev, confirm both services are up
- Create public/index.html (login page) — semantic form, basic CSS
- Implement utils/storage.js — get / set / remove / clear with prefix
- Implement api/client.js — request, get, post, patch, del
- Implement api/auth.js — login, logout, getCurrentUser, isAuthenticated
- Implement modules/auth.js — wire up the form, redirect on success
- On wrong creds: show inline error, button stays enabled
- On success: store token + user, navigate to dashboard.html

**Done when:** you can log in with ruchita@deskhub.in / demo123 and reach a (placeholder) dashboard. Reload — still logged in.

# Phase 2 - Listing Tickets

**Goal:** list all tickets in table format

- Create public/tickets.html — semantic table or grid container, search/filter slots empty
- Add data-page="tickets-list" on <body>; wire init in main.js
- Implement src/api/tickets.js — listTickets, getTicket, createTicket, updateTicket, deleteTicket, listComments, addComment
- Implement src/utils/formatDate.js — formatDate, formatDateTime, formatRelative (use Intl)
- Implement src/modules/tickets.js — initTicketsList, refresh, renderTable
- Add a one-time fetch of /users at boot (cache it) — needed to show assignee names not IDs
- Render columns: ID, Title, Customer, Priority, Status, Assignee, Created
- Add a loading spinner/text visible while fetching
- Add error state with a retry button (handle case where json-server is offline)
- Add empty state ("No tickets found")
- Auth-protect the page — redirect to login if no token
- Style the table — readable, alternating rows, hover state

**Done when:** you can see all tickets

# Phase 3 - Search · Filter · Sort · Paginate

**Goal:** add above filters, search facility and pagination on ticket table

- Implement src/utils/debounce.js — same shape as Day 27
- Define a single state object in tickets.js holding all filter values + page
- Add search input — wire with debounce(refresh, 300)
- Add status dropdown — "All" + open / in-progress / resolved / closed
- Add priority dropdown — "All" + low / medium / high / urgent
- Add assignee dropdown — populate from cached users list
- Add sort dropdown — Newest / Priority / Status
- Build a buildQueryString(state) helper — skip empty values
- Add pagination UI — Prev / page numbers (1, 2, 3 ...) / Next; 10 per page
- Read X-Total-Count from response headers to compute total pages
- Reset page to 1 whenever any filter or search changes
- Disable Prev on page 1; disable Next on last page
- Stretch: reflect filters in URL via history.replaceState; read on init

**Done when:** you can utilise all filters, paginations is allowed, and search is supported


# Phase 4 - CRUD Operations

**Goal:** user should be able to perform all CRUD operations

 -   Create public/ticket-detail.html — ticket info shell + comments shell + action buttons
 -   Implement src/modules/ticketDetail.js — initTicketDetail
 -   Read ?id=N via new URLSearchParams(location.search)
 -   Load ticket + comments + users in parallel with Promise.all
 -   Render all ticket fields with proper formatting
 -   Implement src/modules/ui.js — toast (auto-dismiss 3s), basic modal (Esc + click-outside to close), confirmDialog
 -   Status dropdown that PATCHes on change — show toast on success
 -   Priority dropdown that PATCHes on change
 -   Assignee dropdown that PATCHes on change
 -   Build "New Ticket" button on tickets list — opens modal
 -   Implement src/modules/form.js — validators (required, minLength, maxLength, email, oneOf) + validateField + validateForm
 -   Wire validation on the create form: blur shows inline error, submit re-validates all, submit disabled when invalid
 -   On successful POST: close modal → refresh list → success toast
 -   Delete button on detail page → confirmDialog → DELETE → redirect to list

**Done when:** all operations are verified on seed data

# Phase 5 - Comment Section

- Add comments thread on detail page — list existing (sorted by createdAt asc), textarea + button to add new
- On comment submit — POST → re-fetch comments → render → clear textarea
- Build public/dashboard.html — 4 stat cards: Total / Open / In-Progress / Resolved
- Stats cards use the count from X-Total-Count for each filtered query (4 small fetches in parallel)
- Add "Recent 5 tickets" section on dashboard with link to detail pages
- Polish ui.js — toast queue (multiple stack), simple modal animation, full-screen loader for slow ops
- Add empty states wherever required
- Polish CSS — consistent spacing scale, decent typography, responsive at 768px+, hover/focus states
- Stretch goal: light & dark mode


**Done when:** able to write comment to ticket, edit. dashbaord has 4 statistics cards and facility of light & dark mode