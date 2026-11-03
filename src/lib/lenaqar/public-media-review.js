/** Reviewed exceptions, not an image classifier. Remove only after source review.
 * MguPxCF0: observed 2026-11-03 on production; photograph of payment schedule
 * conflicts with the listing's hidden financial split. Source storage remains
 * outside this site's control. Ordinary property photos are not suppressed.
 */
const QUARANTINED_ASSETS = new Set([
  "https://api.lenaai.net/gcs/homey_ee175730",
]);

export function mayPublishImage(url) {
  try {
    const parsed = new URL(url);
    const identity = `${parsed.origin}${parsed.pathname.replace(/\/$/, "")}`;
    return !QUARANTINED_ASSETS.has(identity);
  } catch {
    // Existing image validation handles malformed URLs; do not broaden policy.
    return true;
  }
}
