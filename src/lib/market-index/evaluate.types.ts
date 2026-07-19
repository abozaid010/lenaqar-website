/** Exact shapes from live Market Index estimate / active-card APIs (2026-07-19). */

export type ConfidenceBand = "high" | "medium" | "low";

export type MatchLevel =
  | "exact"
  | "nearest"
  | "area_bucket"
  | "property_type_avg"
  | "location_avg";

export type LocationLevel =
  | "country"
  | "city"
  | "district"
  | "sub_district"
  | string;

export interface ApiErrorBody {
  detail: string;
}

export interface LocationNode {
  id: string;
  slug: string;
  parent_id: string | null;
  level: LocationLevel;
  depth: number;
  en_name: string;
  ar_name: string;
  aliases: string[];
  path_en: string[];
  children_count: number;
  is_leaf: boolean;
  source: string;
  imported_at: string;
}

export interface LocationsListData {
  locations: LocationNode[];
  count: number;
}

export interface EvidenceItem {
  source: string;
  url: string | null;
  date: string;
  notes: string | null;
}

export interface PriceRange {
  low: number;
  high: number;
}

export interface AreaBucket {
  min_sqm: number;
  max_sqm: number;
  avg_price_per_sqm: number;
}

export interface PropertyTypeStats {
  unit_count: number;
  avg_estimated_price: number;
  min_price: number;
  max_price: number;
  avg_price_per_sqm: number;
  avg_developer_price: number | null;
  avg_monthly_rent: number | null;
  avg_monthly_furnished_rent: number | null;
  avg_roi: number | null;
  avg_furnished_roi: number | null;
}

export interface EvidenceSummary {
  total_items: number;
  distinct_sources: string[];
  by_source: Record<string, number>;
  newest_date: string | null;
  oldest_date: string | null;
}

export interface PublishedStatistics {
  public_listing_count: number;
  location_avg_price_per_sqm: number | null;
  property_type_avg_price_per_sqm: Record<string, number>;
  area_buckets: Record<string, AreaBucket[]>;
  by_property_type: Record<string, PropertyTypeStats>;
  evidence_summary: EvidenceSummary;
}

export interface PublishedUnit {
  id: string;
  card_id: string;
  property_type: string;
  area_sqm: number;
  bedrooms: number;
  bathrooms: number;
  estimated_avg_price: number;
  price_range: PriceRange;
  developer_price: number | null;
  monthly_rent: number | null;
  monthly_furnished_rent: number | null;
  evidence: EvidenceItem[];
  created_at: string;
  updated_at: string;
  updated_by: string;
  roi: number | null;
  furnished_roi: number | null;
  confidence: ConfidenceBand;
  confidence_drivers: string[];
  last_reviewed_at: string;
}

export interface ChangesSummary {
  units_added: number;
  units_removed: number;
  units_changed: number;
  general_fields_changed: number;
  adjustments_changed: boolean;
  initial_publication: boolean;
}

export interface PublishedCard {
  location: LocationNode | Record<string, unknown> | null;
  location_id: string;
  version: number;
  version_id: string;
  published_at: string;
  last_reviewed_at: string;
  published_by: { id: string; email: string };
  changes_summary: ChangesSummary;
  notes: string | null;
  confidence: ConfidenceBand;
  confidence_drivers: string[];
  statistics: PublishedStatistics;
  adjustments: {
    view: Record<string, number>;
    finishing: Record<string, number>;
  };
  units: PublishedUnit[];
  unit_count: number;
}

export interface EstimateRequest {
  location_id: string;
  property_type: string;
  area_sqm: number;
  bedrooms?: number | null;
  bathrooms?: number | null;
  view?: string | null;
  finishing?: string | null;
}

export interface AdjustmentApplied {
  type: "view" | "finishing" | string;
  value: string;
  pct: number;
  note?: string;
}

export interface EstimateResponse {
  estimated_value: number;
  price_range: PriceRange;
  developer_price: number | null;
  monthly_rent: number | null;
  monthly_furnished_rent: number | null;
  roi: number | null;
  furnished_roi: number | null;
  confidence: ConfidenceBand;
  confidence_drivers: string[];
  match_level: MatchLevel;
  matched_reference: PublishedUnit | null;
  market_card: PublishedCard;
  adjustments_applied: AdjustmentApplied[];
  explanation: string;
  version: number;
  published_at: string;
  location_id: string;
}

export interface SuccessEnvelope<T> {
  status: true;
  code: number;
  message: string;
  data: T;
  error_message: null;
}
