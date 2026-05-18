import type { AudiencePageConfig } from "./types";

export const developersConfig: AudiencePageConfig = {
  audience: "developers",
  hero: {
    badgeKey: "solutions.developers.hero.badge",
    headlineKey: "solutions.developers.hero.headline",
    subheadlineKey: "solutions.developers.hero.subheadline",
    primaryCta: "demo",
    primaryCtaKey: "solutions.developers.hero.ctaPrimary",
    secondaryCta: "scroll",
    secondaryCtaKey: "solutions.developers.hero.ctaSecondary",
    tertiaryCta: "contact",
    tertiaryCtaKey: "solutions.developers.hero.ctaTertiary",
    scrollTargetId: "screenshots",
  },
  problems: {
    sectionTitleKey: "solutions.developers.problems.title",
    sectionSubtitleKey: "solutions.developers.problems.subtitle",
    items: [
      { iconKey: "trendingDown", titleKey: "solutions.developers.problems.items.slowInventory" },
      { iconKey: "handshake", titleKey: "solutions.developers.problems.items.manualBrokers" },
      { iconKey: "fileQuestion", titleKey: "solutions.developers.problems.items.weakLeads" },
      { iconKey: "barChart3", titleKey: "solutions.developers.problems.items.poorTracking" },
      { iconKey: "layoutDashboard", titleKey: "solutions.developers.problems.items.scatteredReporting" },
      { iconKey: "users", titleKey: "solutions.developers.problems.items.teamOverload" },
      { iconKey: "package", titleKey: "solutions.developers.problems.items.visibility" },
    ],
  },
  solutions: {
    sectionTitleKey: "solutions.developers.solutions.title",
    sectionSubtitleKey: "solutions.developers.solutions.subtitle",
    items: [
      { iconKey: "share2", titleKey: "solutions.developers.solutions.items.sharing", descriptionKey: "solutions.developers.solutions.items.sharingDesc" },
      { iconKey: "network", titleKey: "solutions.developers.solutions.items.network", descriptionKey: "solutions.developers.solutions.items.networkDesc" },
      { iconKey: "target", titleKey: "solutions.developers.solutions.items.qualification", descriptionKey: "solutions.developers.solutions.items.qualificationDesc" },
      { iconKey: "lineChart", titleKey: "solutions.developers.solutions.items.analytics", descriptionKey: "solutions.developers.solutions.items.analyticsDesc" },
      { iconKey: "mapPin", titleKey: "solutions.developers.solutions.items.geo", descriptionKey: "solutions.developers.solutions.items.geoDesc" },
      { iconKey: "layoutDashboard", titleKey: "solutions.developers.solutions.items.reporting", descriptionKey: "solutions.developers.solutions.items.reportingDesc" },
      { iconKey: "bell", titleKey: "solutions.developers.solutions.items.notifications", descriptionKey: "solutions.developers.solutions.items.notificationsDesc" },
      { iconKey: "building2", titleKey: "solutions.developers.solutions.items.inventory", descriptionKey: "solutions.developers.solutions.items.inventoryDesc" },
    ],
  },
  benefits: {
    sectionTitleKey: "solutions.developers.benefits.title",
    items: [
      { titleKey: "solutions.developers.benefits.items.sellout" },
      { titleKey: "solutions.developers.benefits.items.leadQuality" },
      { titleKey: "solutions.developers.benefits.items.exposure" },
      { titleKey: "solutions.developers.benefits.items.coordination" },
      { titleKey: "solutions.developers.benefits.items.reporting" },
      { titleKey: "solutions.developers.benefits.items.campaigns" },
    ],
    closingKey: "solutions.developers.benefits.closing",
  },
};
