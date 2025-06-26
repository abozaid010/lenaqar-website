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
