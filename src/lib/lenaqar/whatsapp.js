import { formatPhoneForWhatsApp } from "@/utils/phone-utils";
import { LENAQAR_CONTACT } from "@/config/lenaqar-contact";

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
  const code = String(unit?.code || "UNIT").trim().toUpperCase() || "UNIT";
  // PAGE-CODE format (content-rules / contact-rules): route slug in caps.
  return `مرحبا لينا عقار، جاي من موقع لينا عقار — OPP-${code}`;
}

export function buyerCtaHref(unit) {
  return formatPhoneForWhatsApp(
    LENAQAR_CONTACT.whatsappE164,
    buyerCtaMessage(unit)
  );
}
