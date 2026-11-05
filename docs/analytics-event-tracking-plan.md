# LenaQar — Analytics Event Tracking Plan (GA4 + Meta Pixel)

**Repo:** `/Users/abozaid/workspace/lenaqar` (this is lenaqar.com; NOT `lenaAI-website`, which is the CRM)
**Written:** 2026-11-05 · **Verified against:** `82807267` (branch state at write time)
**Audience:** a cheaper LLM executing this plan step by step. Follow the steps literally. If a step says "stop and ask", stop.
**Goal:** (1) measure what visitors do on every button/form so the site can be analysed in GA4, (2) feed Meta Ads clean conversion signals so campaigns can be optimised.

---

## 0. What already exists (do NOT rebuild it)

The owner's pasted "immediate plan" assumed nothing was tracked. That is wrong for this repo. Reality:

| Item | State | File |
|---|---|---|
| GA4 `G-L76Z647950` via `gtag.js` (no GTM) | live | `src/app/layout.jsx` |
| Meta Pixel `846747935139647` | live: `PageView` + `ViewContent` on buyer-intent routes | `src/components/analytics/MetaPixelProvider.jsx`, `src/lib/meta-pixel.js` |
| Meta `Contact` on WhatsApp click | live via a global capture-phase click listener, plus duplicate per-component calls deduped by `trackOncePerEvent` | `MetaPixelProvider.jsx`, `src/lib/meta-contact-events.js` |
| Meta `Lead` on buy-request success | live | `src/components/lenaqar/buy-request-cta.jsx` |
| GA4 custom events | 11 names in use, inconsistent | `src/constants/analytics.js` |

**Do NOT:** add Google Tag Manager (would double-count with the direct `gtag`), add `document.querySelectorAll('a[href*="wa.me"]')` scripts (React re-renders; the delegated listener already handles it), or add a manual `page_view` (GA4 enhanced measurement already sends one per SPA route change; a manual one duplicates).

### Problems found in the current code (this plan fixes them)

| # | Problem | Evidence | Impact |
|---|---|---|---|
| P1 | **False Meta `Contact`**: guide share buttons (`https://wa.me/?text=…`) match the global regex `/wa\.me\|whatsapp\.com/` | `src/lib/meta-pixel.js:99`, `src/components/guides/GuideShareButtons.jsx` | Inflates the conversion you optimise ads on |
| P2 | **Seller form success is logged as `seller_whatsapp_clicked`** and fires no Meta event | `src/components/lenaqar/public-sell-cta.jsx:161` | Sell leads are mislabelled; invisible to Meta |
| P3 | Raw `<a>` WhatsApp links fire Meta only, no GA4 event | `door-landing-content.jsx:48`, `request-composer.jsx:~202` | GA4 undercounts WhatsApp |
| P4 | 5 different event names for the same action (WhatsApp click) and **no params** (which button? which page? which unit?) | `ANALYTICS.EVENTS.*_WHATSAPP_CLICKED` | Cannot tell which button converts |
| P5 | Network events are defined but never fired (`NETWORK_SIGNUP_SUBMITTED`, `NETWORK_LOGIN_SUBMITTED`, `NETWORK_JOIN_CLICKED`) | grep shows only `constants/analytics.js` | Broker funnel blind |
| P6 | Sell opener, `tel:` link, filters, card clicks, share, fallback-shown (backend save failed) are untracked | — | Funnel gaps |
| P7 | Hook `useGoogleAnalytics` re-implements script loading that `layout.jsx` already does and adds a redundant `timestamp` param | `src/hooks/useGoogleAnalytics.js` | Duplicate code path |
| P8 | Existing doc says "do not optimise on WhatsApp taps"; owner now says WhatsApp click IS the main conversion | `docs/ads-utm-and-conversion.md` | Doc contradicts strategy (fixed in Phase 4) |

### Observation to report to the owner (do not fix in this plan)
`door-landing-content.jsx` (pages `/no-calls`, `/delivery-delays`, `/before-you-pay`, `/verified-prices`) is buyer-facing but its WhatsApp button uses the **seller** prefilled message (`sellerCtaHref()`). Tracking will truthfully record `cta_intent=sell` for it. Mention it in the final report.

---

## 1. Decisions already made (owner may veto before execution)

1. **One canonical GA4 event for every WhatsApp click: `whatsapp_click`**, with params `cta_intent` and `cta_location`. The 5 legacy WhatsApp event names are retired (removed in Phase 4). If the owner already marked a legacy name as a GA4 *Key event*, keep it marked for 30 days, then unmark.
2. **Primary conversion = WhatsApp click** (volume) → Meta `Contact`, GA4 `whatsapp_click`. **Quality conversion = buy request submitted** → Meta `Lead`, GA4 `buy_request_submitted`. Both are Key events.
3. **Meta `Lead` stays buyer-only** (ads are buyer-focused). Sell form → Meta *custom* event `SellerRequest`; network signup → Meta standard `CompleteRegistration`. GA4: `sell_request_submitted`, `network_signup_submitted`.
4. Keep existing GA4 names that are already fine: `buy_request_opened`, `buy_request_submitted`, `unit_viewed`, `calculator_used`.
5. **No PII, ever**, in any event param (no phone, name, email, message text, free-text notes). Budget is sent as a bucket, never exact.
6. No new npm dependencies. No UI strings added (so no `translate()` keys needed).

