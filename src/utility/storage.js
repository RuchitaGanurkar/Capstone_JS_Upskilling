const PREFIX = "deskhub:"; // setting up prefix deskhub here

function key(k) {
  return `${PREFIX}${k}`;
}

// get method to catch key name
export function get(name) {
  const raw = localStorage.getItem(key(name));
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

// set method to set key name and values
export function set(name, value) {
  const payload = typeof value === "string" ? value : JSON.stringify(value);
  localStorage.setItem(key(name), payload);
}

// remove method to clear name key
export function remove(name) {
  localStorage.removeItem(key(name));
}

// clear method to remove key name from localstorage
export function clear() {
  const toRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(PREFIX)) toRemove.push(k);
  }
  toRemove.forEach((k) => localStorage.removeItem(k));
}