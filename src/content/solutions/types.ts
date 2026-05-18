export type SolutionAudience = "brokers" | "developers" | "agencies";

export interface IconItem {
  iconKey: string;
  titleKey: string;
  descriptionKey?: string;
}

export interface AudiencePageConfig {
  audience: SolutionAudience;
  hero: {
    badgeKey?: string;
    headlineKey: string;
    subheadlineKey: string;
    primaryCta: "demo" | "login" | "partner" | "scroll";
    primaryCtaKey: string;
    secondaryCta: "demo" | "scroll" | "contact" | "login";
    secondaryCtaKey: string;
    tertiaryCta?: "contact";
    tertiaryCtaKey?: string;
    scrollTargetId?: string;
  };
  problems: {
    sectionTitleKey: string;
    sectionSubtitleKey: string;
    items: IconItem[];
  };
  solutions: {
    sectionTitleKey: string;
    sectionSubtitleKey: string;
    items: IconItem[];
  };
  benefits: {
    sectionTitleKey: string;
    items: { titleKey: string }[];
    closingKey: string;
  };
}
