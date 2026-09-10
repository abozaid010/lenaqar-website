const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

const SIGNUP_FIELDS = [
  "client_name",
  "full_name",
  "email",
  "password",
  "phone_number",
  "logo_url",
];

function trimString(value) {
  return String(value ?? "").trim();
}

/**
 * Public Lena Network signup payload.
 * Sends exactly the backend contract fields — never `client_id` or `is_active`.
 *
 * @param {Record<string, unknown>} input
 * @returns {{ ok: true, payload: Record<string, string> } | { ok: false, errors: Record<string, string> }}
 */
export function buildNetworkSignupPayload(input) {
  const raw = input && typeof input === "object" ? input : {};
  const clientName = trimString(raw.client_name);
  const fullName = trimString(raw.full_name);
  const email = trimString(raw.email).toLowerCase();
  const password = String(raw.password ?? "");
  const phoneNumber = trimString(raw.phone_number);
  const logoUrl = trimString(raw.logo_url);

  /** @type {Record<string, string>} */
  const errors = {};
  if (!clientName) errors.client_name = "clientNameRequired";
  if (!fullName) errors.full_name = "fullNameRequired";
  if (!email) errors.email = "emailRequired";
  else if (!EMAIL_RE.test(email)) errors.email = "emailInvalid";
  if (!password) errors.password = "passwordRequired";
  else if (password.length < MIN_PASSWORD_LENGTH) {
    errors.password = "passwordTooShort";
  }
  if (!phoneNumber) errors.phone_number = "phoneRequired";

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  /** @type {Record<string, string>} */
  const payload = {
    client_name: clientName,
    full_name: fullName,
    email,
    password,
    phone_number: phoneNumber,
    logo_url: logoUrl,
  };

  for (const key of Object.keys(payload)) {
    if (!SIGNUP_FIELDS.includes(key)) delete payload[key];
  }

  return { ok: true, payload };
}

export { SIGNUP_FIELDS, MIN_PASSWORD_LENGTH };
