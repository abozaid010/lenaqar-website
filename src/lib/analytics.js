"use client";

import { ANALYTICS } from "@/constants/analytics";
import { LENAQAR_CONTACT } from "@/config/lenaqar-contact";
import {
  trackMetaCompleteRegistration,
  trackMetaContact,
  trackMetaCustom,
  trackMetaLead,
} from "@/lib/meta-pixel";
import { getPageType, sanitizeParams } from "@/lib/analytics-utils";

const digits = (value) => String(value || "").replace(/\D/g, "");

/** Digits-only numbers we own; used to tell a conversion from a share link. */
export const OWN_WHATSAPP = {
  buyer: digits(LENAQAR_CONTACT.whatsappE164),
  network: digits(LENAQAR_CONTACT.networkActivationWhatsappE164),
};

const DEBUG = process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === "1";

// Used only if a click happens before layout.jsx has defined window.gtag.
function queuedGtag() {
  // eslint-disable-next-line prefer-rest-params
  (window.dataLayer = window.dataLayer || []).push(arguments);
}

/** Send one GA4 event. Adds page_type + page_location, strips PII keys. */
export function trackGa(name, params = {}) {
  if (typeof window === "undefined" || !name) return;
  const payload = {
    ...sanitizeParams(params),
    page_type: getPageType(window.location.pathname),
    page_location: window.location.href,
  };
  if (DEBUG) console.info("[analytics:ga]", name, payload);
  (typeof window.gtag === "function" ? window.gtag : queuedGtag)("event", name, payload);
}

export function trackWhatsAppClick({
  intent = "general",
  location = "unknown",
  unitCode,
  leadCode,
  requirementRef,
  source,
} = {}) {
  trackGa(ANALYTICS.EVENTS.WHATSAPP_CLICK, {
    cta_intent: intent,
    cta_location: location,
    unit_code: unitCode,
    lead_code: leadCode,
    requirement_ref: requirementRef,
    source,
  });
  trackMetaContact({ content_name: intent, content_category: location });
}

export function trackBuyRequestSubmitted({ location = "unknown", city } = {}) {
  trackGa(ANALYTICS.EVENTS.BUY_REQUEST_SUBMITTED, { cta_location: location, city });
  trackMetaLead({ content_name: "buyer_request", content_category: "buy" });
}

export function trackSellRequestSubmitted({ location = "unknown", city } = {}) {
  trackGa(ANALYTICS.EVENTS.SELL_REQUEST_SUBMITTED, { cta_location: location, city });
  trackMetaCustom("SellerRequest", { content_name: "seller_request", content_category: "sell" });
}

export function trackNetworkSignup() {
  trackGa(ANALYTICS.EVENTS.NETWORK_SIGNUP_SUBMITTED);
  trackMetaCompleteRegistration({ content_name: "network_signup" });
}

/** kind: "phone" | "email". Only phone is a Meta Contact. */
export function trackContactLink(kind) {
  if (kind === "phone") {
    trackGa(ANALYTICS.EVENTS.PHONE_CLICK);
    trackMetaContact({ content_name: "phone" });
    return;
  }
  trackGa(ANALYTICS.EVENTS.EMAIL_CLICK);
}

export function trackShare({ method, itemId } = {}) {
  trackGa(ANALYTICS.EVENTS.SHARE, { method, content_type: "guide", item_id: itemId });
}
