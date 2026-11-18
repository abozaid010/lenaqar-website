import { applyRequirementMoneyTrust } from "./requirement-money-trust.js";
import { cache } from "react";
import { API_BASE_URL, PUBLIC_X_API_KEY } from "@/lib/apiConfig";
import { bffFetch, isCloudflareChallenge } from "@/lib/bffFetch";
import { catalogPlaceAr } from "./arabic-labels.server";
import { publicRequirementsQuery } from "./requirement-sort.js";
import {
  PUBLIC_ID_SCHEME,
  PUBLIC_REQUIREMENTS_TAG,
  isPublicRequirementId,
} from "./requirement-public.js";

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
  if (!isPublicRequirementId(row.id)) return null;
  if (row.intent !== "buy") return null;
  if (!Array.isArray(row.locations) || row.locations.length === 0) return null;
  if (!Array.isArray(row.propertyTypes)) return null;

  const locations = [];
  for (const loc of row.locations) {
    if (!loc || typeof loc !== "object") continue;
    const entry = /** @type {Record<string, unknown>} */ (loc);
    const city = typeof entry.city === "string" ? entry.city : "";
    const district = typeof entry.district === "string" ? entry.district : "";
    const subDistrict =
      typeof entry.subDistrict === "string" ? entry.subDistrict : "";
    const project = typeof entry.project === "string" ? entry.project : "";
    locations.push({
      city,
      district,
      subDistrict,
      project,
      cityAr: catalogPlaceAr(city),
      districtAr: catalogPlaceAr(district),
      subDistrictAr: catalogPlaceAr(subDistrict),
      projectAr: catalogPlaceAr(project),
    });
  }
  if (locations.length === 0) return null;

  /** @type {{ id: string, intent: "buy", locations: typeof locations, propertyTypes: string[], roomsCount?: number, minPrice?: number, maxPrice?: number, downPayment?: number, monthlyInstallment?: number, deliveryDate?: string, developer?: string, notes?: string, moneyReviewRequired?: boolean }} */
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
  return applyRequirementMoneyTrust(out);
}

/**
 * One call to the public requirements API (X-API-Key + BFF secret, cached 300 s under
 * PUBLIC_REQUIREMENTS_TAG so the backend's takedown can drop it at once).
 * Returns { status: "ok", data } | { status: "not_found" } | { status: "unavailable" }.
 * A response without the current id scheme is treated as unavailable, never rendered.
 * @param {string} path
 */
async function requestPublicRequirements(path) {
  if (!PUBLIC_X_API_KEY) {
    console.error(
      "[lenaqar] public requirements skipped — no X_API_KEY / NEXT_PUBLIC_X_API_KEY",
    );
    return { status: "unavailable" };
  }

  try {
    const response = await bffFetch(`${API_BASE_URL}${path}`, {
      headers: {
        accept: "application/json",
        "X-API-Key": PUBLIC_X_API_KEY,
      },
      next: { revalidate: 300, tags: [PUBLIC_REQUIREMENTS_TAG] },
      signal: AbortSignal.timeout(30_000),
    });

    const text = await response.text().catch(() => "");
    if (response.status === 404) return { status: "not_found" };
    if (!response.ok) {
      const cf = isCloudflareChallenge(response, text);
      console.error(
        "[lenaqar] public requirements failed",
        response.status,
        cf ? "(Cloudflare challenge)" : "",
      );
      return { status: "unavailable" };
    }

    let json;
    try {
      json = JSON.parse(text);
    } catch {
      console.error("[lenaqar] public requirements returned non-JSON");
      return { status: "unavailable" };
    }

    if (json?.status === false) {
      console.error(
        "[lenaqar] public requirements API error",
        json?.error_message || json?.message || "unknown",
      );
      return { status: "unavailable" };
    }

    const data = json?.data && typeof json.data === "object" ? json.data : {};
    if (data.id_scheme !== PUBLIC_ID_SCHEME) {
      console.error("[lenaqar] public requirements: unexpected id scheme", data.id_scheme);
      return { status: "unavailable" };
    }
    return { status: "ok", data };
  } catch (error) {
    console.error(
      "[lenaqar] public requirements error",
      error,
      "url=",
      API_BASE_URL,
    );
    return { status: "unavailable" };
  }
}

/**
 * Server-only: load anonymized pending requirements from the public API.
 * Auth is X-API-Key (+ BFF secret) only — no CRM username/password.
 *
 * @param {{ limit?: number, sort?: "default" | "newest" | "highest_score" }} [options]
 * @returns {Promise<{ requirements: NonNullable<ReturnType<typeof acceptPublicRequirement>>[], error: string | null }>}
 */
export const fetchPublicRequirements = cache(async function fetchPublicRequirements(
  options = {},
) {
  const limit = Math.min(
    Math.max(Number(options.limit) || DEFAULT_LIMIT, 1),
    100,
  );
  const qs = publicRequirementsQuery({ limit, sort: options.sort });

  const result = await requestPublicRequirements(`/public/v1/requirements?${qs}`);
  if (result.status !== "ok") return { requirements: [], error: "unavailable" };

  const items = Array.isArray(result.data.requirements) ? result.data.requirements : [];
  const seen = new Set();
  const publicRows = [];
  for (const raw of items) {
    const row = acceptPublicRequirement(raw);
    if (!row || seen.has(row.id)) continue;
    seen.add(row.id);
    publicRows.push(row);
  }

  return {
    requirements: publicRows.slice(0, limit),
    error: null,
  };
});

/**
 * Server-only: one public buyer request for /requests/[publicId].
 * Malformed ids are never sent to the backend. Unknown or no-longer-public → null.
 *
 * @param {string} publicId
 * @returns {Promise<{ requirement: NonNullable<ReturnType<typeof acceptPublicRequirement>> | null, error: string | null }>}
 */
export const fetchPublicRequirementById = cache(async function fetchPublicRequirementById(
  publicId,
) {
  if (!isPublicRequirementId(publicId)) return { requirement: null, error: null };
  const result = await requestPublicRequirements(`/public/v1/requirements/${publicId}`);
  if (result.status === "not_found") return { requirement: null, error: null };
  if (result.status !== "ok") return { requirement: null, error: "unavailable" };
  const row = acceptPublicRequirement(result.data.requirement);
  if (!row || row.id !== publicId) return { requirement: null, error: null };
  return { requirement: row, error: null };
});
