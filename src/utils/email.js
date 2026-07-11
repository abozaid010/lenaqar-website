/**
 * Lightweight email format check for filter inputs.
 * Empty string is treated as valid (cleared filter).
 * @param {string | null | undefined} value
 * @returns {boolean}
 */
export function isValidEmail(value) {
  if (value == null) return true;
  const trimmed = String(value).trim();
  if (!trimmed) return true;
  // Practical RFC-inspired check — rejects spaces and require user@domain.tld
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}
