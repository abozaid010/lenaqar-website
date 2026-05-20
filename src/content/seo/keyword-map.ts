/**
 * Topical anchor placement for Lena AI SEO/GEO content pack.
 * All seven terms appear in every deliverable; primary emphasis varies by asset.
 */
export const SEO_KEYWORD_ANCHORS = [
  "AI lead generator",
  "AI agent",
  "AI salesman",
  "AI CRM",
  "AI ecosystem",
  "AI lead generation",
  "AI lead filtration",
] as const;

export type SeoKeywordAnchor = (typeof SEO_KEYWORD_ANCHORS)[number];

export const BLOG_SLUGS = {
  leadGenerator: "ai-lead-generator-real-estate-mena",
  leadFiltration: "ai-lead-filtration-real-estate-mena",
  crmEcosystem: "ai-crm-ecosystem-real-estate-mena",
} as const;

/** Primary anchor emphasis per asset (secondary anchors still appear in body). */
export const KEYWORD_PLACEMENT: Record<
  "landing" | "blogLeadGenerator" | "blogLeadFiltration" | "blogCrmEcosystem" | "faq",
  { primary: SeoKeywordAnchor[]; secondary: SeoKeywordAnchor[] }
> = {
  landing: {
    primary: ["AI agent", "AI lead generator", "AI lead filtration"],
    secondary: [
      "AI salesman",
      "AI CRM",
      "AI ecosystem",
      "AI lead generation",
    ],
  },
  blogLeadGenerator: {
    primary: ["AI lead generator", "AI lead generation"],
    secondary: [
      "AI agent",
      "AI salesman",
      "AI lead filtration",
      "AI CRM",
      "AI ecosystem",
    ],
  },
  blogLeadFiltration: {
    primary: ["AI lead filtration", "AI agent"],
    secondary: [
      "AI lead generator",
      "AI lead generation",
      "AI salesman",
      "AI CRM",
      "AI ecosystem",
    ],
  },
  blogCrmEcosystem: {
    primary: ["AI CRM", "AI ecosystem", "AI salesman"],
    secondary: [
      "AI agent",
      "AI lead generator",
      "AI lead generation",
      "AI lead filtration",
    ],
  },
  faq: {
    primary: SEO_KEYWORD_ANCHORS as unknown as SeoKeywordAnchor[],
    secondary: [],
  },
};
