const dateFmt = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const dateTimeFmt = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const rtf = new Intl.RelativeTimeFormat("en-GB", { numeric: "auto" });

function parseIso(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDate(iso) {
  const d = parseIso(iso);
  if (!d) return "—";
  return dateFmt.format(d);
}

export function formatDateTime(iso) {
  const d = parseIso(iso);
  if (!d) return "—";
  return dateTimeFmt.format(d);
}

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function formatRelative(iso) {
  const d = parseIso(iso);
  if (!d) return "—";
  const diffDays = Math.round((startOfDay(d) - startOfDay(new Date())) / 86400000);
  if (diffDays === 0) return rtf.format(0, "day");
  if (Math.abs(diffDays) < 7) return rtf.format(diffDays, "day");
  const weeks = Math.round(diffDays / 7);
  if (Math.abs(weeks) < 5) return rtf.format(weeks, "week");
  const months = Math.round(diffDays / 30);
  return rtf.format(months, "month");
}
