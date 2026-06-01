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
