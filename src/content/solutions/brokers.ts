import type { AudiencePageConfig } from "./types";

export const brokersConfig: AudiencePageConfig = {
  audience: "brokers",
  hero: {
    badgeKey: "solutions.brokers.hero.badge",
    headlineKey: "solutions.brokers.hero.headline",
    subheadlineKey: "solutions.brokers.hero.subheadline",
    primaryCta: "demo",
    primaryCtaKey: "solutions.brokers.hero.ctaPrimary",
    secondaryCta: "login",
    secondaryCtaKey: "solutions.brokers.hero.ctaSecondary",
    tertiaryCta: "contact",
    tertiaryCtaKey: "solutions.brokers.hero.ctaTertiary",
  },
  problems: {
    sectionTitleKey: "solutions.brokers.problems.title",
    sectionSubtitleKey: "solutions.brokers.problems.subtitle",
    items: [
      { iconKey: "alertTriangle", titleKey: "solutions.brokers.problems.items.lostLeads" },
      { iconKey: "userMinus", titleKey: "solutions.brokers.problems.items.fakeLeads" },
      { iconKey: "clock", titleKey: "solutions.brokers.problems.items.slowFollowUp" },
      { iconKey: "users", titleKey: "solutions.brokers.problems.items.teamChaos" },
      { iconKey: "messageSquare", titleKey: "solutions.brokers.problems.items.manualWhatsApp" },
      { iconKey: "fileSpreadsheet", titleKey: "solutions.brokers.problems.items.excelSheets" },
      { iconKey: "trendingUp", titleKey: "solutions.brokers.problems.items.missedOpportunities" },
      { iconKey: "building2", titleKey: "solutions.brokers.problems.items.manualPublishing" },
      { iconKey: "eye", titleKey: "solutions.brokers.problems.items.noVisibility" },
    ],
  },
  solutions: {
    sectionTitleKey: "solutions.brokers.solutions.title",
    sectionSubtitleKey: "solutions.brokers.solutions.subtitle",
    items: [
      { iconKey: "filter", titleKey: "solutions.brokers.solutions.items.leadFiltering", descriptionKey: "solutions.brokers.solutions.items.leadFilteringDesc" },
      { iconKey: "messageSquare", titleKey: "solutions.brokers.solutions.items.whatsapp", descriptionKey: "solutions.brokers.solutions.items.whatsappDesc" },
      { iconKey: "layoutDashboard", titleKey: "solutions.brokers.solutions.items.crm", descriptionKey: "solutions.brokers.solutions.items.crmDesc" },
      { iconKey: "barChart3", titleKey: "solutions.brokers.solutions.items.teamTracking", descriptionKey: "solutions.brokers.solutions.items.teamTrackingDesc" },
      { iconKey: "building2", titleKey: "solutions.brokers.solutions.items.listings", descriptionKey: "solutions.brokers.solutions.items.listingsDesc" },
      { iconKey: "bot", titleKey: "solutions.brokers.solutions.items.chatbot", descriptionKey: "solutions.brokers.solutions.items.chatbotDesc" },
      { iconKey: "workflow", titleKey: "solutions.brokers.solutions.items.workflows", descriptionKey: "solutions.brokers.solutions.items.workflowsDesc" },
      { iconKey: "bell", titleKey: "solutions.brokers.solutions.items.notifications", descriptionKey: "solutions.brokers.solutions.items.notificationsDesc" },
      { iconKey: "listChecks", titleKey: "solutions.brokers.solutions.items.centralized", descriptionKey: "solutions.brokers.solutions.items.centralizedDesc" },
    ],
  },
  benefits: {
    sectionTitleKey: "solutions.brokers.benefits.title",
    items: [
      { titleKey: "solutions.brokers.benefits.items.fasterResponse" },
      { titleKey: "solutions.brokers.benefits.items.organization" },
      { titleKey: "solutions.brokers.benefits.items.conversion" },
      { titleKey: "solutions.brokers.benefits.items.lessWork" },
      { titleKey: "solutions.brokers.benefits.items.moreDeals" },
      { titleKey: "solutions.brokers.benefits.items.visibility" },
      { titleKey: "solutions.brokers.benefits.items.lessAdmin" },
    ],
    closingKey: "solutions.brokers.benefits.closing",
  },
};
