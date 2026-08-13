import { formatPhoneForWhatsApp } from "@/utils/phone-utils";
import { LENAQAR_CONTACT } from "@/config/lenaqar-contact";

const SELLER_MESSAGE =
  "أهلاً، عايز أعرف خروجي من وحدتي — من حاسبة lenaqar.com";

export function sellerCtaHref() {
  return formatPhoneForWhatsApp(LENAQAR_CONTACT.whatsappE164, SELLER_MESSAGE);
}

export function sellerCtaMessage() {
  return SELLER_MESSAGE;
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
