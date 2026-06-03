/** Inbound WhatsApp agent types (matches backend WhatsAppAgentType). */
export const WHATSAPP_AGENT_TYPES = {
  REAL_ESTATE_SALES: "real_estate_sales",
  CAMPAIGN: "campaign",
  EXTRACTION: "extraction",
  LENA_AI_SERVICE_SALES: "lena_ai_service_sales",
};

export const DEFAULT_WHATSAPP_AGENT = WHATSAPP_AGENT_TYPES.REAL_ESTATE_SALES;

const VALID_WHATSAPP_AGENTS = new Set(Object.values(WHATSAPP_AGENT_TYPES));

/**
 * @param {string | null | undefined} value
 * @returns {string}
 */
export function resolveWhatsappAgent(value) {
  if (!value || typeof value !== "string") {
    return DEFAULT_WHATSAPP_AGENT;
  }
  const normalized = value.trim().toLowerCase().replace(/-/g, "_");
  return VALID_WHATSAPP_AGENTS.has(normalized)
    ? normalized
    : DEFAULT_WHATSAPP_AGENT;
}

/** Options for agent select in client WhatsApp settings. */
export const WHATSAPP_AGENT_OPTIONS = [
  {
    value: WHATSAPP_AGENT_TYPES.REAL_ESTATE_SALES,
    labelKey: "editClient.whatsapp.agentRealEstateSales",
    defaultLabel: "Real estate sales",
  },
  {
    value: WHATSAPP_AGENT_TYPES.CAMPAIGN,
    labelKey: "editClient.whatsapp.agentCampaign",
    defaultLabel: "Campaign",
  },
  {
    value: WHATSAPP_AGENT_TYPES.EXTRACTION,
    labelKey: "editClient.whatsapp.agentExtraction",
    defaultLabel: "Extraction",
  },
  {
    value: WHATSAPP_AGENT_TYPES.LENA_AI_SERVICE_SALES,
    labelKey: "editClient.whatsapp.agentLenaSales",
    defaultLabel: "Lena AI service sales",
  },
];
