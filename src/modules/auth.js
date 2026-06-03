import * as authApi from "../api/auth.js";

export function syncAuthViews() {
  const loginView = document.getElementById("view-login");
  const dashboardView = document.getElementById("view-dashboard");
  const welcome = document.getElementById("welcome-line");
  const authed = authApi.isAuthenticated();

  if (loginView) loginView.hidden = authed;
  if (dashboardView) dashboardView.hidden = !authed;

  if (authed) {
    const user = authApi.getCurrentUser();
    if (welcome && user) {
      welcome.textContent = `Signed in as ${user.name} (${user.email}).`;
    }
  }
}

// event listeners are caught here
export function initApp() {
  const form = document.getElementById("login-form");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const errorEl = document.getElementById("login-error");
  const submitBtn = document.getElementById("login-submit");
  const logoutBtn = document.getElementById("logout-btn");

  // show error method with text content of message
  function showError(msg) {
    if (!errorEl) return;
    errorEl.textContent = msg;
    errorEl.hidden = false;
  }

  // clear error method with text content removed
  function clearError() {
    if (!errorEl) return;
    errorEl.textContent = "";
    errorEl.hidden = true;
  }

  syncAuthViews();

  // event listerner on form when submit action is performed
  // check email, password, submit button action and before performing default action

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!emailInput || !passwordInput || !submitBtn) return;
    clearError();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    submitBtn.disabled = true;
    try {
      await authApi.login(email, password);
      syncAuthViews();
    } catch (err) {
      showError(err.code === "AUTH_FAILED" ? "Invalid email or password." : "Something went wrong. Try again.");
    } finally {
      submitBtn.disabled = false;
    }
  });

  // event listener on logout button when click action is performed
  logoutBtn?.addEventListener("click", () => {
    authApi.logout();
    clearError();
    syncAuthViews();
  });
}