---

## 2. Rules for the executor

- Read `CLAUDE.md` and `WEBSITE_ARCHITECTURE.md` in the repo first. Follow DRY / YAGNI / KISS; touch only files listed here.
- Work on a new branch `analytics/event-tracking` cut from the current HEAD (tree was clean at write time; the checked-out branch was `random-branch-name-2026-11-04-20-57-32`, so confirm `git status` is clean first). **One commit per phase.** Never force-push, never reset, preserve stashes.
- **NEVER submit a real form (buy / sell / network signup) and never send a real WhatsApp message during QA.** Opening a `wa.me` tab by clicking is fine (nothing is sent). Verify submit-path events by code reading + unit tests only. The owner does the one real test after deploy (§9).
- Use `.env.local` only for `NEXT_PUBLIC_ANALYTICS_DEBUG=1`. Never commit `.env.local`.
- Run after every phase: `npm run lint` and `node --test src/lib/__tests__/ src/lib/lenaqar/__tests__/`. After Phase 4 also `npm run build`.
- If a snippet in this plan does not match the real file (line moved, name changed), re-read the file and adapt; if the intent is unclear, stop and ask.

---

## 3. Final event taxonomy

Every GA4 event automatically gets `page_type` and `page_location` (added centrally in `trackGa`). `page_type` ∈ `home, opportunities_list, opportunity_detail, sell, calculator, how_it_works, guide, network, buyer_landing, door_landing, privacy, other`.

### 3.1 Conversions (mark as GA4 Key events)

| GA4 event | Meta event | Fires when | Params |
|---|---|---|---|
| `whatsapp_click` | `Contact` {content_name=intent, content_category=location} | Click on any WhatsApp link to the buyer or network number (not share links); also composer send and fallback auto-redirect | `cta_intent` (`buy`/`sell`/`network`/`guide`/`general`), `cta_location`, `unit_code?`, `lead_code?`, `requirement_ref?`, `source?` (`auto_redirect`) |
| `buy_request_submitted` | `Lead` {content_name=buyer_request, content_category=buy} | Buy-request saved successfully | `cta_location`, `city?` |

### 3.2 Secondary conversions

| GA4 event | Meta event | Fires when | Params |
|---|---|---|---|
| `sell_request_submitted` | custom `SellerRequest` | Sell form saved successfully | `cta_location`, `city?` |
| `network_signup_submitted` | `CompleteRegistration` | Broker signup saved | — |
| `network_login_submitted` | — | Broker login accepted or pending | `result` (`active`/`pending`) |
| `phone_click` | `Contact` {content_name=phone} | Click on a `tel:` link | — |
| `email_click` | — | Click on a `mailto:` link | — |

### 3.3 Funnel / engagement (not conversions)

| GA4 event | Fires when | Params |
|---|---|---|
| `buy_request_opened` | Buy dialog opened (button, `#buy-request` hash, composer form path) | `cta_location` |
| `sell_request_opened` | Sell dialog opened (**new**) | `cta_location` |
| `form_fallback_shown` | Save failed and the WhatsApp fallback panel appeared (**backend failure detector**) | `form_id` (`buy_request`/`sell_request`/`network_signup`) |
| `cta_click` | Click on any element with `data-track="<id>"` (nav, network, calculator links, opportunity cards) | `cta_id`, `cta_location`, `destination`, `unit_code?` |
| `opportunity_filter_applied` | Filters form submitted (replaces `cash_entered`) | `city?`, `district?`, `has_delivery`, `cash_bucket` |
| `unit_viewed` | Opportunity detail page loaded (unchanged) | `unit_code` |
| `calculator_used` | Calculator submitted with valid input (unchanged) | `unit_price`, `amount_paid` |
| `share` | Guide share button clicked (GA4 recommended name) | `method` (`whatsapp`/`facebook`), `content_type=guide`, `item_id` |
| `language_switched` | Language toggle | `language` |
| `onboarding_skipped` | "Skip" on the home intro | `scene` |

### 3.4 Param registry (GA4 custom dimensions to create, see §9)
`cta_intent`, `cta_location`, `cta_id`, `page_type`, `unit_code`, `lead_code`, `form_id`, `cash_bucket`, `city`, `method`, `language`.

### 3.5 `cta_location` vocabulary (use exactly these strings)
`header_desktop`, `header_mobile`, `sticky_bar`, `footer`, `classic_home`, `commission_block`, `home_composer`, `home_composer_resend`, `sell_page`, `how_it_works`, `how_it_works_hero`, `how_it_works_mid`, `door_hero`, `door_closing`, `buyer_landing_hero`, `buyer_landing_requests`, `buyer_guide`, `opportunities_page`, `opportunities_empty`, `opportunity_card`, `opportunity_detail`, `requirement_card`, `calculator`, `guide_inline`, `guide_box`, `guide_sticky`, `form_fallback`, `network_activation`, `unknown` (default; any `unknown` in GA4 reports = a missed call site).

---

## 4. Phase 1 — Foundation (new modules, no call-site changes yet)

### 4.1 Create `src/lib/analytics-utils.js` (pure; verified with `node --test`)

```js
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
```

