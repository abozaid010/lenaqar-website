function toDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * WhatsApp-style time: "9:41 pm" (lowercase am/pm).
 */
export function formatChatMessageTime(value, locale = "en") {
  const date = toDate(value);
  if (!date) return "";

  const loc = locale === "ar" ? "ar-EG" : "en-US";
  const formatted = date.toLocaleTimeString(loc, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return locale === "ar" ? formatted : formatted.toLowerCase();
}

export function getChatDateKey(value) {
  const date = toDate(value);
  if (!date) return "";
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

/**
 * WhatsApp date pill label: Today / Yesterday / weekday / full date.
 */
export function formatChatDatePillLabel(value, locale = "en", translate) {
  const date = toDate(value);
  if (!date) return "";

  const today = startOfDay(new Date());
  const target = startOfDay(date);
  const diffDays = Math.round((today - target) / 86400000);

  if (diffDays === 0) {
    return translate?.("chatDate.today", "Today") ?? "Today";
  }
  if (diffDays === 1) {
    return translate?.("chatDate.yesterday", "Yesterday") ?? "Yesterday";
  }

  const loc = locale === "ar" ? "ar-EG" : "en-US";
  if (diffDays > 1 && diffDays < 7) {
    return date.toLocaleDateString(loc, { weekday: "long" });
  }

  return date.toLocaleDateString(loc, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function shouldShowChatDatePill(currentTs, previousTs) {
  if (!currentTs) return false;
  if (!previousTs) return true;
  return getChatDateKey(currentTs) !== getChatDateKey(previousTs);
}
