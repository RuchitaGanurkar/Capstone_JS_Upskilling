/**
 * modules/auth.js — wire public/index.html (single page)
 *
 * Your HTML already has two roots (Capstone convention vs separate dashboard.html):
 *   - #view-login       — form#login-form, #email, #password, #login-error, #login-submit
 *   - #view-dashboard   — #welcome-line, #logout-btn (toggle hidden on #view-login / #view-dashboard)
 *
 * Day 28 — DAILY_TASKS.md maps here as:
 *   [ ] initApp() (or split helpers if you prefer)
 *       - On load: if authenticated, show dashboard view; else show login view
 *       - On submit: preventDefault, read email/password, call api auth login, show #login-error on failure
 *       - On success: switch views (no second HTML file in this repo)
 *       - Logout: clear session via api auth, show login again
 *       - Optional: disable submit while awaiting login
 *
 * Deskhub starter TODOs referenced initLogin / initLogout / requireAuth — you can mirror that API inside this file
 * or keep one initApp(); your choice.
 *
 * Pitfalls: use textContent for error messages; wrong password should show inline error, not alert()
 */

// import * as authApi from "../api/auth.js";

// export function initApp() {
//   // TODO Day 28 — query #view-login, #view-dashboard, wire form + logout, sync visibility with isAuthenticated
// }
