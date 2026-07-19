/** Canonical enums — mirror MARKET_INDEX_API.md / units_types_enum.py */

export const PROPERTY_TYPES = [
  "apartment",
  "villa",
  "svilla",
  "townhouse",
  "duplex",
  "penthouse",
  "studio",
  "suite",
  "chalet",
  "office",
  "shop",
  "twinhouse",
  "house",
  "clinic",
  "cabinet",
  "cabana",
  "commercial",
  "serviced apartment",
  "loft",
  "office villa",
  "condo",
  "duplex ground",
  "duplex roof",
  "land",
  "farm land",
  "residential building",
  "mall",
  "pharmacy",
  "restaurant",
  "retail",
  "food and beverage",
  "standalone",
  "admin",
  "bank",
  "medical",
  "palace",
  "sky loft",
  "maisonette",
  "warehouse",
  "beauty salon",
  "gym",
  "cafe",
  "show room",
  "parking",
  "garage",
  "workspace",
  "storage",
  "hotel",
  "hostel",
];

export const VIEWS = [
  "park",
  "street",
  "lagoon",
  "sea",
  "city",
  "river",
  "pool",
  "golf",
  "garden",
  "open area",
  "mountain",
  "watercourse",
];

export const FINISHINGS = [
  "fully finished",
  "semi finished",
  "core & shell",
  "flixy",
  "white box",
  "turnkey",
];

export const EVIDENCE_SOURCES = [
  "property_finder",
  "aqarmap",
  "developer",
  "crm",
  "other",
];

/** Backend joins publish validation issues with this exact separator. */
export const PUBLISH_ERROR_SEPARATOR = "; ";

export const DEFAULT_CONFIDENCE_WEIGHTS = {
  listing_count_w: 25,
  evidence_w: 25,
  freshness_w: 25,
  review_w: 25,
};

export const DEFAULT_CARD_GENERAL = {
  public_listing_count: 0,
  location_avg_price_per_sqm: null,
  property_type_avg_price_per_sqm: {},
  area_buckets: {},
  default_range_pct: 0.07,
  confidence_weights: { ...DEFAULT_CONFIDENCE_WEIGHTS },
  evidence: [],
};

export const DEFAULT_ADJUSTMENTS = {
  view: {},
  finishing: {},
};

export const MARKET_INDEX_CLIENT_ID = "homey";
export const MARKET_INDEX_EDIT_ROLES = ["admin", "owner"];
