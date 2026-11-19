import { formatPhoneForWhatsApp } from "@/utils/phone-utils";
import { LENAQAR_CONTACT } from "@/config/lenaqar-contact";
import {
  buyerPageCtaMessage,
  matchRequestMessage,
  unitInquiryMessage,
  withMatchRef,
} from "./whatsapp-intent.js";

export {
  buyerPageCtaMessage,
  matchRequestMessage,
  normalizeMatchRef,
} from "./whatsapp-intent.js";

const SELLER_MESSAGE = "عندى وحده عايز ابيعها من غير اوفر";

const MARKETPLACE_SELLER_MESSAGE =
  "مرحبا لينا عقار — عندي وحدة وأحب أضيفها عن طريق وكيل واتساب الذكي. ابعتولي الخطوات.";

export function sellerCtaHref() {
  return formatPhoneForWhatsApp(LENAQAR_CONTACT.whatsappE164, SELLER_MESSAGE);
}

export function sellerCtaMessage() {
  return SELLER_MESSAGE;
}

/** Homepage / marketplace default — AI agent add-unit flow. */
export function marketplaceAddUnitHref() {
  return formatPhoneForWhatsApp(
    LENAQAR_CONTACT.whatsappE164,
    MARKETPLACE_SELLER_MESSAGE,
  );
}

export function marketplaceAddUnitMessage() {
  return MARKETPLACE_SELLER_MESSAGE;
}

/**
 * Prefill WhatsApp so an owner can offer a unit against an anonymous demand card.
 * Keep it short: welcome + anonymous ref only — the owner fills in their details.
 */
export function addUnitForRequirementMessage(requirement) {
  const ref = requirement?.id
    ? String(requirement.id).trim().toUpperCase()
    : "HOME";
  return `مرحبا لينا عقار، جاي من موقع لينا عقار — REQ-${ref}`;
}

export function addUnitForRequirementHref(requirement) {
  return formatPhoneForWhatsApp(
    LENAQAR_CONTACT.whatsappE164,
    addUnitForRequirementMessage(requirement),
  );
}

export function buyerCtaMessage(unit) {
  // Short question + the unit's page code (OPP-<code>), which the agent reads.
  return unitInquiryMessage(unit);
}

export function buyerCtaHref(unit) {
  return formatPhoneForWhatsApp(
    LENAQAR_CONTACT.whatsappE164,
    buyerCtaMessage(unit)
  );
}

export function buyerPageCtaHref(pathname = "/") {
  return formatPhoneForWhatsApp(
    LENAQAR_CONTACT.whatsappE164,
    buyerPageCtaMessage(pathname),
  );
}

/**
 * A unit card on the match page: the unit page's own opener plus the request
 * reference. The backend (`asks_about_a_unit`, LENAAI-Agent
 * `src/utils/match_request.py`) ties the sender to that request and lets the
 * agent answer about this unit. Without a clean reference it is the plain unit opener.
 */
export function matchUnitMessage(unit, matchRef) {
  return withMatchRef(buyerCtaMessage(unit), matchRef);
}

export function matchUnitHref(unit, matchRef) {
  return formatPhoneForWhatsApp(
    LENAQAR_CONTACT.whatsappE164,
    matchUnitMessage(unit, matchRef),
  );
}

/** Success screen of the buy request: "show me the units that match my request". */
export function matchRequestHref(matchRef) {
  return formatPhoneForWhatsApp(
    LENAQAR_CONTACT.whatsappE164,
    matchRequestMessage(matchRef),
  );
}
