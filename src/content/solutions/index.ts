import { agenciesConfig } from "./agencies";
import { brokersConfig } from "./brokers";
import { developersConfig } from "./developers";
import type { AudiencePageConfig, SolutionAudience } from "./types";

const CONFIGS: Record<SolutionAudience, AudiencePageConfig> = {
  brokers: brokersConfig,
  developers: developersConfig,
  agencies: agenciesConfig,
};

export function getAudienceConfig(audience: SolutionAudience): AudiencePageConfig {
  return CONFIGS[audience];
}

export type { AudiencePageConfig, SolutionAudience };
