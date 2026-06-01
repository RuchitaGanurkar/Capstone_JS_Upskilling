/**
 * api/client.js — single place for HTTP (fetch) to json-server
 *
 * Day 28 — DAILY_TASKS.md:
 *   [ ] request(path, options) — prepend base URL http://localhost:3001; set JSON headers/body as needed
 *   [ ] On non-2xx: throw (fetch does NOT throw on 4xx/5xx — check response.ok)
 *   [ ] Parse JSON body; handle empty body if you need to
 *   [ ] Export shorthands: get, post, patch, del (and put if you want parity with Deskhub guide)
 *
 * Stretch (from Deskhub starter comments): read auth token from storage and attach Authorization if present.
 *
 * Pitfalls: network failures throw TypeError — you can catch and rethrow with a clearer message.
 */

// const API_BASE = "http://localhost:3001";

// export async function request(path, options = {}) {
//   // TODO Day 28
// }

// export const get = (path) => request(path, { method: "GET" });
// export const post = (path, body) =>
//   request(path, { method: "POST", body: JSON.stringify(body) });
// export const patch = (path, body) =>
//   request(path, { method: "PATCH", body: JSON.stringify(body) });
// export const del = (path) => request(path, { method: "DELETE" });
