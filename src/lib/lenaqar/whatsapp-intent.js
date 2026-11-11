/** Buyer-oriented footer prefill with a stable route reference and no user data. */
export function buyerPageCtaMessage(pathname = "/") {
  const parts = String(pathname || "/").split("/").filter(Boolean);
  let reference;
  if (parts[0]?.toLowerCase() === "opportunities" && parts[1]) {
    let code = parts[1];
    try {
      code = decodeURIComponent(code);
    } catch {
      // Keep the original route token if it is malformed.
    }
    const normalized = code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
    reference = normalized.startsWith("OPP-") ? normalized : `OPP-${normalized}`;
  } else {
    const route = (parts[0] || "HOME").toUpperCase().replace(/[^A-Z0-9_-]/g, "");
    reference = `PAGE-${route || "HOME"}`;
  }
  return `مرحبا لينا عقار، مهتم أعرف فرص الشراء — ${reference}`;
}

/**
 * Post-submit opener: the buyer asks for the units that match the request they
 * just sent. The backend recognises this text (`detect_match_request`,
 * LENAAI-Agent `src/utils/match_request.py`) and replies with their match link.
 *
 * `matchRef` is the random reference the backend returned for this request. It
 * is what ties the WhatsApp sender to the request: WhatsApp often delivers a
 * contact without a phone number, and a buyer may write from another number
 * than the one typed in the form. Without it the backend falls back to the
 * sender's own number.
 */
export function matchRequestMessage(matchRef) {
  const ref = normalizeMatchRef(matchRef);
  const base = "مرحبا لينا عقار، عايز أشوف الوحدات المناسبة لطلبي — MATCH";
  return ref ? `${base}-${ref}` : base;
}

// Same alphabet and length as the backend (`MATCH_REF_ALPHABET`): no 0/O, no 1/I.
const MATCH_REF = /^[2-9A-HJ-NP-Z]{8}$/;

/**
 * The request reference the backend returned on submit, or "" when it is not a
 * well-formed one. Only a clean code is ever put into the WhatsApp message.
 */
export function normalizeMatchRef(value) {
  const ref = typeof value === "string" ? value.trim().toUpperCase() : "";
  return MATCH_REF.test(ref) ? ref : "";
}
