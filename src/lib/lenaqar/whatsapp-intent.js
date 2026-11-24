import { isPublicRequirementId, requirementShareUrl } from "./requirement-public.js";

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

/**
 * Append the request reference to another opener, as its own trailing page
 * code. Used by a unit card on the match page: the backend reads the unit code
 * the opener already carries and ties the sender to the request
 * (`asks_about_a_unit`, LENAAI-Agent `src/utils/match_request.py`).
 */
export function withMatchRef(message, matchRef) {
  const ref = normalizeMatchRef(matchRef);
  return ref ? `${message} — MATCH-${ref}` : message;
}

const UNIT_NOUN_BY_TYPE = { apartment: "الشقة", villa: "الفيلا" };

/**
 * The opener a buyer sends from one unit's page or card: a short question about that
 * unit, then its page code. The backend finds the unit from the trailing `— OPP-<code>`
 * (`asks_about_a_unit`), so that code must stay a standalone code after a dash.
 * The unit is "the apartment" / "the villa" when the type says so, else "the unit".
 */
export function unitInquiryMessage(unit) {
  const code = String(unit?.code || "UNIT").trim().toUpperCase() || "UNIT";
  const reference = code.startsWith("OPP-") ? code : `OPP-${code}`;
  const type = String(unit?.buildingType || "").trim().toLowerCase();
  const noun = UNIT_NOUN_BY_TYPE[type] || "الوحدة";
  return `مرحبا\nعايز اعرف تفاصيل اكتر عن ${noun} دى؟ — ${reference}`;
}

const DEMAND_OFFER_SENTENCE = "عندى شقة للبيع مناسبة لطلب العميل ده";

/**
 * The opener an owner sends from a buyer-request card ("I have a unit for this request").
 * The backend reads the trailing `— REQ-<id>` first, then the request link
 * (`detect_demand_offer_ref`, LENAAI-Agent `src/utils/demand_offer.py`), saves the lead
 * as a seller and asks for the unit's details. The link lets the owner reopen the request.
 * Without a valid public id the sentence goes alone: no code, no link.
 */
export function demandOfferMessage(requirementId, siteUrl) {
  const id = typeof requirementId === "string" ? requirementId.trim().toLowerCase() : "";
  if (!isPublicRequirementId(id)) return DEMAND_OFFER_SENTENCE;
  return `${DEMAND_OFFER_SENTENCE} — REQ-${id.toUpperCase()}\n${requirementShareUrl(id, siteUrl)}`;
}
