/** Single place for every LenAqar contact detail. Replace here, nowhere else. */
const PHONE_E164 = "+201036364340";
const WHATSAPP_E164 = "+491745661918";
/** Lena Network signup / activation only — do not reuse for other WhatsApp CTAs. */
const NETWORK_SIGNUP_WHATSAPP_E164 = "+201016080323";

export const LENAQAR_CONTACT = {
  // E.164 is required — formatPhoneForWhatsApp() strips non-digits, so a local
  // "01036364340" would build wa.me/01036364340 and fail.
  phoneE164: PHONE_E164,
  phoneDisplay: PHONE_E164,
  // WhatsApp (Germany) — used by every wa.me / WhatsApp CTA on the site.
  whatsappE164: WHATSAPP_E164,
  whatsappDisplay: WHATSAPP_E164,
  // Scoped to Lena Network signup confirmation + activation only.
  networkActivationWhatsappE164: NETWORK_SIGNUP_WHATSAPP_E164,
  networkActivationWhatsappDisplay: NETWORK_SIGNUP_WHATSAPP_E164,
  // Not live yet — held behind SITE.showEmail, kept here for the flip.
  email: "info@lenaqar.com",
  // Inherited from LenaAI until LenAqar has its own
  address: "505 ARCHPLAN Square، العاصمة الإدارية",
  city: "القاهرة",
  country: "EG",
  facebook: "https://www.facebook.com/profile.php?id=61587419182034",
  linkedin: "https://www.linkedin.com/company/lenaai-net/",
};
