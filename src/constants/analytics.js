// Analytics configuration (GA + Meta Pixel). Prefer NEXT_PUBLIC_* env vars in production.

export const ANALYTICS = {
  MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-L76Z647950',
  GTM_SCRIPT_URL: 'https://www.googletagmanager.com/gtag/js?id=',

  // Event names for consistent tracking
  EVENTS: {
    DEEP_LINK_ATTEMPT: 'deep_link_attempt',
    DOWNLOAD_CLICK: 'download_click',
    DOWNLOAD_PAGE_VIEW: 'download_page_view',
    CAMPAIGN_ARRIVAL: 'campaign_arrival',
    APP_STORE_CLICK: 'app_store_click',
    CALCULATOR_USED: 'calculator_used',
    SELLER_WHATSAPP_CLICKED: 'seller_whatsapp_clicked',
    CASH_ENTERED: 'cash_entered',
    UNIT_VIEWED: 'unit_viewed',
    BUYER_WHATSAPP_CLICKED: 'buyer_whatsapp_clicked',
  },
};

/** Meta (Facebook) Pixel — override with NEXT_PUBLIC_META_PIXEL_ID in .env */
const META_PIXEL_DEFAULT_ID = '846747935139647';

export const META_PIXEL = {
  PIXEL_ID: (process.env.NEXT_PUBLIC_META_PIXEL_ID || META_PIXEL_DEFAULT_ID).trim(),
  SCRIPT_URL: 'https://connect.facebook.net/en_US/fbevents.js',
  NOSCRIPT_BASE: 'https://www.facebook.com/tr',
  /** Routes that fire ViewContent on visit */
  VIEW_CONTENT_PATHS: ['/services', '/pricing', '/ai-agent'],
  EVENTS: {
    PAGE_VIEW: 'PageView',
    VIEW_CONTENT: 'ViewContent',
    CONTACT: 'Contact',
    LEAD: 'Lead',
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
