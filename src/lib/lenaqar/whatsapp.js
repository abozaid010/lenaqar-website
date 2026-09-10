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
  const ref = requirement?.id ? ` (مرجع: ${requirement.id})` : "";
  return `مرحبا لينا عقار — عندي وحدة مناسبة للطلب ده${ref}:`;
}

export function addUnitForRequirementHref(requirement) {
  return formatPhoneForWhatsApp(
    LENAQAR_CONTACT.whatsappE164,
    addUnitForRequirementMessage(requirement),
  );
}

export function buyerCtaMessage(unit) {
  const project = unit?.projectAr || unit?.project || "";
  const developer = unit?.developerAr || unit?.developer || "";
  const code = unit?.code || "";
  return `أهلاً، مهتم بالوحدة ${project} - ${developer} (${code}) من lenaqar.com`;
}

export function buyerCtaHref(unit) {
  return formatPhoneForWhatsApp(
    LENAQAR_CONTACT.whatsappE164,
    buyerCtaMessage(unit)
  );
}
