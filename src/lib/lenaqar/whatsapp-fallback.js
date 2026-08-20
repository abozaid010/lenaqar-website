import { formatPhoneForWhatsApp } from "@/utils/phone-utils";
import { LENAQAR_CONTACT } from "@/config/lenaqar-contact";

const FALLBACK_DELAY_MS = 3000;

function pushLine(lines, label, value) {
  const text = value == null ? "" : String(value).trim();
  if (!text) return;
  lines.push(`${label}: ${text}`);
}

/**
 * Prefilled WhatsApp body when public buy-request save fails.
 * @param {{ form: Record<string, unknown>, contact?: { name?: string, phone?: string }, labels: Record<string, string>, intro: string }} args
 */
export function composeBuyRequestWhatsAppMessage({
  form = {},
  contact = {},
  labels = {},
  intro,
}) {
  const lines = [intro, ""];
  pushLine(lines, labels.name, contact.name);
  pushLine(lines, labels.phone, contact.phone);
  pushLine(lines, labels.city, form.city);
  pushLine(lines, labels.district, form.district);
  pushLine(lines, labels.subDistrict, form.sub_district);
  pushLine(lines, labels.project, form.project);
  pushLine(lines, labels.buildingType, form.buildingType);
  pushLine(lines, labels.roomsCount, form.roomsCount);
  pushLine(lines, labels.maxPrice, form.max_price);
  pushLine(lines, labels.downPayment, form.downPayment);
  pushLine(lines, labels.monthlyInstallment, form.monthlyInstallment);
  pushLine(lines, labels.overPrice, form.overPrice);
  pushLine(lines, labels.deliveryDate, form.deliveryDate);
  lines.push("", "من lenaqar.com");
  return lines.join("\n");
}

/**
 * Prefilled WhatsApp body when public sell / add-unit save fails.
 * @param {{ form: Record<string, unknown>, phone?: string, labels: Record<string, string>, intro: string }} args
 */
export function composeSellRequestWhatsAppMessage({
  form = {},
  phone,
  labels = {},
  intro,
}) {
  const lines = [intro, ""];
  pushLine(lines, labels.name, form.ownerName);
  pushLine(lines, labels.phone, phone);
  pushLine(lines, labels.city, form.city);
  pushLine(lines, labels.district, form.district);
  pushLine(lines, labels.subDistrict, form.subDistrict);
  pushLine(lines, labels.project, form.project);
  pushLine(lines, labels.developer, form.developer);
  pushLine(lines, labels.buildingType, form.buildingType);
  pushLine(lines, labels.landArea, form.landArea);
  pushLine(lines, labels.contractPrice, form.totalPrice);
  pushLine(lines, labels.paidAmount, form.paidAmount);
  lines.push("", "من lenaqar.com");
  return lines.join("\n");
}

export function whatsappFallbackHref(message) {
  return formatPhoneForWhatsApp(LENAQAR_CONTACT.whatsappE164, message);
}

export function getWhatsAppFallbackDelayMs() {
  return FALLBACK_DELAY_MS;
}
