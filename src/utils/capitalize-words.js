/**
 * Helper function to capitalize first letter of each word
 * @param {string} str - The string to capitalize
 * @returns {string} - The capitalized string
 */
export function capitalizeWords(str) {
  if (!str) return str;
  return str
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}
