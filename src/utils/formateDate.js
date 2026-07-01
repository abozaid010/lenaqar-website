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
  const date = ts instanceof Date ? ts : new Date(ts);
  if (Number.isNaN(date.getTime())) return "";
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
/**
 * Schedule row datetime: "Tuesday, 20 Nov, 2:00 pm" (EN) / localized AR equivalent.
 */
export function formatScheduleRowDateTime(value, locale = "en") {
  if (!value) return "";

  let dateObj;
  try {
    dateObj = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(dateObj.getTime())) return "";
  } catch {
    return "";
  }

  const loc = locale === "ar" ? "ar-EG" : "en-GB";
  const weekday = dateObj.toLocaleDateString(loc, { weekday: "long" });
  const month = dateObj.toLocaleDateString(loc, { month: "short" });
  const day = localizeDigits(dateObj.getDate(), locale);

  let hours = dateObj.getHours();
  const minutesRaw = String(dateObj.getMinutes()).padStart(2, "0");
  const ampm =
    hours >= 12
      ? locale === "ar"
        ? "م"
        : "pm"
      : locale === "ar"
        ? "ص"
        : "am";
  hours = hours % 12;
  hours = hours ? hours : 12;
  const hoursDisplay = localizeDigits(hours, locale);
  const minutesDisplay = localizeDigits(minutesRaw, locale);
  const separator = locale === "ar" ? "،" : ",";

  return `${weekday}${separator} ${day} ${month}${separator} ${hoursDisplay}:${minutesDisplay} ${ampm}`;
}

/**
 * Week range day label: "Saturday 20 June" (EN) / localized AR equivalent.
 */
export function formatScheduleWeekDayDate(value, locale = "en") {
  if (!value) return "";

  let dateObj;
  try {
    dateObj = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(dateObj.getTime())) return "";
  } catch {
    return "";
  }

  const loc = locale === "ar" ? "ar-EG" : "en-GB";
  const weekday = dateObj.toLocaleDateString(loc, { weekday: "long" });
  const month = dateObj.toLocaleDateString(loc, { month: "long" });
  const day = localizeDigits(dateObj.getDate(), locale);

  return `${weekday} ${day} ${month}`;
}

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
