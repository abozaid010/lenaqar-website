/** Single place for every LenAqar contact detail. Replace here, nowhere else. */
/** Buyer WhatsApp + calls — always 01002891933. */
const BUYER_E164 = "+201002891933";
/** Lena Network signup / activation only — do not reuse for other WhatsApp CTAs. */
const NETWORK_SIGNUP_WHATSAPP_E164 = "+201016080323";

export const LENAQAR_CONTACT = {
  // E.164 is required — formatPhoneForWhatsApp() strips non-digits, so a local
  // "01002891933" would build wa.me/01002891933 and fail.
  phoneE164: BUYER_E164,
  phoneDisplay: BUYER_E164,
  // WhatsApp for every buyer/seller wa.me CTA on the site (except network signup).
  whatsappE164: BUYER_E164,
  whatsappDisplay: BUYER_E164,
  // Scoped to Lena Network signup confirmation + activation only.
  networkActivationWhatsappE164: NETWORK_SIGNUP_WHATSAPP_E164,
  networkActivationWhatsappDisplay: NETWORK_SIGNUP_WHATSAPP_E164,
  // Not live yet — held behind SITE.showEmail, kept here for the flip.
  email: "info@lenaqar.com",
  address: "505 ARCHPLAN Square، العاصمة الإدارية",
  city: "القاهرة",
  country: "EG",
  facebook: "https://www.facebook.com/lenaqar.eg",
  instagram: "https://www.instagram.com/lenaqar.eg/",
  tiktok: "https://www.tiktok.com/@lenaqar.eg",
  linkedin: "https://www.linkedin.com/company/142683910/",
};
