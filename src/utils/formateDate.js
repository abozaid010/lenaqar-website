export default function formatDateForDisplay(dateStr, noTime) {
  const options = {
    year: "numeric",
    month: "short",
    day: "numeric",
  };

  if (!noTime) {
    options.hour = "2-digit";
    options.minute = "2-digit";
    options.hour12 = true;
  }

  return new Date(dateStr).toLocaleString("en-US", options);
}
