import * as storage from "../utility/storage.js";
import { get } from "./client.js";

// mocking token and user key with constant
const TOKEN_KEY = "token";
const USER_KEY = "user";

// utilising date, random numbers to form user token
function makeToken() {
  return `dh_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

// login method which captures email, password
// it's array of users at path http://localhost:3001/users
// throws error if invalid email and password
// store details in localstorage along with user payload
export async function login(email, password) {
  const q = new URLSearchParams({ email, password });
  const users = await get(`/users?${q.toString()}`);
  if (!Array.isArray(users) || users.length !== 1) {
    const err = new Error("Invalid email or password");
    err.code = "AUTH_FAILED";
    throw err;
  }
  const user = users[0];
  const safe = { id: user.id, email: user.email, name: user.name, role: user.role };
  storage.set(TOKEN_KEY, makeToken());
  storage.set(USER_KEY, safe);
  return safe;
}

// logout method removes token from localstorage
export function logout() {
  storage.remove(TOKEN_KEY);
  storage.remove(USER_KEY);
}

// capture current user details 
export function getCurrentUser() {
  return storage.get(USER_KEY);
}

// check if user token is correct for logged in user or not
export function isAuthenticated() {
  return Boolean(storage.get(TOKEN_KEY));
}