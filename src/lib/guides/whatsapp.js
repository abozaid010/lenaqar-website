import { formatPhoneForWhatsApp } from "@/utils/phone-utils";
import { LENAQAR_CONTACT } from "@/config/lenaqar-contact";

/**
 * Tracked WhatsApp link for a guide article lead code.
 * Message: «مرحبا لينا عقار، جاي من <LEAD_CODE>»
 */
export function guideLeadWhatsAppHref(leadCode) {
  const code = leadCode || "GUIDE";
  const message = `مرحبا لينا عقار، جاي من ${code}`;
  return formatPhoneForWhatsApp(LENAQAR_CONTACT.whatsappE164, message);
}

export const GUIDE_CTA_LINE =
  "ابعت طلبك على واتساب (المنطقة · الميزانية · المقدم · عدد الغرف · استلام إمتى) — مش هنتصل إلا لو طلبت.";
