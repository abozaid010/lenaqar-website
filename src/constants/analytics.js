// Analytics configuration (GA + Meta Pixel). Prefer NEXT_PUBLIC_* env vars in production.

export const ANALYTICS = {
  MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-L76Z647950',
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

/** Meta (Facebook) Pixel — override with NEXT_PUBLIC_META_PIXEL_ID in .env */
const META_PIXEL_DEFAULT_ID = '846747935139647';

export const META_PIXEL = {
  PIXEL_ID: (process.env.NEXT_PUBLIC_META_PIXEL_ID || META_PIXEL_DEFAULT_ID).trim(),
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
