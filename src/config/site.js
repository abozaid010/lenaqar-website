export const LENAQAR_TENANT_ID = (
  process.env.NEXT_PUBLIC_LENAQAR_TENANT_ID || "lenaqar"
).trim();

export const SITE = {
  clientId: LENAQAR_TENANT_ID,
  name: "لينا عقار",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://lenaqar.com",
  htmlLang: "ar-EG",
  dir: "rtl",
  ogLocale: "ar_EG",
  /** Resale sell units only (`is_primary=false`, `purpose=sell`, `client_id=homey`). */
  inventory: { isPrimary: false, purpose: "sell" },
  /**
   * Optional developer/project tokens. Listing uses the public sell catalog;
   * these are not a hard filter (TMG-only matching emptied the feed).
   * Tokens, not substrings — "نور" matches inside "نورث".
   */
  network: {
    developerTokens: ["tmg", "talaat", "طلعت"],
    projectTokens: [
      "noor",
      "نور",
      "madinaty",
      "مدينتي",
      "south med",
      "southmed",
      "celia",
      "سيليا",
    ],
  },
  /** 2.9% down over 11 years = 34.5×. Strategy ceiling of 30 rejects real plans. */
  cashMultipleBounds: { min: 1, max: 40 },
  /** Backend presentValue stays hidden until its methodology can be stated on the page. */
  showPresentValue: false,
  /** Flip when info@lenaqar.com actually receives mail. */
  showEmail: false,
  /** Feed sizing: bounded pages in, capped list out. Set FEED_ENABLED=false to pause fetching. */
  feed: {
    enabled: process.env.NEXT_PUBLIC_LENAQAR_FEED_ENABLED !== "false",
    maxPages: 4,
    pageSize: 16,
    maxUnits: 40,
  },
};

/** Query params for the LenaQar public units catalog. */
export function lenaqarInventoryQuery() {
  const query = {
    client_id: SITE.clientId,
    purpose: SITE.inventory.purpose,
  };
  if (SITE.inventory.isPrimary === true || SITE.inventory.isPrimary === false) {
    query.is_primary = SITE.inventory.isPrimary;
  }
  return query;
}
