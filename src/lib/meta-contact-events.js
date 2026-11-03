const trackedEvents = new WeakSet();

/** Run a tracking callback once when native and React handlers share a click. */
export function trackOncePerEvent(event, callback) {
  const nativeEvent = event?.nativeEvent || event;
  if (
    !nativeEvent ||
    (typeof nativeEvent !== "object" && typeof nativeEvent !== "function") ||
    trackedEvents.has(nativeEvent)
  ) {
    return false;
  }

  trackedEvents.add(nativeEvent);
  callback();
  return true;
}
