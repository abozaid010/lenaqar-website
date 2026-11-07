// Analytics configuration (GA + Meta Pixel).
// These IDs are public (they ship in the client bundle), so they live here, not in env.

export const ANALYTICS = {
  MEASUREMENT_ID: 'G-3QC63HK3DQ', // GA4 property "lenaqar" (abozaid.ibrahim11 account), stream lenaqar.com
  GTM_SCRIPT_URL: 'https://www.googletagmanager.com/gtag/js?id=',

  // Event names for consistent tracking
  EVENTS: {
    CALCULATOR_USED: 'calculator_used',
    UNIT_VIEWED: 'unit_viewed',
    BUY_REQUEST_OPENED: 'buy_request_opened',
    BUY_REQUEST_SUBMITTED: 'buy_request_submitted',
    NETWORK_SIGNUP_SUBMITTED: 'network_signup_submitted',
    NETWORK_LOGIN_SUBMITTED: 'network_login_submitted',
    WHATSAPP_CLICK: 'whatsapp_click',
    SELL_REQUEST_OPENED: 'sell_request_opened',
    SELL_REQUEST_SUBMITTED: 'sell_request_submitted',
    FORM_FALLBACK_SHOWN: 'form_fallback_shown',
    CTA_CLICK: 'cta_click',
    OPPORTUNITY_FILTER_APPLIED: 'opportunity_filter_applied',
    PHONE_CLICK: 'phone_click',
    EMAIL_CLICK: 'email_click',
    SHARE: 'share',
    LANGUAGE_SWITCHED: 'language_switched',
    ONBOARDING_SKIPPED: 'onboarding_skipped',
  },
};

export const META_PIXEL = {
  // Lenaqar's own dataset. 846747935139647 is the LenaAI pixel and stays on lenaai.net;
  // sharing one dataset across both brands mixed the data. Owner decision 2026-11-08.
  PIXEL_ID: '1515794237037991',
  SCRIPT_URL: 'https://connect.facebook.net/en_US/fbevents.js',
  NOSCRIPT_BASE: 'https://www.facebook.com/tr',
  /**
   * Buyer-intent routes that fire ViewContent for Meta ads optimization.
   * Keep aligned with indexable landing pages in sitemap.ts.
   */
  VIEW_CONTENT_PATHS: [
    '/',
    '/how-it-works',
    '/opportunities',
    '/apartments-for-sale',
    '/chalets-for-sale',
    '/villas-for-sale',
    '/ready-to-move-properties',
    '/guides',
  ],
  EVENTS: {
    PAGE_VIEW: 'PageView',
    VIEW_CONTENT: 'ViewContent',
    CONTACT: 'Contact',
    LEAD: 'Lead',
    COMPLETE_REGISTRATION: 'CompleteRegistration',
  },
};

export const getMetaPixelId = () => META_PIXEL.PIXEL_ID;

export const isMetaPixelEnabled = () => Boolean(getMetaPixelId());

export const getMetaPixelNoscriptUrl = () => {
  const id = getMetaPixelId();
  if (!id) return null;
  return `${META_PIXEL.NOSCRIPT_BASE}?id=${id}&ev=PageView&noscript=1`;
};

// Helper function to get GA script URL
export const getGAScriptUrl = () => `${ANALYTICS.GTM_SCRIPT_URL}${ANALYTICS.MEASUREMENT_ID}`;

// Helper function to get GA config
export const getGAConfig = () => ANALYTICS.MEASUREMENT_ID;

export const FORM_IDS = {
  BUY_REQUEST: 'buy_request',
  SELL_REQUEST: 'sell_request',
  NETWORK_SIGNUP: 'network_signup',
};

/** form_id -> cta_intent used when that form's WhatsApp fallback is opened. */
export const FORM_INTENT = {
  buy_request: 'buy',
  sell_request: 'sell',
  network_signup: 'network',
};
