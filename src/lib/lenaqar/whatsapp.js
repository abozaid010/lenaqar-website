import { formatPhoneForWhatsApp } from "@/utils/phone-utils";
import { LENAQAR_CONTACT } from "@/config/lenaqar-contact";
import { placeAr, buildingTypeAr } from "@/lib/lenaqar/listing-seo";
import { formatEgpNumber } from "@/lib/lenaqar/metrics";

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

function requirementSummaryLine(requirement) {
  if (!requirement || typeof requirement !== "object") return "";
  const loc = requirement.locations?.[0] || {};
  const place = [
    placeAr(loc.project) || loc.project,
    placeAr(loc.subDistrict) || loc.subDistrict,
    placeAr(loc.district),
  ]
    .filter(Boolean)
    .join("، ");
  const type =
    buildingTypeAr(requirement.propertyTypes?.[0]) ||
    requirement.propertyTypes?.[0] ||
    "";
  const rooms =
    requirement.roomsCount > 0 ? `${requirement.roomsCount} غرف` : "";
  const budget = formatEgpNumber(requirement.maxPrice || requirement.minPrice);
  const budgetLabel = budget ? `ميزانية حتى ${budget} ج.م` : "";
  const intent = requirement.intent === "buy" ? "شراء" : "";
  const notes = String(requirement.notes || "").trim();
  const notesLine = notes
    ? `ملاحظات: ${notes.replace(/\s+/g, " ").slice(0, 160)}`
    : "";
  return [intent, type, place, rooms, budgetLabel, notesLine]
    .filter(Boolean)
    .join(" · ");
}

/**
 * Prefill WhatsApp so an owner can offer a unit against an anonymous demand card.
 * Never includes names, phones, or CRM ids — only public criteria + anonymous ref.
 */
export function addUnitForRequirementMessage(requirement) {
  const summary = requirementSummaryLine(requirement);
  const ref = requirement?.id ? ` (مرجع: ${requirement.id})` : "";
  if (summary) {
    return `مرحبا لينا عقار — عندي وحدة مناسبة للطلب ده${ref}:\n${summary}\nهبعت التفاصيل لوكيل واتساب الذكي عشان يضيفها.`;
  }
  return MARKETPLACE_SELLER_MESSAGE;
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
