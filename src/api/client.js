const API_BASE = "http://localhost:3001";
const DEFAULT_TIMEOUT_MS = 15_000;

function mergeSignal(callerSignal) {
  const timeoutSignal =
    typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function"
      ? AbortSignal.timeout(DEFAULT_TIMEOUT_MS)
      : undefined;
  if (callerSignal && timeoutSignal) {
    return typeof AbortSignal !== "undefined" && typeof AbortSignal.any === "function"
      ? AbortSignal.any([callerSignal, timeoutSignal])
      : timeoutSignal;
  }
  return callerSignal ?? timeoutSignal;
}

export async function request(path, options = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const { signal: callerSignal, ...rest } = options;
  const signal = mergeSignal(callerSignal);
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...rest.headers },
    ...rest,
    signal,
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

export async function getJsonWithTotalCount(path) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const signal = mergeSignal(undefined);
  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    signal,
  });
  const totalRaw = res.headers.get("x-total-count");
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
  let totalCount = totalRaw != null && totalRaw !== "" ? Number(totalRaw) : NaN;
  if (!Number.isFinite(totalCount) || totalCount < 0) totalCount = null;
  const list = Array.isArray(data) ? data : [];
  return { data: list, totalCount };
}

export const get = (path) => request(path, { method: "GET" });
export const post = (path, body) =>
  request(path, { method: "POST", body: JSON.stringify(body) });
export const patch = (path, body) =>
  request(path, { method: "PATCH", body: JSON.stringify(body) });
export const del = (path) => request(path, { method: "DELETE" });
