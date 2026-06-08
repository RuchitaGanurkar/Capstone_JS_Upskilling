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
      welcome.textContent = "Signed in as " + user.name + " (" + user.email + ").";
    }
  }
}

export function initApp() {
  const form = document.getElementById("login-form");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const errorEl = document.getElementById("login-error");
  const submitBtn = document.getElementById("login-submit");
  const logoutBtn = document.getElementById("logout-btn");

  function showError(msg) {
    if (!errorEl) return;
    errorEl.textContent = msg;
    errorEl.hidden = false;
  }

  function clearError() {
    if (!errorEl) return;
    errorEl.textContent = "";
    errorEl.hidden = true;
  }

  syncAuthViews();

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

  logoutBtn?.addEventListener("click", () => {
    authApi.logout();
    clearError();
    syncAuthViews();
  });
}
