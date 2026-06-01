/**
 * utility/storage.js — localStorage wrapper (Capstone uses utility/, not utils/)
 *
 * Day 28 — DAILY_TASKS.md (Deskhub/deskhub-starter/deskhub-starter/DAILY_TASKS.md):
 *   [ ] get(name)    — read key with a fixed prefix (e.g. deskhub:); JSON.parse; return null if missing
 *   [ ] set(name, value) — JSON.stringify (unless already a string); setItem
 *   [ ] remove(name)
 *   [ ] clear()      — remove only keys that use your prefix (do not clear all of localStorage)
 *
 * Done when: token + user survive a reload after login (see checklist "Done when").
 *
 * Pitfalls:
 *   - localStorage values are strings — parse on get, stringify on set
 *   - Never store the password here; only token + safe user fields
 */

// const PREFIX = "deskhub:";

// function key(name) {
//   return `${PREFIX}${name}`;
// }

// export function get(name) {
//   // TODO Day 28
// }

// export function set(name, value) {
//   // TODO Day 28
// }

// export function remove(name) {
//   // TODO Day 28
// }

// export function clear() {
//   // TODO Day 28
// }
