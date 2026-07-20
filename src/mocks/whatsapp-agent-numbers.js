/**
 * TEMPORARY mock: agent WhatsApp numbers until backend returns `user.agent_number`.
 *
 * Delete this file (and its import in whatsapp-account-restriction) once the API
 * ships `agent_number` on the logged-in user / CLIENT_INFO in production.
 *
 * Keys are lowercase emails (from CLIENT_INFO.email).
 * Values are the WhatsApp sender numbers that must match a linked client account
 * when the client has multiple linked WhatsApp accounts.
 *
 * @type {Record<string, string>}
 */
export const MOCK_WHATSAPP_AGENT_NUMBERS_BY_EMAIL = {
  "marwa.said@lena.ai": "+201036364340",
  "fatma.said@lena.ai": "+201556720323",
  "ghada.hossam@lena.ai": "+201036364340",
  "hanan.ahmed@homey.com": "+201515491686",
  "hager.nassar@lena.ai": "+201556720323",
  default: "+201556720323",
};

/**
 * Look up a mock agent_number for the given user email.
 * Falls back to `default` when the email is not listed (e.g. Homey users).
 * @param {string|null|undefined} email
 * @returns {string} raw number or ""
 */
export function getMockWhatsappAgentNumberByEmail(email) {
  const key = String(email || "")
    .trim()
    .toLowerCase();
  if (!key) return "";
  const value =
    MOCK_WHATSAPP_AGENT_NUMBERS_BY_EMAIL[key] ??
    MOCK_WHATSAPP_AGENT_NUMBERS_BY_EMAIL.default;
  if (value == null) return "";
  return String(value).trim();
}