### 4.2 Create `src/lib/__tests__/analytics-utils.test.js`

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  cashBucket,
  classifyWhatsAppHref,
  getPageType,
  sanitizeParams,
} from "./analytics-utils.js";

const own = { buyer: "201002891933", network: "201016080323" };

test("getPageType maps routes", () => {
  assert.equal(getPageType("/"), "home");
  assert.equal(getPageType("/opportunities"), "opportunities_list");
  assert.equal(getPageType("/opportunities/ABC-1"), "opportunity_detail");
  assert.equal(getPageType("/sell/"), "sell");
  assert.equal(getPageType("/guides/new-cairo/x"), "guide");
  assert.equal(getPageType("/network/signup"), "network");
  assert.equal(getPageType("/apartments-for-sale/madinaty"), "buyer_landing");
  assert.equal(getPageType("/villas-for-sale/egypt"), "buyer_landing");
  assert.equal(getPageType("/ready-to-move-properties"), "buyer_landing");
  assert.equal(getPageType("/no-calls"), "door_landing");
  assert.equal(getPageType("/whatever"), "other");
  assert.equal(getPageType(undefined), "home");
});

test("classifyWhatsAppHref separates contact, share and non-WhatsApp", () => {
  assert.equal(classifyWhatsAppHref("https://example.com/x", own), null);
  assert.equal(classifyWhatsAppHref("tel:+201002891933", own), null);
  assert.deepEqual(classifyWhatsAppHref("https://wa.me/?text=hello", own), { kind: "share" });
  assert.deepEqual(classifyWhatsAppHref("https://api.whatsapp.com/send?text=hi", own), {
    kind: "share",
  });
  assert.deepEqual(classifyWhatsAppHref("https://wa.me/201002891933?text=%D9%85", own), {
    kind: "contact",
    target: "buyer",
  });
  assert.deepEqual(classifyWhatsAppHref("https://wa.me/201016080323", own), {
    kind: "contact",
    target: "network",
  });
  assert.deepEqual(classifyWhatsAppHref("https://api.whatsapp.com/send?phone=201002891933", own), {
    kind: "contact",
    target: "buyer",
  });
  assert.deepEqual(classifyWhatsAppHref("https://wa.me/15551234567", own), {
    kind: "contact",
    target: "other",
  });
});

test("sanitizeParams strips PII keys and empty values, caps length", () => {
  const out = sanitizeParams({
    cta_intent: "buy",
    phone: "0100",
    email: "a@b.c",
    unit_code: "",
    n: 3,
    ok: false,
    long: "x".repeat(300),
    skip: undefined,
  });
  assert.deepEqual(Object.keys(out).sort(), ["cta_intent", "long", "n", "ok"]);
  assert.equal(out.long.length, 100);
});

test("cashBucket", () => {
  assert.equal(cashBucket(""), "none");
  assert.equal(cashBucket("abc"), "none");
  assert.equal(cashBucket(499_999), "lt_500k");
  assert.equal(cashBucket(500_000), "500k_1m");
  assert.equal(cashBucket("1500000"), "1m_2m");
  assert.equal(cashBucket(2_000_000), "2m_5m");
  assert.equal(cashBucket(9_000_000), "gte_5m");
});
```
Run: `node --test src/lib/__tests__/analytics-utils.test.js` → must show 4 passing.

### 4.3 Edit `src/constants/analytics.js`

Add these keys inside `ANALYTICS.EVENTS` (keep the existing ones for now; they are removed in Phase 4):

```js
    WHATSAPP_CLICK: 'whatsapp_click',
    SELL_REQUEST_OPENED: 'sell_request_opened',
    SELL_REQUEST_SUBMITTED: 'sell_request_submitted',
    FORM_FALLBACK_SHOWN: 'form_fallback_shown',
    CTA_CLICK: 'cta_click',
    OPPORTUNITY_FILTER_APPLIED: 'opportunity_filter_applied',
    PHONE_CLICK: 'phone_click',
    EMAIL_CLICK: 'email_click',
    SHARE: 'share',
    LANGUAGE_SWITCHED: 'language_switched',
    ONBOARDING_SKIPPED: 'onboarding_skipped',
```

Add to `META_PIXEL.EVENTS`: `COMPLETE_REGISTRATION: 'CompleteRegistration',`

Append at the end of the file:

```js
export const FORM_IDS = {
  BUY_REQUEST: 'buy_request',
  SELL_REQUEST: 'sell_request',
  NETWORK_SIGNUP: 'network_signup',
};

/** form_id -> cta_intent used when that form's WhatsApp fallback is opened. */
export const FORM_INTENT = {
  buy_request: 'buy',
  sell_request: 'sell',
  network_signup: 'network',
};
```

### 4.4 Edit `src/lib/meta-pixel.js`

1. In `runFbq`, add a debug log (dev verification aid) so it reads:

```js
function runFbq(...args) {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return;
  if (process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === '1') console.info('[analytics:meta]', ...args);
  window.fbq(...args);
}
```

2. Add (next to `trackMetaLead`):

```js
export async function trackMetaCustom(name, params = {}) {
  if (!isMetaPixelEnabled()) return;
  await initMetaPixel();
  runFbq('trackCustom', name, params);
}

