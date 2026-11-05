/**
 * Pure analytics helpers (no browser, no "@/" imports) so `node --test` can load them.
 */

const WHATSAPP_HOSTS = new Set(["wa.me", "api.whatsapp.com", "web.whatsapp.com"]);

const PII_KEYS = new Set([
  "phone",
  "phone_number",
  "email",
  "name",
  "full_name",
  "owner_name",
  "client_name",
  "password",
  "message",
  "text",
  "notes",
]);

/** Route -> stable label used as the `page_type` event parameter. */
export function getPageType(pathname = "/") {
  const p = String(pathname || "/").split("?")[0].split("#")[0].replace(/\/+$/, "") || "/";
  if (p === "/") return "home";
  if (p === "/opportunities") return "opportunities_list";
  if (p.startsWith("/opportunities/")) return "opportunity_detail";
  if (p === "/sell") return "sell";
  if (p === "/calculator") return "calculator";
  if (p === "/how-it-works") return "how_it_works";
  if (p === "/guides" || p.startsWith("/guides/")) return "guide";
  if (p === "/network" || p.startsWith("/network/")) return "network";
  if (p === "/ready-to-move-properties" || /^\/(apartments|villas|chalets)-for-sale\//.test(p)) {
    return "buyer_landing";
  }
  if (["/no-calls", "/delivery-delays", "/before-you-pay", "/verified-prices"].includes(p)) {
    return "door_landing";
  }
  if (p === "/privacy") return "privacy";
  return "other";
}

/**
 * Classify an href.
 * - null                      : not a WhatsApp link
 * - { kind: "share" }         : WhatsApp link with no phone number (share sheet) -> NOT a conversion
 * - { kind: "contact", target }: target = "buyer" | "network" | "other"
 * `own` = { buyer: "201002891933", network: "201016080323" } (digits only)
 */
export function classifyWhatsAppHref(href, own = {}) {
  let url;
  try {
    url = new URL(String(href || ""), "https://www.lenaqar.com");
  } catch {
    return null;
  }
  if (!WHATSAPP_HOSTS.has(url.hostname.replace(/^www\./, ""))) return null;

  const fromPath = url.hostname === "wa.me" ? url.pathname.replace(/\D/g, "") : "";
  const digits = fromPath || String(url.searchParams.get("phone") || "").replace(/\D/g, "");
  if (!digits) return { kind: "share" };
  if (digits === own.buyer) return { kind: "contact", target: "buyer" };
  if (digits === own.network) return { kind: "contact", target: "network" };
  return { kind: "contact", target: "other" };
}

/** Drop empty values and anything that could carry personal data; cap string length. */
export function sanitizeParams(params = {}) {
  const out = {};
  for (const [key, value] of Object.entries(params)) {
    if (PII_KEYS.has(key)) continue;
    if (value === undefined || value === null || value === "") continue;
    if (typeof value === "number" || typeof value === "boolean") out[key] = value;
    else out[key] = String(value).slice(0, 100);
  }
  return out;
}

/** Budget -> coarse bucket (EGP). Keeps GA4 dimension cardinality low. */
export function cashBucket(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return "none";
  if (n < 500_000) return "lt_500k";
  if (n < 1_000_000) return "500k_1m";
  if (n < 2_000_000) return "1m_2m";
  if (n < 5_000_000) return "2m_5m";
  return "gte_5m";
}
