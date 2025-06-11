export default function formatDateForDisplay(isoString, showTime = true) {
  const date = new Date(isoString);

  if (isNaN(date.getTime())) {
    throw new Error('Invalid ISO date string');
  }

  const dateOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };

  const timeOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  };

  if (showTime) {
    return date.toLocaleString('en-US', { ...dateOptions, ...timeOptions });
  } else {
    return date.toLocaleDateString('en-US', dateOptions);
  }
}
