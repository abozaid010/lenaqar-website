/**
 * Campaign Chat Configuration Constants
 */

// Default client ID for campaign chat operations
export const CAMPAIGN_CHAT_CLIENT_ID = "public";

// API endpoint paths
export const CAMPAIGN_CHAT_ENDPOINTS = {
  SESSIONS: "/campaign/sessions",
  SESSION: "/campaign/session",
  AI_REPLY_TOGGLE: "/campaign/ai-reply-toggle",
  UNIFIED_REPLY: "/campaign/unified-reply",
  UPDATE_NAME: "/campaign/update-name",
  TOGGLE_FAVORITE: "/campaign/toggle-favorite",
  UPDATE_NOTES: "/campaign/update-notes",
  WHATSAPP_AUTOMATION_MESSAGE: "/whatsapp/automation_message",
};

// Pagination defaults
export const CAMPAIGN_CHAT_PAGINATION = {
  DEFAULT_PAGE_SIZE: 100,
  DEFAULT_HISTORY_PAGE_SIZE: 50,
  DEFAULT_PAGE: 1
};