export async function trackMetaCompleteRegistration(params = {}) {
  if (!isMetaPixelEnabled()) return;
  await initMetaPixel();
  runFbq('track', META_PIXEL.EVENTS.COMPLETE_REGISTRATION, params);
}
```

(Leave `trackMetaContactForClick` / `isWhatsAppClickTarget` for now; removed in Phase 4.)

### 4.5 Create `src/lib/analytics.js` (the single client API — every call site uses this)

```js
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
```

### 4.6 Replace `src/hooks/useGoogleAnalytics.js` with a thin wrapper
Before replacing: `grep -rn "initializeGA\|trackPageView\|isInitialized" src` — expect matches only inside the hook itself. If anything else uses them, stop and ask.

```js
'use client';

import { trackGa } from '@/lib/analytics';

/**
 * Kept so existing call sites (`const { trackEvent } = useGoogleAnalytics()`) keep working.
 * gtag.js is loaded once in src/app/layout.jsx; this hook no longer loads scripts.
 * trackGa is a module-level function, so its identity is stable across renders.
 */
export function useGoogleAnalytics() {
  return { trackEvent: trackGa };
}
```

### 4.7 Create `src/components/analytics/ClickTracker.jsx`

One delegated listener replaces the Meta-only one. Components only add `data-*` attributes.

```jsx
"use client";

import { useEffect } from "react";
import { ANALYTICS } from "@/constants/analytics";
import {
  OWN_WHATSAPP,
  trackContactLink,
  trackGa,
  trackShare,
  trackWhatsAppClick,
} from "@/lib/analytics";
import { classifyWhatsAppHref } from "@/lib/analytics-utils";

/**
 * Data attributes read from the clicked element (all optional):
 *   data-cta-intent, data-cta-location, data-unit-code, data-lead-code,
 *   data-requirement-ref, data-share-method, data-share-item, data-track (generic cta_click id)
 */
