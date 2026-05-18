export const WHATSAPP_NUMBER = "201016080323";
export const WHATSAPP_DISPLAY = "01016080323";

export const APP_STORE_IOS =
  "https://apps.apple.com/eg/app/lenaai-dashboard/id6745050088";
export const APP_STORE_ANDROID =
  "https://play.google.com/store/apps/details?id=net.lenaai.LenaAIDashboardApp&pli=1";

export const FACEBOOK_URL =
  "https://www.facebook.com/profile.php?id=61587419182034";
export const LINKEDIN_URL = "https://www.linkedin.com/company/lenaai-net/";

export function getWhatsAppUrl(message?: string) {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}

export const SOLUTION_ROUTES = {
  brokers: "/for-brokers",
  developers: "/for-developers",
  agencies: "/for-marketing-agencies",
} as const;
