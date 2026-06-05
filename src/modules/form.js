export function required(msg) {
  const m = msg || "This field is required";
  return function (value) {
    const s = value == null ? "" : String(value).trim();
    return s === "" ? m : null;
  };
}

export function minLength(n, msg) {
  const m = msg || "Must be at least " + n + " characters";
  return function (value) {
    const s = value == null ? "" : String(value);
    return s.length < n ? m : null;
  };
}

export function maxLength(n, msg) {
  const m = msg || "Must be at most " + n + " characters";
  return function (value) {
    const s = value == null ? "" : String(value);
    return s.length > n ? m : null;
  };
}

export function email(msg) {
  const m = msg || "Enter a valid email address";
  return function (value) {
    const s = value == null ? "" : String(value).trim();
    if (s === "") return null;
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return null;
    return m;
  };
}

export function oneOf(list, msg) {
  const m = msg || "Invalid choice";
  return function (value) {
    for (let i = 0; i < list.length; i++) {
      if (list[i] === value) return null;
    }
    return m;
  };
}

export function validateField(_, value, rules) {
  for (let i = 0; i < rules.length; i++) {
    const err = rules[i](value);
    if (err) return err;
  }
  return null;
}

export function validateForm(schema, data) {
  const errors = {};
  let valid = true;
  const keys = Object.keys(schema);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const err = validateField(key, data[key], schema[key]);
    errors[key] = err;
    if (err) valid = false;
  }
  return { valid: valid, errors: errors };
}