export default function ClickTracker() {
  useEffect(() => {
    const onClick = (event) => {
      if (!(event.target instanceof Element)) return;
      const el = event.target.closest("a[href], [data-track]");
      if (!el) return;
      const d = el.dataset;
      const href = el.getAttribute("href") || "";

      if (href.startsWith("tel:")) return trackContactLink("phone");
      if (href.startsWith("mailto:")) return trackContactLink("email");
      if (d.shareMethod) return trackShare({ method: d.shareMethod, itemId: d.shareItem });

      const wa = classifyWhatsAppHref(href, OWN_WHATSAPP);
      if (wa?.kind === "contact" && wa.target !== "other") {
        return trackWhatsAppClick({
          intent: d.ctaIntent || (wa.target === "network" ? "network" : "general"),
          location: d.ctaLocation,
          unitCode: d.unitCode,
          leadCode: d.leadCode,
          requirementRef: d.requirementRef,
        });
      }

      if (d.track) {
        trackGa(ANALYTICS.EVENTS.CTA_CLICK, {
          cta_id: d.track,
          cta_location: d.ctaLocation,
          destination: href || undefined,
          unit_code: d.unitCode,
        });
      }
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
```

### 4.8 Wire it in
- `src/app/layout.jsx`: add `import ClickTracker from "@/components/analytics/ClickTracker";` and render `<ClickTracker />` immediately before `<MetaPixelProvider>` (inside `TanStackQueryProvider`).
- `src/components/analytics/MetaPixelProvider.jsx`: **delete the third `useEffect`** (the one registering `handleClick`) and remove the now-unused imports `isWhatsAppClickTarget` and `trackMetaContactForClick`.

> After 4.8 and until Phase 2 is done, component-level `trackMetaContactForClick(...)` calls still exist. A WhatsApp anchor click would then fire Contact via the component AND via ClickTracker. That is expected for the duration of the branch; Phase 2 removes the component calls. Do not ship Phase 1 alone.

**Phase 1 done when:** utils tests pass, lint passes, `npm run dev` starts, no console errors. Commit: `feat(analytics): central trackGa API, ClickTracker, pure helpers`.

---

## 5. Phase 2 — Migrate every WhatsApp call site

Goal: every WhatsApp anchor carries `data-cta-intent` + `data-cta-location`; **no component calls `trackEvent`/`trackMeta*` for a WhatsApp link click any more** (ClickTracker does it). Non-anchor flows call `trackWhatsAppClick` directly.

### 5.1 `src/components/lenaqar/whatsapp-cta.jsx`
- Remove imports of `useGoogleAnalytics` and `trackMetaContactForClick`, and the `trackEvent` line.
- Replace prop `eventName` with `intent = "general"`, `location`, `unitCode`, `requirementRef`.
- `handleClick` keeps ONLY the `window.open` logic (delete the two tracking lines).
- On the `<a>` add: `data-cta-intent={intent} data-cta-location={location} data-unit-code={unitCode} data-requirement-ref={requirementRef}`.

### 5.2 Call sites of `<WhatsAppCta>` (replace `eventName={…}`)

| File | New props |
|---|---|
| `src/app/(lenaqar)/sell/sell-page-content.jsx` (~L61) | `intent="sell" location="sell_page"` |
| `src/components/lenaqar/home-content.jsx` (~L92) | `intent="sell" location="classic_home"` |
| `src/components/lenaqar/how-it-works-content.jsx` (~L137) | `intent="sell" location="how_it_works"` |
| `src/components/lenaqar/requirement-card.jsx` (~L168) | `intent="sell" location="requirement_card" requirementRef={requirement.id}` |
| `src/components/lenaqar/exit-calculator.jsx` (~L156) | `intent="sell" location="calculator"` |
| `src/components/lenaqar/marketplace-home-content.jsx` (~L344) | `intent="sell" location="classic_home"` (file has no importers; edit only so the removed constant is not referenced) |
| `src/components/lenaqar/opportunity-unit-actions.jsx` | add prop `location = "opportunity_card"`; pass `intent="buy" location={location} unitCode={unit.code}` |
| `src/app/(lenaqar)/opportunities/[slug]/opportunity-detail-content.jsx` (~L235) | `<OpportunityUnitActions unit={unit} location="opportunity_detail" />` |

After editing, remove now-unused `ANALYTICS` imports in those files (lint will tell you).

### 5.3 Raw anchors (add attributes, remove handlers)

| File | Change |
|---|---|
| `lenaqar-footer.jsx` (anchor ~L46 and ~L113) | Delete both `onClick` handlers, the `contactEvent` const, `useGoogleAnalytics`, `trackMetaContactForClick`, `ANALYTICS` imports if unused. Add `data-cta-intent={isSellPage ? "sell" : "buy"} data-cta-location="footer"` to both anchors. |
| `door-landing-content.jsx` (anchor ~L48) | add `data-cta-intent="sell" data-cta-location="door_hero"` |
| `guides/GuideWhatsAppCta.jsx` | Delete `onClick`, `useGoogleAnalytics`, `ANALYTICS` imports and the `data-analytics` attr. Add `data-cta-intent="guide" data-cta-location={compact ? "guide_inline" : "guide_box"}`. Keep `data-lead-code`. |
| `guides/GuideStickyWhatsApp.jsx` | Same: delete `onClick` + imports + `data-analytics`; add `data-cta-intent="guide" data-cta-location="guide_sticky"`; keep `data-lead-code`. |
| `guides/GuideShareButtons.jsx` | Add `data-share-method="whatsapp" data-share-item={slug}` to the WhatsApp anchor and `data-share-method="facebook" data-share-item={slug}` to the Facebook anchor. (This is the P1 fix: ClickTracker checks `shareMethod` before WhatsApp.) |

### 5.4 Non-anchor / timer flows (call the API directly)

| File | Change |
|---|---|
| `request-composer.jsx` `handleWhatsApp` | Replace `trackEvent(BUYER_WHATSAPP_CLICKED)` + `trackMetaContactForClick(event)` with `trackWhatsAppClick({ intent: "buy", location: "home_composer" })`. On the `sentHref` anchor (~L202) add `data-cta-intent="buy" data-cta-location="home_composer_resend"`. Remove the `trackMetaContactForClick` import. Keep `trackEvent` (still used for `BUY_REQUEST_OPENED`). |
| `submit-whatsapp-fallback.jsx` | Add prop `formId`. Auto-redirect timer: replace `trackMetaContact()` with `trackWhatsAppClick({ intent: FORM_INTENT[formId] || "general", location: "form_fallback", source: "auto_redirect" })`. Anchor: delete the tracking call in `onClick` (keep `redirectedRef.current = true; onRedirect?.()`), add `data-cta-intent={FORM_INTENT[formId] || "general"} data-cta-location="form_fallback"`. Remove `meta-pixel` import; import `FORM_INTENT` from `@/constants/analytics` and `trackWhatsAppClick` from `@/lib/analytics`. |
| callers of `SubmitWhatsAppFallback` | `buy-request-dialog.jsx` (~L495): `formId={FORM_IDS.BUY_REQUEST}`; `public-sell-cta.jsx` (~L194): `formId={FORM_IDS.SELL_REQUEST}`; `network-signup-form.jsx` (~L139): `formId={FORM_IDS.NETWORK_SIGNUP}` (import `FORM_IDS` from `@/constants/analytics`) |
| `network-activation-whatsapp.jsx` | Timer: replace `trackMetaContact()` + `trackEvent(NETWORK_ACTIVATION_WHATSAPP_CLICKED)` with `trackWhatsAppClick({ intent: "network", location: "network_activation", source: "auto_redirect" })`. `markOpened`: keep only `redirectedRef.current = true;`. Add `data-cta-intent="network" data-cta-location="network_activation"` to the anchor. Remove `useGoogleAnalytics`, `ANALYTICS`, `meta-pixel` imports and `trackEvent` from the effect deps. |

**Phase 2 done when:** `grep -rn "trackMetaContactForClick\|_WHATSAPP_CLICKED\|CLICK_WHATSAPP\|NETWORK_ACTIVATION_WHATSAPP_CLICKED" src --include='*.jsx' --include='*.js'` returns only `meta-pixel.js`, `meta-contact-events` files and `constants/analytics.js`. Lint passes. Commit: `feat(analytics): single whatsapp_click event with intent/location`.

---

## 6. Phase 3 — Lead, form and funnel events

### 6.1 `buy-request-cta.jsx`
- Add prop `trackingLocation = "unknown"`.
- Both `trackEvent(ANALYTICS.EVENTS.BUY_REQUEST_OPENED)` calls (hash handler ~L100 and button onClick ~L150) become `trackEvent(ANALYTICS.EVENTS.BUY_REQUEST_OPENED, { cta_location: trackingLocation })` (add `trackingLocation` to the `useEffect` deps).
- In `onSuccess`: replace `trackEvent(BUY_REQUEST_SUBMITTED)` and `trackMetaLead(...)` with `trackBuyRequestSubmitted({ location: trackingLocation, city: requirement?.city })`. Import from `@/lib/analytics`; remove the `trackMetaLead` import. If `requirement.city` is not a short string when you log it in dev, omit `city`.

### 6.2 `public-sell-cta.jsx`
- Add prop `trackingLocation = "unknown"`.
- Opener `onClick={() => setOpen(true)}` → `onClick={() => { trackEvent(ANALYTICS.EVENTS.SELL_REQUEST_OPENED, { cta_location: trackingLocation }); setOpen(true); }}`.
- Success path (~L161): replace `trackEvent(ANALYTICS.EVENTS.SELLER_WHATSAPP_CLICKED)` with `trackSellRequestSubmitted({ location: trackingLocation, city: form.city })`. **This fixes P2.**

### 6.3 Pass `trackingLocation` from every opener

| File : line | Component | Value |
|---|---|---|
| `lenaqar-header.jsx` ~L63 | BuyRequestCta | `trackingLocation="header_desktop"` |
| `lenaqar-header.jsx` ~L102 | BuyRequestCta | `trackingLocation="header_mobile"` |
| `core-actions.jsx` | add prop `location = "core_actions"`; pass as `trackingLocation={location}` to BOTH `PublicSellCta` and `BuyRequestCta` | — |
| `sticky-whatsapp-bar.jsx` | `<CoreActions … location="sticky_bar" />` | |
| `home-content.jsx` ~L46 | `<CoreActions … location="classic_home" />` | |
| `commission-block.jsx` ~L59 | `<CoreActions … location="commission_block" />` | |
| `sell-page-content.jsx` ~L57 | PublicSellCta | `trackingLocation="sell_page"` |
| `door-landing-content.jsx` ~L42 / ~L158 | BuyRequestCta | `door_hero` / `door_closing` |
| `how-it-works-content.jsx` ~L103 / ~L114 | BuyRequestCta | `how_it_works_hero` / `how_it_works_mid` |
| `buyer-landing-content.jsx` ~L28 / ~L72 | BuyRequestCta | `buyer_landing_hero` / `buyer_landing_requests` |
| `buyer-guide-content.jsx` ~L42 | BuyRequestCta | `buyer_guide` |
| `opportunities-page-content.jsx` ~L32 | BuyRequestCta | `opportunities_page` |
| `opportunities-empty.jsx` ~L27 | BuyRequestCta | `opportunities_empty` |
| `request-composer.jsx` ~L228 | BuyRequestCta | `trackingLocation="home_composer"`; also change its own `trackEvent(BUY_REQUEST_OPENED)` (~L88) to pass `{ cta_location: "home_composer" }` |

### 6.4 `submit-whatsapp-fallback.jsx` — failure detector
Add an effect: when `href` becomes truthy, `trackGa(ANALYTICS.EVENTS.FORM_FALLBACK_SHOWN, { form_id: formId })`. Alert the owner in the final report if this fires during any QA (it means a save failed).

### 6.5 Network funnel
- `network-signup-form.jsx`: after `saveNetworkSignupSnapshot(snapshot);` and before `router.push`, call `trackNetworkSignup()` (import from `@/lib/analytics`).
- `network-login-form.jsx`: `result?.ok` branch → `trackGa(ANALYTICS.EVENTS.NETWORK_LOGIN_SUBMITTED, { result: "active" })`; `result?.code === "pending"` branch → `{ result: "pending" }`. Do not track failures.
- Add `data-track` (generic `cta_click`) to these links: `network-landing.jsx` L54 and L185 (`data-track="network_signup" data-cta-location="network_landing"`), L61 (`data-track="network_login" data-cta-location="network_landing"`); `network-broker-cta.jsx` L31 (`data-track="network_join" data-cta-location="broker_cta"`); `lenaqar-footer.jsx` link to `/network` (~L159: `data-track="network_join" data-cta-location="footer"`).

### 6.6 Navigation and card clicks (`cta_click`)
- `lenaqar-header.jsx`: in BOTH `routeLinks.map` `<Link>`s add `data-track="nav_link" data-cta-location="header"` (the `destination` param tells which link).
- `opportunity-card.jsx`: both `<Link href={href}>` (image ~L46, title ~L69) add `data-track="opportunity_card" data-cta-location="opportunities_list" data-unit-code={unit.code}`.
- Calculator links: `door-landing-content.jsx` ~L37, `comparison-block.jsx` ~L69, `lenaqar-footer.jsx` ~L86 add `data-track="calculator_link"` and `data-cta-location` = `door_hero` / `comparison_block` / `footer`.

### 6.7 Filters (`opportunity-filters.jsx`)
Replace the `if (nextCash !== "") { trackEvent(CASH_ENTERED …) }` block in `onSubmit` with an unconditional:

```js
const delivery = String(form.get("delivery") || "").trim();
trackEvent(ANALYTICS.EVENTS.OPPORTUNITY_FILTER_APPLIED, {
  city: location.city,
  district: location.district,
  has_delivery: Boolean(delivery),
  cash_bucket: cashBucket(nextCash),
});
```
(import `cashBucket` from `@/lib/analytics-utils`; reuse the `delivery` variable in the `apply({...})` call below instead of re-reading it.) If `location.city` is an object rather than a string, send nothing for it.

### 6.8 Small ones
- `language-switch.jsx`: inside `onClick`, first line `trackGa(ANALYTICS.EVENTS.LANGUAGE_SWITCHED, { language: next });`
- `home-onboarding.jsx`: `skip` becomes `useCallback(() => { trackGa(ANALYTICS.EVENTS.ONBOARDING_SKIPPED, { scene }); goTo(COMPOSE, { focus: true }); }, [goTo, scene])`.
- `unit-view-tracker.jsx`, `exit-calculator.jsx` (`calculator_used`): **no change** (hook wrapper keeps them working).
- Footer `tel:` / `mailto:` links: **no change** (ClickTracker handles them).

**Phase 3 done when:** lint passes; `grep -rn "CASH_ENTERED\|SELLER_WHATSAPP_CLICKED" src` hits only `constants/analytics.js`. Commit: `feat(analytics): lead, funnel and navigation events`.

---

## 7. Phase 4 — Cleanup and docs

1. Remove from `ANALYTICS.EVENTS` (all unused after Phases 2–3): `DEEP_LINK_ATTEMPT`, `DOWNLOAD_CLICK`, `DOWNLOAD_PAGE_VIEW`, `CAMPAIGN_ARRIVAL`, `APP_STORE_CLICK`, `CASH_ENTERED`, `SELLER_WHATSAPP_CLICKED`, `BUYER_WHATSAPP_CLICKED`, `MARKETPLACE_WHATSAPP_CLICKED`, `CLICK_WHATSAPP`, `NETWORK_JOIN_CLICKED`, `NETWORK_ACTIVATION_WHATSAPP_CLICKED`. Before deleting each, `grep -rn "<NAME>" src` must show only the definition.
2. Remove from `src/lib/meta-pixel.js`: `trackMetaContactForClick`, `isWhatsAppClickTarget`, and the `trackOncePerEvent` import. Then run `node scripts/orphan-scan.mjs` (the repo's only approved orphan check). If it flags `src/lib/meta-contact-events.js` and its test as orphans, delete both.
3. Rewrite the event map in `docs/ads-utm-and-conversion.md` to match §3 of this plan; change the header line to: *Primary conversion: WhatsApp click (`whatsapp_click` / Meta `Contact`). Quality conversion: `buy_request_submitted` / Meta `Lead`.* Keep the UTM convention section; add the Meta dynamic-parameter string from §9.3.
4. In `docs/ads-utm-and-conversion.md`, do not copy the §3 tables; link to `docs/analytics-event-tracking-plan.md` instead (DRY).
5. Run `npm run lint`, `node --test src/lib/__tests__/ src/lib/lenaqar/__tests__/`, `npm run build`. All must pass.

Commit: `chore(analytics): retire legacy events, update ads doc`.

---

## 8. Phase 5 — Verification (browser, no real submissions)

Setup: add `NEXT_PUBLIC_ANALYTICS_DEBUG=1` to `.env.local`, run `npm run dev`, open the site, open the browser console. Every event prints `[analytics:ga] <name> {…}` and every Meta call prints `[analytics:meta] …`.

**Rule: each user action must print exactly ONE `[analytics:ga]` line for its event and at most ONE matching `[analytics:meta]` line. Two lines = double-fire bug; zero = missed call site.**

| # | Action | Expected GA | Expected Meta |
|---|---|---|---|
| 1 | Load `/` | GA auto `page_view` (not printed by our code) | `track PageView`, `track ViewContent` |
| 2 | Footer WhatsApp link on `/` | `whatsapp_click` `cta_intent=buy cta_location=footer page_type=home` | `track Contact` |
| 3 | Footer WhatsApp link on `/sell` | `whatsapp_click` `cta_intent=sell` | `track Contact` |
| 4 | Any guide page: click **Share on WhatsApp** | `share method=whatsapp item_id=…`; **no** `whatsapp_click` | **no** `Contact` |
| 5 | Guide page: click inline/box WhatsApp CTA | `whatsapp_click cta_intent=guide cta_location=guide_inline|guide_box lead_code=…` | `Contact` |
| 6 | `/opportunities`: click a card's WhatsApp button | `whatsapp_click cta_location=opportunity_card unit_code=…` | `Contact` |
| 7 | `/opportunities`: click a card image | `cta_click cta_id=opportunity_card unit_code=…` | none |
| 8 | Open a detail page | `unit_viewed unit_code=…` | `ViewContent` (existing) |
| 9 | Detail page WhatsApp button | `whatsapp_click cta_location=opportunity_detail` | `Contact` |
| 10 | Header "Buy" button (desktop, then mobile width 375) | `buy_request_opened cta_location=header_desktop` / `header_mobile` | none |
| 11 | Any "Sell" opener (e.g. `/sell`) | `sell_request_opened cta_location=sell_page` | none |
| 12 | Home composer: type ≥20 chars, press WhatsApp send (a `wa.me` tab opens; send nothing) | `whatsapp_click cta_intent=buy cta_location=home_composer` | `Contact` |
| 13 | Footer `tel:` link (desktop footer) | `phone_click` | `Contact` |
| 14 | `/opportunities`: submit filters | `opportunity_filter_applied cash_bucket=…` | none |
| 15 | `/network`: click signup link | `cta_click cta_id=network_signup` | none |
| 16 | Language toggle | `language_switched language=en|ar` | none |
| 17 | Header nav link | `cta_click cta_id=nav_link cta_location=header destination=/…` | none |

Forms (buy / sell / network signup / login): **do not submit.** Instead (a) read the success branches and confirm each calls exactly one helper (`trackBuyRequestSubmitted`, `trackSellRequestSubmitted`, `trackNetworkSignup`, `trackGa(NETWORK_LOGIN_SUBMITTED)`); (b) confirm no `trackMetaLead` call remains outside `src/lib/analytics.js`: `grep -rn "trackMetaLead" src`.

Final checks:
- `grep -rn "cta_location: \"unknown\"\|location=\"unknown\"" src` → none (defaults are fine; explicit "unknown" is not).
- Search every `[analytics:ga]` line you produced for `cta_location=unknown`; each hit is a missed `data-cta-location`.
- Remove `NEXT_PUBLIC_ANALYTICS_DEBUG` from `.env.local` when finished.

### Report format (≤15 lines)
`Done` (files changed per phase) · `Verified` (table rows 1–17 pass/fail) · `Found` (anything unexpected, incl. the door-landing seller-message note) · `Needs owner` (§9).

---

## 9. Owner checklist (non-code, ~30 min, after deploy)

### 9.1 GA4 (Admin)
1. **Custom definitions → Create custom dimension** (scope: Event) for each of: `cta_intent`, `cta_location`, `cta_id`, `page_type`, `unit_code`, `lead_code`, `form_id`, `cash_bucket`, `city`, `method`, `language`. Data appears 24–48 h after creation.
2. **Events → mark as Key event:** `whatsapp_click`, `buy_request_submitted`. Optional: `sell_request_submitted`, `network_signup_submitted`.
3. **Data stream → Enhanced measurement → ⚙:** keep Page views and "Page changes based on browser history events" ON (this gives SPA page views). Turn **Form interactions OFF** (auto `form_start`/`form_submit` add noise next to our events).
4. **Data settings → Data retention:** set event data retention to 14 months.
5. **Data stream → Configure tag settings → Define internal traffic:** add your own IP(s) so testing does not pollute data, then activate the "Internal Traffic" data filter.
6. Optional (no code): *Admin → Events → Create event* `whatsapp_click_buyer` when `event_name = whatsapp_click` AND `cta_intent = buy`, so buyer-only WhatsApp clicks can be a separate Key event.
7. Test: open GA4 → **DebugView**, then visit the site with the GA Debugger Chrome extension on and run table rows 2, 5, 6.

### 9.2 Meta (Events Manager)
1. **Test Events tab** → enter `https://www.lenaqar.com` → in the opened window do table rows 1, 2, 4 (must NOT log Contact), 13. Expect `PageView`, `ViewContent`, `Contact`.
2. Pixel → **Settings → Automatic Advanced Matching → ON**.
3. After deploy, do **one** real test buy-request with a clearly fake name ("TEST – ignore") and confirm `Lead` appears in Test Events; then tell the sales side to delete that record.
4. **Verify domain** `lenaqar.com` in Business Settings → Brand Safety → Domains (needed to configure and prioritise events).
5. Check the custom event `SellerRequest` appears after one test sell submission (same TEST convention).

### 9.3 Ads Manager — make the data useful
- On every ad, **URL parameters** field:
  `utm_source=meta&utm_medium=paid_social&utm_campaign={{campaign.name}}&utm_content={{ad.name}}&utm_term={{adset.name}}`
  (keep names lowercase, no spaces; matches the convention in `docs/ads-utm-and-conversion.md`). GA4 then splits `whatsapp_click` / `buy_request_submitted` by campaign and ad.
- Campaign setup → Conversion location **Website** → Conversion event: start with **Contact** (higher volume, gets out of the learning phase faster; target ≈50 events/week per ad set). When `buy_request_submitted` / `Lead` reaches that volume, move to **Lead**.
- Judge ads by cost per `Contact` **and** cost per `Lead`, not by link clicks.
- Weekly check in GA4 Explore (free-form): rows `cta_location`, columns `cta_intent`, values event count of `whatsapp_click`; second table by `utm_campaign`. Anything with large `unknown` = missed call site → open a ticket.

---

## 10. Out of scope (do not do unless the owner asks)

- Meta Conversions API / server-side events and `fbc`/`fbp` capture into lead payloads (needs backend changes in `/Users/abozaid/workspace/LENAAI-Agent`; the backend would store UTM + click IDs per lead so WhatsApp-originated leads can be attributed).
- Campaign tag inside the prefilled WhatsApp text (e.g. `ref:meta_madinaty`): affects the WhatsApp agent parser in `whatsapp-cloudapi`; needs a decision.
- Cookie consent banner / Consent Mode (none exists today).
- Scroll-depth, video, per-field form analytics, Meta `Search` event, heat-map tools.
- Fixing the door-landing seller-message mismatch.
