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
  "nour@homey.com": "+20156720323",
  "naima@homey.com": "+20156720323",
  "nadaelhwary7@gmail.com": "+201020914828",
  "nada@homey.com": "+201020912848",

  "marwa.said@lena.ai": "+201036364340",
  "fatma.said@lena.ai": "+201036364340",

  "ghada.hossam@lena.ai": "+201515491686",
  "hanan.ahmed@homey.com": "+201515491686",

  "safaa.said@lena.ai": "+201556720323",
  "hager.nassar@lena.ai": "+201556720323",
  "bassant.mahmoud@lena.ai": "+201556720323",

  "shahd.mohamed@lena.ai": "+201556720323",
  "aya.alaa@lena.ai": "+201556720323",
  "rasha.ossama@homey.com": "+201556720323",
  "roulla.talaat@homey.com": "+201556720323",
  "rana.bahaa@homey.com": "+201556720323",
  "aya.yahya@homey.com": "+201556720323",
};

/**
 * Look up a mock agent_number for the given user email.
 * @param {string|null|undefined} email
 * @returns {string} raw number or ""
 */
export function getMockWhatsappAgentNumberByEmail(email) {
  const key = String(email || "")
    .trim()
    .toLowerCase();
  if (!key) return "";
  const value = MOCK_WHATSAPP_AGENT_NUMBERS_BY_EMAIL[key];
  if (value == null) return "";
  return String(value).trim();
}
