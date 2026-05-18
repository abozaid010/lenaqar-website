import type { AudiencePageConfig } from "./types";

export const agenciesConfig: AudiencePageConfig = {
  audience: "agencies",
  hero: {
    badgeKey: "solutions.agencies.hero.badge",
    headlineKey: "solutions.agencies.hero.headline",
    subheadlineKey: "solutions.agencies.hero.subheadline",
    primaryCta: "partner",
    primaryCtaKey: "solutions.agencies.hero.ctaPrimary",
    secondaryCta: "demo",
    secondaryCtaKey: "solutions.agencies.hero.ctaSecondary",
    tertiaryCta: "contact",
    tertiaryCtaKey: "solutions.agencies.hero.ctaTertiary",
  },
  problems: {
    sectionTitleKey: "solutions.agencies.problems.title",
    sectionSubtitleKey: "solutions.agencies.problems.subtitle",
    items: [
      { iconKey: "trendingDown", titleKey: "solutions.agencies.problems.items.losingLeads" },
      { iconKey: "target", titleKey: "solutions.agencies.problems.items.weakConversion" },
      { iconKey: "clock", titleKey: "solutions.agencies.problems.items.slowResponse" },
      { iconKey: "refreshCw", titleKey: "solutions.agencies.problems.items.retention" },
      { iconKey: "sparkles", titleKey: "solutions.agencies.problems.items.noPremium" },
      { iconKey: "users", titleKey: "solutions.agencies.problems.items.operational" },
    ],
  },
  solutions: {
    sectionTitleKey: "solutions.agencies.solutions.title",
    sectionSubtitleKey: "solutions.agencies.solutions.subtitle",
    items: [
      { iconKey: "zap", titleKey: "solutions.agencies.solutions.items.leadHandling", descriptionKey: "solutions.agencies.solutions.items.leadHandlingDesc" },
      { iconKey: "messageSquare", titleKey: "solutions.agencies.solutions.items.whatsapp", descriptionKey: "solutions.agencies.solutions.items.whatsappDesc" },
      { iconKey: "bot", titleKey: "solutions.agencies.solutions.items.followUp", descriptionKey: "solutions.agencies.solutions.items.followUpDesc" },
      { iconKey: "layoutDashboard", titleKey: "solutions.agencies.solutions.items.crm", descriptionKey: "solutions.agencies.solutions.items.crmDesc" },
      { iconKey: "lineChart", titleKey: "solutions.agencies.solutions.items.conversion", descriptionKey: "solutions.agencies.solutions.items.conversionDesc" },
      { iconKey: "palette", titleKey: "solutions.agencies.solutions.items.whiteLabel", descriptionKey: "solutions.agencies.solutions.items.whiteLabelDesc" },
      { iconKey: "workflow", titleKey: "solutions.agencies.solutions.items.automation", descriptionKey: "solutions.agencies.solutions.items.automationDesc" },
      { iconKey: "barChart3", titleKey: "solutions.agencies.solutions.items.visibility", descriptionKey: "solutions.agencies.solutions.items.visibilityDesc" },
    ],
  },
  benefits: {
    sectionTitleKey: "solutions.agencies.benefits.title",
    items: [
      { titleKey: "solutions.agencies.benefits.items.retention" },
      { titleKey: "solutions.agencies.benefits.items.performance" },
      { titleKey: "solutions.agencies.benefits.items.premium" },
      { titleKey: "solutions.agencies.benefits.items.revenue" },
      { titleKey: "solutions.agencies.benefits.items.differentiation" },
      { titleKey: "solutions.agencies.benefits.items.relationships" },
    ],
    closingKey: "solutions.agencies.benefits.closing",
  },
};
