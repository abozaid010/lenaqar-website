import type { SolutionAudience } from "./types";

export type LandingAudience = Extract<
  SolutionAudience,
  "brokers" | "developers" | "agencies"
>;

export const LANDING_PAIN_KEYS: Record<LandingAudience, string[]> = {
  agencies: [
    "hero.pains.noResponse",
    "hero.pains.delayed",
    "hero.pains.manual",
    "hero.pains.overload",
    "hero.pains.wasted",
  ],
  brokers: [
    "hero.pains.lostLeads",
    "hero.pains.fakeLeads",
    "hero.pains.slowFollowUp",
    "hero.pains.teamChaos",
    "hero.pains.manualWhatsApp",
  ],
  developers: [
    "hero.pains.slowInventory",
    "hero.pains.manualBrokers",
    "hero.pains.weakLeads",
    "hero.pains.poorTracking",
    "hero.pains.noVisibility",
  ],
};

export const LANDING_OFFERS: Record<
  LandingAudience,
  { image: string; titleKey: string; descriptionKey: string }[]
> = {
  agencies: [
    {
      image: "/images/solutions/campaigns.svg",
      titleKey: "offers.card1.title",
      descriptionKey: "offers.card1.description",
    },
    {
      image: "/images/solutions/crm-dashboard.svg",
      titleKey: "offers.card2.title",
      descriptionKey: "offers.card2.description",
    },
  ],
  brokers: [
    {
      image: "/images/solutions/whatsapp-mock.svg",
      titleKey: "offers.card1.title",
      descriptionKey: "offers.card1.description",
    },
    {
      image: "/images/solutions/crm-dashboard.svg",
      titleKey: "offers.card2.title",
      descriptionKey: "offers.card2.description",
    },
  ],
  developers: [
    {
      image: "/images/solutions/inventory.svg",
      titleKey: "offers.card1.title",
      descriptionKey: "offers.card1.description",
    },
    {
      image: "/images/solutions/analytics.svg",
      titleKey: "offers.card2.title",
      descriptionKey: "offers.card2.description",
    },
  ],
};

export const LANDING_PROBLEM_KEYS: Record<
  LandingAudience,
  { optimizeItems: string[]; ignoreItems: string[]; happensItems: string[] }
> = {
  agencies: {
    optimizeItems: ["ctr", "cpl", "reach"],
    ignoreItems: ["response", "qualification", "readiness", "automation"],
    happensItems: ["qualified", "waste", "noise"],
  },
  brokers: {
    optimizeItems: ["listings", "agents", "marketing"],
    ignoreItems: ["response", "qualification", "visibility", "automation"],
    happensItems: ["qualified", "waste", "noise"],
  },
  developers: {
    optimizeItems: ["launches", "brokers", "campaigns"],
    ignoreItems: ["qualification", "response", "reporting", "inventory"],
    happensItems: ["qualified", "waste", "noise"],
  },
};

export const LANDING_WHY_FAIL_APPROACHES: Record<LandingAudience, string[]> = {
  agencies: ["hiring", "chatbots", "manual", "crm"],
  brokers: ["hiring", "chatbots", "manual", "excel"],
  developers: ["hiring", "chatbots", "manual", "crm"],
};

export const LANDING_SOLUTION_KEYS: Record<
  LandingAudience,
  { capabilities: string[]; notItems: string[]; outcomes: string[] }
> = {
  agencies: {
    capabilities: ["instant", "qualify", "filter", "route", "coverage"],
    notItems: ["chatbot", "crm", "script"],
    outcomes: ["ratio", "overhead", "roi", "closing"],
  },
  brokers: {
    capabilities: ["filter", "whatsapp", "crm", "team", "listings"],
    notItems: ["chatbot", "spreadsheet", "fragmented"],
    outcomes: ["faster", "conversion", "visibility", "deals"],
  },
  developers: {
    capabilities: ["sharing", "network", "qualify", "analytics", "reporting"],
    notItems: ["portal", "spreadsheet", "manual"],
    outcomes: ["sellout", "quality", "exposure", "coordination"],
  },
};

export const LANDING_PARTNERSHIP_KEYS: Record<
  LandingAudience,
  { withoutItems: string[]; withItems: string[]; proof: string[]; audiences: string[] }
> = {
  agencies: {
    withoutItems: ["volume", "quality", "conversion", "cost"],
    withItems: ["qualification", "response", "spend", "conversations"],
    proof: ["calls", "volume", "transactions"],
    audiences: ["agencies", "developers", "brokers"],
  },
  brokers: {
    withoutItems: ["leads", "fake", "whatsapp", "visibility"],
    withItems: ["instant", "qualified", "centralized", "tracked"],
    proof: ["calls", "volume", "transactions"],
    audiences: ["brokers", "developers", "agencies"],
  },
  developers: {
    withoutItems: ["slow", "weak", "manual", "scattered"],
    withItems: ["instant", "qualified", "network", "visibility"],
    proof: ["calls", "volume", "transactions"],
    audiences: ["brokers", "developers", "agencies"],
  },
};

export function lk(audience: LandingAudience, path: string) {
  return `solutions.${audience}.landing.${path}`;
}
