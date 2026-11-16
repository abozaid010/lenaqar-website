/**
 * Share image for a listing page (og:image / twitter:image).
 *
 * Uses the listing's first published photo (already filtered by the public
 * allowlist in to-public-opportunity.js) so WhatsApp, Facebook and other link
 * previews show the unit, not the site logo. Falls back to the logo when the
 * listing has no usable https photo. Photo dimensions are unknown, so none are
 * declared for it.
 */
export function listingShareImages(unit, { fallbackUrl, alt } = {}) {
  const photo = (Array.isArray(unit?.images) ? unit.images : [])
    .map((image) => (typeof image === "string" ? image : image?.url))
    .find((url) => typeof url === "string" && /^https:\/\//i.test(url.trim()));
  if (photo) return [{ url: photo.trim(), alt: alt || "" }];
  return fallbackUrl ? [{ url: fallbackUrl, width: 1200, height: 630, alt: alt || "" }] : [];
}
