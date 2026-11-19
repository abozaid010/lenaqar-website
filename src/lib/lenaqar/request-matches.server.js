import { API_BASE_URL, PUBLIC_X_API_KEY } from "@/lib/apiConfig";
import { bffFetch } from "@/lib/bffFetch";
import { catalogPlaceAr, enrichOpportunityLabels } from "./arabic-labels.server";
import { isRequestNotFound, matchInfo, requestSummary } from "./request-matches";
import { toPublicOpportunity } from "./to-public-opportunity";
import { isListableOpportunity } from "./validate-unit";
import { normalizeMatchRef } from "./whatsapp-intent";

/** One backend unit → the card the site renders, or null when it is not listable. */
async function toMatchCard(raw) {
  const unit = toPublicOpportunity(raw);
  if (!unit || !isListableOpportunity(unit)) return null;
  const labeled = await enrichOpportunityLabels(unit);
  return { ...labeled, match: matchInfo(raw) };
}

/** Arabic name of a catalog place, from the full catalog map (server-only). */
function withArabicLabel(place) {
  if (place.project) return place;
  return {
    ...place,
    labelAr: catalogPlaceAr(place.sub_district || place.district || place.city),
  };
}

async function toMatchCards(rows) {
  const cards = await Promise.all((Array.isArray(rows) ? rows : []).map(toMatchCard));
  return cards.filter(Boolean);
}

/**
 * The units matching a submitted buy request, for /requests/match/[ref].
 *
 * @param {string} ref the request's match reference from the page URL
 * @returns {Promise<
 *   | {status: "ok", matchRef: string, matches: object[], closest: object[], summary: object}
 *   | {status: "not_found"}
 *   | {status: "unavailable", matchRef: string}
 * >} Never throws: the page always has something to show.
 */
export async function fetchRequestMatches(ref) {
  const matchRef = normalizeMatchRef(ref);
  if (!matchRef) return { status: "not_found" };
  if (!PUBLIC_X_API_KEY) return { status: "unavailable", matchRef };

  try {
    const response = await bffFetch(
      `${API_BASE_URL}/public/v1/buy-request/match/${matchRef}`,
      {
        headers: { accept: "application/json", "X-API-Key": PUBLIC_X_API_KEY },
        cache: "no-store",
      },
    );
    if (response.status === 404) {
      const body = await response.json().catch(() => null);
      return isRequestNotFound(body)
        ? { status: "not_found" }
        : { status: "unavailable", matchRef };
    }
    if (!response.ok) {
      console.error("[lenaqar] request matches failed", response.status);
      return { status: "unavailable", matchRef };
    }
    const data = (await response.json())?.data;
    if (!data || typeof data !== "object" || !Array.isArray(data.matches)) {
      return { status: "unavailable", matchRef };
    }
    const [matches, closest] = await Promise.all([
      toMatchCards(data.matches),
      toMatchCards(data.closest),
    ]);
    const summary = requestSummary(data.requirement);
    return {
      status: "ok",
      matchRef,
      matches,
      closest,
      summary: { ...summary, places: summary.places.map(withArabicLabel) },
    };
  } catch (error) {
    console.error("[lenaqar] request matches failed", error?.name || error);
    return { status: "unavailable", matchRef };
  }
}
