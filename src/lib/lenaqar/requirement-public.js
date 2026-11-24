/**
 * Public buyer-request contract shared by the server fetchers, the revalidation route
 * and the share button. Pure (no Next or @/ imports) so `node --test` can load it.
 */

/** Cache tag on every public-requirements fetch; the backend's takedown revalidates it. */
export const PUBLIC_REQUIREMENTS_TAG = "public-requirements";

/**
 * The backend's public id + privacy scheme. A response without it (for example one
 * cached before the scheme changed) is never rendered.
 */
export const PUBLIC_ID_SCHEME = "hmac-v1";

const PUBLIC_ID_RE = /^[a-f0-9]{12}$/;

export function isPublicRequirementId(value) {
  return typeof value === "string" && PUBLIC_ID_RE.test(value);
}

export function requirementPath(publicId) {
  return `/requests/${publicId}`;
}

/** The one canonical link to a buyer request, used by every Share button. */
export function requirementShareUrl(publicId, siteUrl) {
  return `${String(siteUrl || "").replace(/\/+$/, "")}${requirementPath(publicId)}`;
}

/** WhatsApp share with no recipient: the sharer picks the chat. */
export function whatsappShareHref(text, url) {
  const body = [text, url].filter(Boolean).join("\n");
  return `https://wa.me/?text=${encodeURIComponent(body)}`;
}

const text = (value) => (typeof value === "string" ? value : "");

/**
 * The places of a public requirement row (`locations` / `excludedLocations`), each
 * with its Arabic names from `placeAr`. Anything that is not a place object is skipped.
 * @param {unknown} list
 * @param {(name: string) => string} placeAr
 */
export function readPublicPlaces(list, placeAr) {
  if (!Array.isArray(list)) return [];
  return list
    .filter((loc) => loc && typeof loc === "object")
    .map((loc) => {
      const city = text(loc.city);
      const district = text(loc.district);
      const subDistrict = text(loc.subDistrict);
      const project = text(loc.project);
      return {
        city,
        district,
        subDistrict,
        project,
        cityAr: placeAr(city),
        districtAr: placeAr(district),
        subDistrictAr: placeAr(subDistrict),
        projectAr: placeAr(project),
      };
    });
}
