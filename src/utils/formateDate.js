export function formatDateForDisplay(isoString, showTime = true) {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) throw new Error("Invalid ISO date string");

  const options = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC", // Force UTC
  };

  return showTime
    ? date.toLocaleString("en-US", options)
    : date.toLocaleDateString("en-US", {
        ...options,
        hour: undefined,
        minute: undefined,
      });
}

export function formatTimestamp(ts) {
  if (!ts) return "";
  const date = typeof ts === "string" ? new Date(ts) : ts;
  const options = { year: "numeric", month: "long", day: "numeric" };
  const datePart = date.toLocaleDateString(undefined, options);
  const timePart = date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return `${datePart} - ${timePart}`;
}

/**
 * Matches the Conversations (dashboard) timestamp format:
 * e.g. "Jan 19, 1:35 PM" (EN) or "١٩ يناير، ١:٣٥ م" (AR)
 *
 * Returns "" if the value is missing/invalid.
 */
export function formatDateTimeAmPmShort(value, locale = "en") {
  if (!value) return "";

  let dateObj;
  try {
    dateObj = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(dateObj.getTime())) return "";
  } catch {
    return "";
  }

  const monthNames = {
    en: [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ],
    ar: [
      "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
      "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
    ]
  };

  const month = monthNames[locale]?.[dateObj.getMonth()] || monthNames.en[dateObj.getMonth()];
  const day = localizeDigits(dateObj.getDate(), locale);

  let hours = dateObj.getHours();
  const minutesRaw = String(dateObj.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? (locale === "ar" ? "م" : "PM") : (locale === "ar" ? "ص" : "AM");
  hours = hours % 12;
  hours = hours ? hours : 12;
  const hoursDisplay = localizeDigits(hours, locale);
  const minutesDisplay = localizeDigits(minutesRaw, locale);

  return `${month} ${day}, ${hoursDisplay}:${minutesDisplay} ${ampm}`;
}

/**
 * Convert latin digits to locale-appropriate digits (ar -> Arabic-Indic).
 * Keeps non-digit characters untouched so colons / separators stay intact.
 */
function localizeDigits(value, locale = "en") {
  const s = String(value);
  if (locale !== "ar") return s;
  const arabicIndic = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return s.replace(/\d/g, (d) => arabicIndic[Number(d)]);
}

/**
 * Short "day month" format with no year or time, localized.
 * EN: "15 May" · AR: "15 مايو"
 * Returns "" if the value is missing/invalid.
 */
export function formatDayMonthShort(value, locale = "en") {
  if (!value) return "";

  let dateObj;
  try {
    dateObj = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(dateObj.getTime())) return "";
  } catch {
    return "";
  }

  const monthNames = {
    en: [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ],
    ar: [
      "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
      "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
    ],
  };

  const months = monthNames[locale] ?? monthNames.en;
  const day = localizeDigits(dateObj.getDate(), locale);
  return `${day} ${months[dateObj.getMonth()]}`;
}
