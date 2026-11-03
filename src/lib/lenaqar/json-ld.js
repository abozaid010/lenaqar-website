/** Escape HTML script delimiters while retaining valid JSON data. */
export function serializeJsonLd(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}
