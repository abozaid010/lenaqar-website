export type SeoBlogPostKey =
  | "leadGenerator"
  | "leadFiltration"
  | "crmEcosystem";

export type SeoBlogSection = {
  heading: string;
  paragraphs: string[];
};

export type SeoFaqItem = {
  id: string;
  question: string;
  answer: string;
};

export const SEO_BLOG_POST_KEYS: SeoBlogPostKey[] = [
  "leadGenerator",
  "leadFiltration",
  "crmEcosystem",
];
