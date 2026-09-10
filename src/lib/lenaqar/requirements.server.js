import { cache } from "react";
import { API_BASE_URL, PUBLIC_X_API_KEY } from "@/lib/apiConfig";
import { bffFetch, isCloudflareChallenge } from "@/lib/bffFetch";
import { comparePublicRequirements } from "./to-public-requirement";

const DEFAULT_LIMIT = 48;

const FORBIDDEN_KEYS = [
  "lead",
  "user_id",
  "assigned_to",
  "phone",
  "phone_number",
  "email",
  "name",
  "matched_units",
  "matched_units_comment",
  "client_id",
  "score",
  "additionalFeatures",
  "additional_features",
];

/**
 * Accept only the public allowlist shape from GET /public/v1/requirements.
 * Rejects any row that still carries CRM / contact fields.
 * @param {unknown} raw
 * @returns {import("./to-public-requirement").PublicRequirement | null}
 */
function acceptPublicRequirement(raw) {
  if (!raw || typeof raw !== "object") return null;
  const row = /** @type {Record<string, unknown>} */ (raw);
  if (FORBIDDEN_KEYS.some((key) => key in row)) return null;
  if (typeof row.id !== "string" || !/^[a-f0-9]{12}$/.test(row.id)) return null;
  if (row.intent !== "buy") return null;
  if (!Array.isArray(row.locations) || row.locations.length === 0) return null;
  if (!Array.isArray(row.propertyTypes)) return null;

  const locations = [];
  for (const loc of row.locations) {
    if (!loc || typeof loc !== "object") continue;
    const entry = /** @type {Record<string, unknown>} */ (loc);
    locations.push({
      city: typeof entry.city === "string" ? entry.city : "",
      district: typeof entry.district === "string" ? entry.district : "",
      subDistrict: typeof entry.subDistrict === "string" ? entry.subDistrict : "",
      project: typeof entry.project === "string" ? entry.project : "",
    });
  }
  if (locations.length === 0) return null;

  /** @type {{ id: string, intent: "buy", locations: typeof locations, propertyTypes: string[], roomsCount?: number, minPrice?: number, maxPrice?: number, downPayment?: number, monthlyInstallment?: number, deliveryDate?: string, developer?: string, notes?: string }} */
  const out = {
    id: row.id,
    intent: "buy",
    locations,
    propertyTypes: row.propertyTypes.filter((t) => typeof t === "string"),
  };

  if (typeof row.roomsCount === "number") out.roomsCount = row.roomsCount;
  if (typeof row.minPrice === "number") out.minPrice = row.minPrice;
  if (typeof row.maxPrice === "number") out.maxPrice = row.maxPrice;
  if (typeof row.downPayment === "number") out.downPayment = row.downPayment;
  if (typeof row.monthlyInstallment === "number") {
    out.monthlyInstallment = row.monthlyInstallment;
  }
  if (typeof row.deliveryDate === "string" && row.deliveryDate.trim()) {
    out.deliveryDate = row.deliveryDate.trim();
  }
  if (typeof row.developer === "string" && row.developer.trim()) {
    out.developer = row.developer.trim();
  }
  if (typeof row.notes === "string" && row.notes.trim()) {
    out.notes = row.notes.trim().slice(0, 600);
  }
  return out;
}

/**
 * Server-only: load anonymized pending requirements from the public API.
 * Auth is X-API-Key (+ BFF secret) only — no CRM username/password.
 *
 * @param {{ limit?: number }} [options]
 * @returns {Promise<{ requirements: NonNullable<ReturnType<typeof acceptPublicRequirement>>[], error: string | null }>}
 */
export const fetchPublicRequirements = cache(async function fetchPublicRequirements(
  options = {},
) {
  const limit = Math.min(
    Math.max(Number(options.limit) || DEFAULT_LIMIT, 1),
    100,
  );

  if (!PUBLIC_X_API_KEY) {
    console.error(
      "[lenaqar] public requirements skipped — no X_API_KEY / NEXT_PUBLIC_X_API_KEY",
    );
    return { requirements: [], error: "unavailable" };
  }

  try {
    const qs = new URLSearchParams({ limit: String(limit) });
    const response = await bffFetch(
      `${API_BASE_URL}/public/v1/requirements?${qs}`,
      {
        headers: {
          accept: "application/json",
          "X-API-Key": PUBLIC_X_API_KEY,
        },
        next: { revalidate: 300 },
      },
    );

    const text = await response.text().catch(() => "");
    if (!response.ok) {
      const cf = isCloudflareChallenge(response, text);
      console.error(
        "[lenaqar] public requirements failed",
        response.status,
        cf ? "(Cloudflare challenge)" : "",
      );
      return { requirements: [], error: "unavailable" };
    }

    let json;
    try {
      json = JSON.parse(text);
    } catch {
      console.error("[lenaqar] public requirements returned non-JSON");
      return { requirements: [], error: "unavailable" };
    }

    if (json?.status === false) {
      console.error(
        "[lenaqar] public requirements API error",
        json?.error_message || json?.message || "unknown",
      );
      return { requirements: [], error: "unavailable" };
    }

    const data = json?.data && typeof json.data === "object" ? json.data : {};
    const items = Array.isArray(data.requirements) ? data.requirements : [];

    const seen = new Set();
    const publicRows = [];
    for (const raw of items) {
      const row = acceptPublicRequirement(raw);
      if (!row || seen.has(row.id)) continue;
      seen.add(row.id);
      publicRows.push(row);
    }

    publicRows.sort(comparePublicRequirements);

    return {
      requirements: publicRows.slice(0, limit),
      error: null,
    };
  } catch (error) {
    console.error("[lenaqar] public requirements error", error);
    return { requirements: [], error: "unavailable" };
  }
});
