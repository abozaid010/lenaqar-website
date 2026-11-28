/**
 * What the homepage does with a visit, from its hash, query and whether this browser
 * has already seen the onboarding. Pure so `node --test` can cover it.
 *
 * - "journey": an ad click to `/#buy-request` from a first-time visitor. The onboarding
 *   plays, then the buy-request dialog opens (skip opens it at once).
 * - "dialog":  `/#buy-request` otherwise (an internal link, or the visitor has seen the
 *   onboarding): the dialog opens straight away, as before.
 * - "compose": `/#request`: straight to the inline composer.
 * - "seen":    a returning visitor: the composer, no intro.
 * - "intro":   a first visit: the onboarding plays and ends on the composer.
 */

export const BUY_REQUEST_HASH = "#buy-request";
export const COMPOSE_HASH = "#request";

// Campaign landings: UTM tags we add ourselves, or the click ids ad platforms append.
const CAMPAIGN_PARAM = /^(utm_[a-z]+|fbclid|gclid|ttclid)$/i;

export function isCampaignLanding(search) {
  let params;
  try {
    params = new URLSearchParams(String(search || ""));
  } catch {
    return false;
  }
  for (const [key, value] of params) {
    if (CAMPAIGN_PARAM.test(key) && value) return true;
  }
  return false;
}

export function homeLandingMode({ hash = "", search = "", seen = false } = {}) {
  if (hash === BUY_REQUEST_HASH) {
    return !seen && isCampaignLanding(search) ? "journey" : "dialog";
  }
  if (hash === COMPOSE_HASH) return "compose";
  return seen ? "seen" : "intro";
}
