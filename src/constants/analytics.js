// Google Analytics Configuration
export const ANALYTICS = {
  MEASUREMENT_ID: 'G-L76Z647950',
  GTM_SCRIPT_URL: 'https://www.googletagmanager.com/gtag/js?id=',
  
  // Event names for consistent tracking
  EVENTS: {
    DEEP_LINK_ATTEMPT: 'deep_link_attempt',
    DOWNLOAD_CLICK: 'download_click',
    DOWNLOAD_PAGE_VIEW: 'download_page_view',
    CAMPAIGN_ARRIVAL: 'campaign_arrival',
    APP_STORE_CLICK: 'app_store_click'
  }
};

// Helper function to get GA script URL
export const getGAScriptUrl = () => `${ANALYTICS.GTM_SCRIPT_URL}${ANALYTICS.MEASUREMENT_ID}`;

// Helper function to get GA config
export const getGAConfig = () => ANALYTICS.MEASUREMENT_ID;
