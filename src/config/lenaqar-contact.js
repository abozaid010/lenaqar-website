/** Single place for every LenAqar contact detail. Replace here, nowhere else. */
export const LENAQAR_CONTACT = {
  // E.164 is required — formatPhoneForWhatsApp() strips non-digits, so a local
  // "01036464346" would build wa.me/01036464346 and fail.
  phoneE164: "+201036464346",
  phoneDisplay: "010 3646 4346",
  whatsappE164: "+201036464346",
  // Not live yet — held behind SITE.showEmail, kept here for the flip.
  email: "info@lenaqar.com",
  // Inherited from LenaAI until LenAqar has its own
  address: "505 Siac Building, ARCHPLAN Square, New Capital",
  city: "Cairo",
  country: "EG",
  facebook: "https://www.facebook.com/profile.php?id=61587419182034",
  linkedin: "https://www.linkedin.com/company/lenaai-net/",
};
