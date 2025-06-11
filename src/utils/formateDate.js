export default function formatDateForDisplay(isoString, showTime = true) {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) throw new Error('Invalid ISO date string');

  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'UTC', // Force UTC
  };

  return showTime
    ? date.toLocaleString('en-US', options)
    : date.toLocaleDateString('en-US', { ...options, hour: undefined, minute: undefined });
}
