const CAIRO_TZ = "Africa/Cairo";

function formatCairoDate(date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: CAIRO_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Today in Africa/Cairo as YYYY-MM-DD */
export function cairoDateToday() {
  return formatCairoDate(new Date());
}

/** Cairo date N days before today (inclusive of today when days=0) */
export function cairoDateDaysAgo(days) {
  const now = new Date();
  const target = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return formatCairoDate(target);
}

/** Subtract calendar days from a YYYY-MM-DD string */
export function cairoDateSubtract(dateStr, days) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() - days);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
