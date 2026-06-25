export type ClientAgentId = "daily_engagement";

export type ClientAgentOption = {
  id: ClientAgentId;
  labelKey: string;
  descriptionKey: string;
  helperTextKey?: string;
  defaultLabel: string;
  defaultDescription: string;
  defaultHelperText?: string;
};

export const CLIENT_AGENT_OPTIONS: ClientAgentOption[] = [
  {
    id: "daily_engagement",
    labelKey: "clientInfo.automationAgents.dailyEngagement.label",
    descriptionKey: "clientInfo.automationAgents.dailyEngagement.description",
    helperTextKey: "clientInfo.automationAgents.dailyEngagement.helperText",
    defaultLabel: "Daily Engagement",
    defaultDescription:
      "Runs scheduled daily follow-up for leads where AI reply is enabled.",
    defaultHelperText:
      "Leads with AI reply turned off in the dashboard are still skipped, even when this agent is enabled.",
  },
];
