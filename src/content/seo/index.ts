export {
  SEO_KEYWORD_ANCHORS,
  KEYWORD_PLACEMENT,
  BLOG_SLUGS,
} from "./keyword-map";
export type { SeoBlogPostKey, SeoBlogSection, SeoFaqItem } from "./types";
export { SEO_BLOG_POST_KEYS } from "./types";

export const SEO_BLOG_POST_KEY_TO_SLUG = {
  leadGenerator: "ai-lead-generator-real-estate-mena",
  leadFiltration: "ai-lead-filtration-real-estate-mena",
  crmEcosystem: "ai-crm-ecosystem-real-estate-mena",
} as const;

export const SEO_BLOG_SLUG_TO_KEY = {
  "ai-lead-generator-real-estate-mena": "leadGenerator",
  "ai-lead-filtration-real-estate-mena": "leadFiltration",
  "ai-crm-ecosystem-real-estate-mena": "crmEcosystem",
} as const;
