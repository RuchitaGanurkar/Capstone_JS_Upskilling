const API_BASE = "http://localhost:3001"; // mock API json-live server

// request method captures URL, headers content
// parse JSON received else throws error
export async function request(path, options = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  if (!res.ok) {
    const err = new Error(res.statusText || "Request failed");
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}


// short-hand all requests
export const get = (path) => request(path, { method: "GET" });
export const post = (path, body) =>
  request(path, { method: "POST", body: JSON.stringify(body) });
export const patch = (path, body) =>
  request(path, { method: "PATCH", body: JSON.stringify(body) });
export const del = (path) => request(path, { method: "DELETE" });