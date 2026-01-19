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
 * e.g. "Jan 19, 1:35 PM"
 *
 * Returns "" if the value is missing/invalid.
 */
export function formatDateTimeAmPmShort(value) {
  if (!value) return "";

  let dateObj;
  try {
    dateObj = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(dateObj.getTime())) return "";
  } catch {
    return "";
  }

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const month = monthNames[dateObj.getMonth()];
  const day = dateObj.getDate();

  let hours = dateObj.getHours();
  const minutes = String(dateObj.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;

  return `${month} ${day}, ${hours}:${minutes} ${ampm}`;
}
