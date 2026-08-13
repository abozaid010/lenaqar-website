# LenAqar — Repo Change Plan for `lenaqar.com`

**Source strategy:** `LenAqar-Strategy.md` (v2.0, 13 Aug 2026)
**Repo:** this repo — the LenaAI Next.js monolith (CRM + lenaai.net marketing)
**Target:** ship `lenaqar.com` on Vercel tonight, from the same repo, **without changing lenaai.net behaviour**
**Principles:** DRY · YAGNI · no login page · config-file-first · nothing assumed

> **Revision 2** — rewritten after the product answers of 13 Aug and after probing the live API.
> Three answers were corrected by direct measurement; see §2. Read that section first.

---

## 1. Verified repo baseline

| Fact | Evidence |
|---|---|
| Next.js 16.2.7, React 19, Tailwind v4, App Router | [package.json](package.json) |
| Middleware is `src/proxy.js` (Next 16 name) | [src/proxy.js:206](src/proxy.js:206) |
| **Host-based rewrite already proven**: `contact.lenaai.net` → `/contact` | [src/proxy.js:72](src/proxy.js:72) |
| `SITE_URL` env-driven (`NEXT_PUBLIC_SITE_URL`), defaults to lenaai | [src/app/metadata.js:1](src/app/metadata.js:1) |
| Root layout sets `lang`/`dir` from cookie + `Accept-Language`; Cairo font loaded; default locale `ar` | [src/app/layout.jsx:30](src/app/layout.jsx:30) |
| **GA id hardcoded** `G-L76Z647950`; Meta Pixel env-driven | [src/constants/analytics.js:4](src/constants/analytics.js:4) |
| Server axios injects `X-API-Key` on `/public/*` + `X-BFF-Secret` always | [src/utils/axiosInstance.js:18](src/utils/axiosInstance.js:18) |
| Reusable formatters (`formatCurrency`, `formatDeliveryDate`, `formatInstallmentYears`, `calculateMonthlyInstallment`, `slugify`) | [src/lib/units/unit-formatters.ts:43](src/lib/units/unit-formatters.ts:43) |
| Reusable WhatsApp builder `formatPhoneForWhatsApp(phone, message)` | [src/utils/phone-utils.js:46](src/utils/phone-utils.js:46) |
| i18n: `translate()` via `useI18n` / `getServerTranslations`; dictionaries composed from sub-files | [public/locales/ar.js:1](public/locales/ar.js:1) |
| **SEO gate enforced on commit + CI**: missing `metadata`/`title`/`description` = hard error | [.husky/pre-commit](.husky/pre-commit), [scripts/check-seo.js:172](scripts/check-seo.js:172) |
| **Push to `main` auto-deploys lenaai.net to GCP** — changes must be inert without the brand env | [.github/workflows/deploy.yml](.github/workflows/deploy.yml) |
| Primary token `--primary: #030250` → `--color-primary` | [src/app/globals.css:6](src/app/globals.css:6) |
| LenaAI contacts to inherit: `505 Siac Building, ARCHPLAN Square, New Capital`, Cairo, EG · Facebook + LinkedIn URLs | [LocalBusinessSchema.jsx:13](src/components/schema/LocalBusinessSchema.jsx:13), [src/lib/solutions/links.ts:9](src/lib/solutions/links.ts:9) |

---

## 2. ⚠️ Measured API contract — three answers corrected

I probed `https://api.lenaai.net/public/v1/units` directly with the repo's `X_API_KEY`. Results:

### 2.1 The public endpoint returns **full** unit documents — no auth, no service login needed

Your answer #3 assumed `downPayment`, `deliveryDate` and `installment_amount_yearly` are missing. That is true of `/units/v1/slim-list` (the endpoint in your curl), but **not** of `/public/v1/units`, which returns:

```
areaBucket, author, bathroomCount, buildingType, building_number, cache_price, city,
clientId, clientName, code, country, dataSource, deliveryDate, deliveryYear, developer,
developer_ar, developer_id, district, downPayment, extra_info, finishing, floor,
furnishing, garageArea, gardenSize, images[], installment_amount_yearly, installment_years,
is_delivered, is_primary, landArea, model, monthlyRentPrice, notes, outdoor_area,
over_price, owner_type, paid_amount, phase, presentValue, project, project_ar, project_id,
purpose, remaining_amount, roof_area, roomsCount, sub_district, totalPrice,
totalPriceBucket, unitId, unitTitle, unit_number, updatedAt, video, view, visibility
```

**Consequence:** the strategy §17 cash-first card is buildable **tonight**, with real numbers — `downPayment` (الكاش المطلوب), `installment_years`, `deliveryDate`, `totalPrice`, and therefore a real `مضاعف الكاش`. And since the endpoint is unauthenticated, **the whole service-login layer is dropped from P0.** No `CLIENT`/`PASSWORD` needed to launch.

Caveat measured on live data: `installment_amount_yearly` is `null` on some units while `downPayment`/`installment_years` are present. Every financial field renders **only when present** — never substituted, never estimated.

### 2.2 🔴 There is not enough TMG inventory to build a buyer feed

Two separate measurements:

**(a) The `lenaqar` tenant is empty.** `client_id=lenaqar` returns **0 units** for both `is_primary=true` and `false`.

**(b) The `public` tenant was scanned to exhaustion — 1,783 unique units** (`is_primary=false` complete at 343 rows; `is_primary=true` complete at 1,440). Searching every one of them across `developer`, `developer_ar`, `project`, `project_ar`, `phase`, `unitTitle` for TMG and the four projects returns **three units in total**:

| code | developer | project | primary | total | downPayment | years | yearly | delivery | verdict |
|---|---|---|---|---|---|---|---|---|---|
| `6QKbijY9` | `Talaat Moustafa \| TMG` | south med | ✅ true | 49,052,150 | 1,422,512.35 | 11 | 4,329,967.06 | 2029 | **the only clean row** — plan reconciles to the pound |
| `JCanCpeq` | `Talaat Moustafa Group (TMG)` | southmed | false | 4,700,000 | **0** | — | — | 2026 | ❌ fails the gate: no cash figure, no plan |
| `pwlXtpw7` | *(empty)* | Celia New Capital for Quick sale | false | 26,500,000 | 12,000,000 | 5 | — | 2026 | ❌ fails the gate: no developer name |

**Madinaty: 0 units. Noor: 0 units.** (Every apparent "نور" match was the substring inside **نورث** — "hyde park north", "north plus", "q north". Naive Arabic substring matching produced 14 false positives; the allowlist must match tokens, not substrings.)

**A one-unit feed is not a feed.** `/opportunities` cannot ship tonight against TMG curation — this is a data task, not a code task. See §13.

Three further facts the scan produced, all of which the code must handle:

1. **Developer names are inconsistent across rows** — `Talaat Moustafa Group (TMG)` vs `Talaat Moustafa | TMG` vs empty. Match on normalised tokens (`talaat`, `tmg`), never on an exact string.
2. **The one clean unit has a cash multiple of 34.5×** (49,052,150 ÷ 1,422,512 — a 2.9% down payment over 11 years). The strategy's §18 sanity bound of `1 ≤ cashMultiple ≤ 30` would **reject it**. That bound is wrong for Egyptian long plans: 5% down mechanically yields 20×, 2.9% yields 34.5×. Raise the ceiling to 40 and make it a config constant.
3. The user-selected `is_primary=false` filter would exclude the only viable unit, which is **primary**. The feed should fetch both and label them, not hard-filter.

### 2.3 Which query params the public endpoint actually honours

| Honoured ✅ | Silently ignored ❌ |
|---|---|
| `client_id`, `city`, `district`, `purpose`, `is_primary`, `bedrooms`, `min_price`, `max_price`, `page_size`, `cursor` | `project`, `developer`, `developer_id`, `delivery_year`, `sort`, `totalPriceBucket` |

Measured: `developer=tmg`, `project=celia`, `project=south med`, `delivery_year=2028` and `sort=price_asc` all return the identical default page.

**Consequences for the build:**
- Curating to your launch network (TMG · Madinaty · Fnoor · Celia · South Med) **cannot** be done server-side by param. It must be an in-process filter over fetched pages, driven by a name allowlist in config.
- `min_price`/`max_price` filter on `totalPrice`, **not** on cash required. The strategy's cash filter is `downPayment`, so it is applied in-process.
- Ranking by `مضاعف الكاش` and the delivery filter are in-process too.
- `page_size=50` returned 16 → the server caps the page; pagination is cursor-based (`next_cursor` / `has_more_next`).

This is fine at launch scale: fetch a bounded number of pages → validate → filter → sort → cap at 20–40 units (strategy §21 P0 #5), cached with ISR.

### 2.4 🔴 Privacy: the public payload carries internal fields

Good news: `owner_mobile` and `owner_name` are **absent** from `/public/v1/units`.
Bad news, measured on a live row: `author: "ghada.hossam@lena.ai"`, plus `notes`, `extra_info`, `visibility`, `dataSource`, `cache_price`.

Publishing the raw object would leak a staff email into the page HTML. **Mandatory:** an explicit field **allowlist** mapper (`to-public-opportunity.js`, §5.2) — never a blocklist, never a spread of the raw unit.

---

## 3. Product decisions locked from your answers

| # | Decision | Effect on the build |
|---|---|---|
| 1 | Data via **public API**, no auth at this stage | Service-session module dropped from P0 |
| 2 | Feed = assignment / resale | Overridden by measurement: the only viable TMG unit is **primary**. Config fetches both (`isPrimary: null`) and labels each row |
| 3 | Payment-plan fields land soon | Already present on the public endpoint; optional-field rendering regardless |
| 4 | **Simple URLs, no login.** Later login is for **end users**, not clients | `/opportunities/{code}`, no clientId segment. CRM `(auth)` flow is *not* the base for it |
| 5 | Creds later as `LENAQAR_CLIENT_EMAIL` / `LENAQAR_CLIENT_PASSWORD` | Reserved names, documented, unused at launch |
| 6 | Contacts: phone + WhatsApp `01036464346`, `info@lenaqar.com`, rest same as LenaAI, **all in one file** | `src/config/lenaqar-contact.js` |
| 7 | **One developer — TMG**, four projects: Noor · Madinaty · South Med · Celia. Pull from the `public` tenant | Token allowlist in config. **But see §2.2 — only 1 of the 1,783 units in that tenant qualifies** |
| 8 | **No guarantee. No one fronts cash.** Promise = exit faster, get more money, backed by a signed contract | The word ضمان never appears. Single honest copy set — the dual "guarantee mode" flag is deleted as YAGNI |
| 9 | A written seller agreement is signed | `/sell` trust block: "باتفاق مكتوب" |
| 10 | Capacity ≈ 100 units | Internal cap, not published |
| 11 | `presentValue` stays hidden behind a flag | `SITE.showPresentValue = false`; `سعر المتر` only |
| 12 | `info@lenaqar.com` **is not live yet** | Kept in the contact file, **not rendered in the footer**. Footer shows phone + WhatsApp until the mailbox answers — a bouncing address costs more trust than an absent one. One boolean flips it on |
| 13 | Keep the LenaAI logo for now | Reuse `/images/logo.png` + `/images/logo-5.png` for header, favicon and OG. **No new asset blocks launch** |

**Copy consequence of #8 — the headline changes.** Strategy §16's winner ("اخرج في 45 يوم") is a guarantee and is now off the table. Launch copy leads on speed + amount + a contract, with no date promise:

- **Hero:** *مش قادر تكمّل أقساطك؟ إحنا بنخرجك أسرع — وبفلوس أكتر.*
- **Sub:** *بنعرض وحدتك على مشترين جاهزين، وبنتفق معاك على السعر باتفاق مكتوب. من غير أوفر مضاف عليك، ومن غير مضايقات.*
- **Primary CTA:** `احسب خروجك في دقيقة` → **Secondary:** `عايز أشتري فرصة`
- **Buyer door:** *الكاش اللي معاك يشتري إيه النهارده؟*
- **Forbidden strings:** `ضمان` / `مضمون` / `45 يوم` / `بدون أوفر` (the last is Aqarexit's owned phrase — strategy §16 #10).

The calculator therefore outputs a **comparison**, not a promise: *"لو ألغيت مع المطور: X. لو بعت من خلالنا: Y"* — with the explicit note that penalties and refund schedules are contract- and developer-specific.

---

## 4. Deployment topology — decision

**Second Vercel project from the same repo, switched by one env var (`NEXT_PUBLIC_SITE_BRAND=lenaqar`).**

`NEXT_PUBLIC_SITE_URL` already flows into metadata, robots, sitemap and canonicals, so pointing it at `https://lenaqar.com` makes all three correct with **zero** host-conditional logic, and `robots.ts` / `sitemap.ts` stay statically rendered. One project with two domains was rejected: it forces `headers()` into every metadata path (dynamic rendering) and one bad conditional would break lenaai.net's indexing — unacceptable when `main` auto-deploys lenaai.net to GCP. Host checks still go into `src/proxy.js` as defence in depth (§7).

---

## 5. Code plan

### 5.1 `src/config/site.js` — **NEW** (single source of truth)

```js
export const BRAND = (process.env.NEXT_PUBLIC_SITE_BRAND || "lenaai").trim();
export const IS_LENAQAR = BRAND === "lenaqar";

/** Backend tenant the feed reads from. Flip to "lenaqar" the moment that tenant has units. */
export const LENAQAR_TENANT_ID = (process.env.NEXT_PUBLIC_LENAQAR_TENANT_ID || "lenaqar").trim();

export const SITE = {
  brand: BRAND,
  clientId: IS_LENAQAR ? LENAQAR_TENANT_ID : null,
  name: IS_LENAQAR ? "لينا عقار" : "LENAAI",
  url: process.env.NEXT_PUBLIC_SITE_URL || (IS_LENAQAR ? "https://lenaqar.com" : "https://www.lenaai.net"),
  htmlLang: IS_LENAQAR ? "ar-EG" : null,   // null = keep existing cookie/Accept-Language behaviour
  dir: IS_LENAQAR ? "rtl" : null,
  ogLocale: IS_LENAQAR ? "ar_EG" : "en_US",
  /** null = fetch both primary and resale; the only viable TMG unit today is primary (§2.2). */
  inventory: { isPrimary: null, purpose: "sell" },
  /**
   * Answer #7 — one developer, four projects. Applied in-process: the API ignores
   * project/developer params (§2.3). Tokens, not substrings — "نور" matches inside
   * "نورث" and produced 14 false positives in the live scan (§2.2).
   */
  network: {
    developerTokens: ["tmg", "talaat", "طلعت"],
    projectTokens: ["noor", "نور", "madinaty", "مدينتي", "south med", "southmed", "celia", "سيليا"],
  },
  /** §2.2: 2.9% down over 11 years = 34.5×. The strategy's ceiling of 30 rejects real plans. */
  cashMultipleBounds: { min: 1, max: 40 },
  /** Backend presentValue stays hidden until its methodology can be stated on the page (§5.6). */
  showPresentValue: false,
  /** Flip when info@lenaqar.com actually receives mail (answer #12). */
  showEmail: false,
  /** Feed sizing: bounded pages in, capped list out (strategy §21 P0 #5). */
  feed: {
    enabled: process.env.NEXT_PUBLIC_LENAQAR_FEED_ENABLED === "true", // §13 — off until TMG inventory lands
    maxPages: 4,
    pageSize: 16,
    maxUnits: 40,
  },
};

export const LENAQAR_ROUTES = ["/lenaqar", "/sell", "/calculator", "/opportunities"];
```

### 5.2 `src/config/lenaqar-contact.js` — **NEW** (answer #6: one file, easy to replace)

Literals, not env — you asked for one file to edit later.

```js
/** ⚠️ Single place for every LenAqar contact detail. Replace here, nowhere else. */
export const LENAQAR_CONTACT = {
  // E.164 is required — formatPhoneForWhatsApp() strips non-digits, so a local
  // "01036464346" would build wa.me/01036464346 and fail.
  phoneE164: "+201036464346",
  phoneDisplay: "010 3646 4346",
  whatsappE164: "+201036464346",
  // Not live yet (answer #12) — held behind SITE.showEmail, kept here for the flip.
  email: "info@lenaqar.com",
  // Inherited from LenaAI until LenAqar has its own (LocalBusinessSchema.jsx:13)
  address: "505 Siac Building, ARCHPLAN Square, New Capital",
  city: "Cairo",
  country: "EG",
  facebook: "https://www.facebook.com/profile.php?id=61587419182034",
  linkedin: "https://www.linkedin.com/company/lenaai-net/",
};
```

### 5.3 `src/lib/lenaqar/opportunities.server.js` — **NEW**

```js
import "server-only";
import axiosInstance from "@/utils/axiosInstance";   // injects X-API-Key on /public/* + X-BFF-Secret
import { SITE } from "@/config/site";

/** Cursor-paginated fetch, bounded by SITE.feed.maxPages. No auth — /public/* takes X-API-Key. */
export async function fetchOpportunities({ city, district, minPrice, maxPrice } = {}) { … }
```
- Server-side only params: `client_id`, `is_primary`, `purpose`, `city`, `district`, `min_price`, `max_price`, `page_size`, `cursor` (the honoured set, §2.3).
- Then, in process: allowlist-map → validate → network filter → cash/delivery filter → sort by cash multiple → cap at `maxUnits`.
- `export const revalidate = 900` on the pages (15-min ISR, Vercel-native).

### 5.4 `src/lib/lenaqar/to-public-opportunity.js` — **NEW** (privacy allowlist — §2.4)

Explicit field allowlist. `author`, `notes`, `extra_info`, `visibility`, `dataSource`, `cache_price`, `owner_*` never cross into the browser payload.

```js
export function toPublicOpportunity(raw) {
  return {
    code, unitTitle, project, projectAr, developer, city, district, subDistrict,
    buildingType, roomsCount, bathroomCount, landArea, floor, finishing, view,
    totalPrice, downPayment, installmentYears, installmentAmountYearly,
    deliveryDate, deliveryYear, isDelivered, images, updatedAt,
  }; // ← nothing else, ever
}
```

### 5.5 `src/lib/lenaqar/validate-unit.js` — **NEW** (strategy §18 gate)

Pure function, testable with the repo's existing `node --test` convention:

```
totalPrice > 0
downPayment > 0 and downPayment ≤ totalPrice
installmentYears > 0                              (when present)
installmentAmountYearly < totalPrice              (when present)
downPayment + installmentAmountYearly × installmentYears ≈ totalPrice  (±2%, when all present)
SITE.cashMultipleBounds.min ≤ cashMultiple ≤ SITE.cashMultipleBounds.max   (1…40, see §2.2)
deliveryYear ≥ current year                       (unless isDelivered)
developer non-empty
```
Failure ⇒ excluded from the feed and logged with its code. **Publish 20 that pass, not 200 that don't.**
Optional fields never fail a unit for being absent — only for being inconsistent.

Measured against live data, this gate rejects 2 of the 3 TMG-matching units (`downPayment: 0`; empty developer) and accepts `6QKbijY9`, whose plan reconciles to the pound: `1,422,512.35 + 4,329,967.06 × 11 = 49,052,150` = `totalPrice` exactly. The gate works — there is simply almost nothing to feed it.

### 5.6 `src/lib/lenaqar/metrics.js` — **NEW**

```js
export const cashMultiple = (totalPrice, downPayment) =>
  downPayment > 0 ? totalPrice / downPayment : null;   // مضاعف الكاش
```
Two inputs, both from the API. No composite score, no discount %, no appreciation forecast (strategy §18).

> **`presentValue` — decided (answer #11): hidden.** The API returns a backend-computed `presentValue` (e.g. asking 6.48M vs presentValue 7.47M) and `pricePerMeter` for secondary units. Rendering it as "market value" would recreate the exact unverifiable claim the strategy attacks Aqarexit for (§6 #2). Gated behind `SITE.showPresentValue = false`; only `سعر المتر` is shown. The field is still stripped from the payload by the allowlist when the flag is off, so it never reaches the browser.

### 5.7 `src/lib/lenaqar/whatsapp.js` — **NEW**

Wraps `formatPhoneForWhatsApp` with `LENAQAR_CONTACT.whatsappE164`:
- `sellerCtaHref()` → *أهلاً، عايز أعرف خروجي من وحدتي — من حاسبة lenaqar.com*
- `buyerCtaHref(unit)` → *أهلاً، مهتم بالوحدة {المشروع} - {المطور} ({الرمز}) من lenaqar.com*

Must be tested on **real iOS and Android** before launch (strategy §21 #4).

---

## 6. Routes

```
src/app/(lenaqar)/
├─ layout.jsx                     # RTL shell: header, footer, sticky WhatsApp bar; notFound() when !IS_LENAQAR
├─ lenaqar/page.jsx               # Homepage — served at "/" via proxy rewrite
├─ sell/page.jsx                  # /sell        — offer, worked example, criteria, written-agreement trust block
├─ calculator/page.jsx            # /calculator  — ⭐ highest-leverage page
├─ opportunities/page.jsx         # /opportunities — ranked feed, 3 filters; 404s while SITE.feed.enabled is false (§13)
└─ opportunities/[slug]/page.tsx  # /opportunities/{code} — detail + WhatsApp CTA; same gate
```

The homepage lives at `/lenaqar` on disk because `src/app/page.jsx` already owns `/`; the proxy **rewrites** `/` → `/lenaqar` (same mechanism as `contact.lenaai.net` → `/contact`). Visitor URL stays `/`, canonical is `https://lenaqar.com/`, and `/lenaqar` is `Disallow`ed so it can't be indexed as a duplicate.

Every page exports `metadata` (or `generateMetadata`) with a **unique** title and a description over ~40 chars — otherwise the pre-commit SEO gate hard-fails.

**Countdown badge:** strategy §17 makes `⏳ خارجة خلال N يوم` a signature element, but with no guarantee (answer #8) there is no exit date, and the API exposes none. **It is not built.** Fake urgency is exactly what the strategy attacks Aqarexit for.

---

## 7. `src/proxy.js` — EDIT (all no-ops when `!IS_LENAQAR`)

1. `IS_LENAQAR && pathname === "/"` → `rewrite("/lenaqar")`.
2. Skip the existing `/` → `/{clientId}/dashboard` redirect ([src/proxy.js:190](src/proxy.js:190)) — otherwise a visitor with stale LenaAI cookies lands in the CRM.
3. `IS_LENAQAR` + any `adminPaths` segment, `/login`, `/allProberties`, `(marketing)` route → 308 to `https://www.lenaai.net{path}`.
4. `!IS_LENAQAR` + any `LENAQAR_ROUTES` path → 308 to `https://lenaqar.com{path}` (no duplicate content across domains).

Middleware runs before `next.config.mjs` rewrites, so #3 also neutralises the `/{clientId}/{adminPath}` rewrites — **confirm in the smoke test**.

---

## 8. Layout, metadata, robots, sitemap

| File | Change |
|---|---|
| [src/app/layout.jsx](src/app/layout.jsx) | When `SITE.htmlLang` is set: force `lang="ar-EG"` / `dir="rtl"`, skip `Accept-Language` negotiation (no language switcher — strategy §23), set `data-brand`. |
| [src/app/metadata.js](src/app/metadata.js) | Brand branch: Arabic title template `%s | لينا عقار`, Arabic description, `og:locale=ar_EG`, `siteName`, canonical `SITE.url`, LenAqar icons. **Drop the 150-keyword LenaAI array for this brand.** LenaAI branch byte-identical. |
| [src/app/robots.ts](src/app/robots.ts) | Brand branch. Allow `/`, `/sell`, `/calculator`, `/opportunities`, `/opportunities/*`; disallow `/api/`, `/lenaqar`, `/_next/`, all CRM paths; sitemap `https://lenaqar.com/sitemap.xml`. |
| [src/app/sitemap.ts](src/app/sitemap.ts) | Brand branch. 4 static routes + one entry per **validated** opportunity, from `fetchOpportunities()` — never the LenaAI `/public/units?limit=1000` call. |
| [src/app/globals.css](src/app/globals.css) | `:root[data-brand="lenaqar"] { --primary: …; }`. Ships as a mechanism; the LenaAI primary is carried over per strategy §20, so no colour change tonight. |

---

## 9. Components

**Reuse as-is:** `ImageWithLoader`, `LoadingSpinner`, `unit-formatters.ts` (all currency/date/installment formatting), `formatPhoneForWhatsApp`, `imageUtils` fallbacks, `BreadcrumbSchema`, `useI18n`/`translate()`.

**Do not reuse:** `UnitsGrid` (cookie reads, share dialog, bulk-selection context, present-value toggles — drags the CRM into the public bundle, and the LenAqar card is a different, cash-first card), `UnitsFilter` (30+ filters vs. the 3 allowed), `unit-details-page` (CRM view model), LenaAI `Header`/`SolutionsNavbar`/`SolutionsFooter`.

**New — `src/components/lenaqar/`:** `lenaqar-header`, `lenaqar-footer` (phone, WhatsApp, address — strategy §21 #16; email hidden until the mailbox is live), `sticky-whatsapp-bar`, `whatsapp-cta` (one CTA style per screen, fires analytics), `opportunity-card` (cash-first, tabular figures, `ج.م` fixed position, optional fields hidden when absent), `opportunity-filters` (exactly 3, URL-param driven), `exit-calculator` (`"use client"`, pure arithmetic, no API), `comparison-block` (worked example + "not a quote" disclaimer), `network-strip` (TMG + its four projects, `الأسعار محدّثة {date}`).

---

## 10. Copy & i18n

- **NEW** `public/locales/lenaqar-ar.js`; **EDIT** `public/locales/ar.js` to mount it under `lenaqar`. `en.js` untouched — Arabic only at launch.
- Namespaces: `lenaqar.home.* · sell.* · calculator.* · opportunities.* · unit.* · footer.* · legal.*`.
- Every string via `translate('…')` (CLAUDE.md).
- Mandatory lines: the cash-multiple honesty line (*مضاعف الكاش بيقيس كفاءة الكاش بس — مش وعد بمكسب. القسط مسؤوليتك لحد التسليم.*), the worked-example disclaimer, the price-source date on every card.
- Banned: `ضمان`, `مضمون`, `45 يوم`, `بدون أوفر`.

---

## 11. Analytics

[src/constants/analytics.js](src/constants/analytics.js) — make the GA id env-driven (`NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-L76Z647950'`); today it is hardcoded, so lenaqar.com traffic would land in LenaAI's property. Add events: `calculator_used`, `seller_whatsapp_clicked`, `cash_entered`, `unit_viewed`, `buyer_whatsapp_clicked`. Fire through the existing `useGoogleAnalytics` + `MetaPixelProvider`. Meta Pixel is already env-driven — just set a separate id.

---

## 12. Change table

| # | File | Action | Pri |
|---|---|---|---|
| 1 | `src/config/site.js` | NEW — brand, tenant, inventory, network, feed sizing | P0 |
| 2 | `src/config/lenaqar-contact.js` | NEW — every contact detail in one file | P0 |
| 3 | `src/lib/lenaqar/opportunities.server.js` | NEW — public-API fetch, bounded pagination | P0 |
| 4 | `src/lib/lenaqar/to-public-opportunity.js` | NEW — field allowlist (blocks the `author` leak) | P0 |
| 5 | `src/lib/lenaqar/validate-unit.js` | NEW — §18 gate | P0 |
| 6 | `src/lib/lenaqar/metrics.js` | NEW — cash multiple | P0 |
| 7 | `src/lib/lenaqar/whatsapp.js` | NEW — pre-filled deep links | P0 |
| 8–13 | `src/app/(lenaqar)/**` (layout + 5 pages) | NEW | P0 |
| 14 | `src/components/lenaqar/**` (9 components) | NEW | P0 |
| 15 | `public/locales/lenaqar-ar.js` | NEW | P0 |
| 16 | `public/locales/ar.js` | EDIT — mount namespace | P0 |
| 17 | `src/proxy.js` | EDIT — rewrite + brand guards | P0 |
| 18 | `src/app/metadata.js` | EDIT — brand-aware defaults | P0 |
| 19 | `src/app/layout.jsx` | EDIT — forced `ar-EG` / RTL, `data-brand` | P0 |
| 20 | `src/app/robots.ts` | EDIT — brand-aware | P0 |
| 21 | `src/app/sitemap.ts` | EDIT — brand-aware | P0 |
| 22 | `src/constants/analytics.js` | EDIT — env GA id + 5 events | P0 |
| 23 | ~~LenAqar logo / favicon / OG asset~~ | **Dropped** (answer #13) — reuse `/images/logo.png` + `/images/logo-5.png`; no design asset blocks launch | — |
| 24 | `src/app/globals.css` | EDIT — `[data-brand]` token scope | P0 |
| 25 | `.env.example` | EDIT — document LenAqar vars | P0 |
| 26 | `src/lib/lenaqar/__tests__/validate-unit.test.js` | NEW — `node --test` | P1 |
| 27 | `src/components/schema/LenaqarOrganizationSchema` + `RealEstateListing` JSON-LD | NEW | P1 |
| 28 | `src/app/(lenaqar)/{about,prices}/page.jsx` | NEW | P1 |
| — | `src/lib/lenaqar/service-session.server.js` | **Deferred** — not needed while the public API is open (answer #1) | P2 |

**Untouched:** all of `(admin)`, `(auth)`, `(marketing)`, `src/app/page.jsx`, `src/app/api/**`, `next.config.mjs`, every CRM hook and component.

### `.env.example` additions
```dotenv
NEXT_PUBLIC_SITE_BRAND=lenaqar
NEXT_PUBLIC_SITE_URL=https://lenaqar.com
NEXT_PUBLIC_LENAQAR_TENANT_ID=lenaqar     # tenant the feed reads from (§13)
NEXT_PUBLIC_LENAQAR_FEED_ENABLED=false    # flip to true when TMG inventory lands (§13)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXX
NEXT_PUBLIC_META_PIXEL_ID=XXXXXXXXXXX
# Reserved for the future end-user login (answers #4, #5) — unused at launch:
# LENAQAR_CLIENT_EMAIL=
# LENAQAR_CLIENT_PASSWORD=
```
`API_BASE_URL`, `X_API_KEY`, `BFF_SECRET` are reused unchanged. Contacts are **not** env vars — they live in `src/config/lenaqar-contact.js` (answer #6).

---

## 13. 🔴 The one real blocker: inventory

The `lenaqar` tenant has 0 units, and the `public` tenant — scanned in full, 1,783 units — yields exactly **one** publishable TMG unit (§2.2). The buyer feed has no data.

| Option | Effort | Trade-off |
|---|---|---|
| **A. Load TMG's four projects into the `lenaqar` tenant** | Ops, tonight | The correct answer. The code is already written against `client_id=lenaqar`; the feed lights up with no redeploy |
| **B. Drop the TMG restriction, publish the whole `public` pool** | Env only | ~1,700 units with real payment plans — but from 132 other developers. Contradicts answer #7 and the "one developer we actually work with" story |
| **C. Ship the seller door tonight** (`/`, `/sell`, `/calculator`), hold `/opportunities` | Small | Strategy §9 makes the seller door the lead motion; the buyer door was always scheduled for week 2–6 |

**Recommendation: C now, A in parallel, B never.** The seller door needs zero inventory and carries the two highest-leverage assets — the calculator and the WhatsApp intake. Publishing one unit, or 1,700 units from developers you have no relationship with, both damage the "our numbers are real" positioning everything else rests on. `/opportunities` is built and tested tonight but stays behind `SITE.feed.enabled` until TMG inventory lands.

---

## 14. Runbook

### Local verification
```bash
NEXT_PUBLIC_SITE_BRAND=lenaqar NEXT_PUBLIC_SITE_URL=http://localhost:3000 npm run dev
```
- [ ] `/` renders the LenAqar homepage, RTL, at **360px**
- [ ] `/calculator` → both outcomes → WhatsApp CTA opens a pre-filled draft on a **real phone**
- [ ] With `NEXT_PUBLIC_LENAQAR_FEED_ENABLED=true`, `/opportunities` shows only units passing the §18 gate; cash multiple computed, not hardcoded; absent fields hidden, never zero-filled. With it `false`, both routes 404 and no link to them renders
- [ ] Network allowlist matches on tokens: a unit in `hyde park north` must **not** match `نور` (§2.2)
- [ ] **`grep -ri "lena.ai\|@lena" .next/server/app/\(lenaqar\)` finds no staff email** — proves the allowlist works
- [ ] `/dashboard`, `/login`, `/allProberties` redirect off the LenAqar host
- [ ] Source shows `<html lang="ar-EG" dir="rtl">`, unique `<title>`, canonical, `og:locale=ar_EG`
- [ ] No `ضمان` / `45 يوم` anywhere: `grep -rn "ضمان\|45 يوم" public/locales/lenaqar-ar.js`
- [ ] `npm run lint:all` and `npm run build` pass

### LenaAI regression (non-negotiable — `main` auto-deploys to GCP)
```bash
npm run dev    # no SITE_BRAND
```
- [ ] `/` still lenaai.net · `/login` works · `/{clientId}/dashboard` works · `/allProberties` works
- [ ] `/sell`, `/calculator`, `/opportunities` redirect to lenaqar.com
- [ ] `robots.txt` and `sitemap.xml` byte-identical to today

### Vercel
1. New project → same repo/branch, root directory = repo root.
2. Env (Production + Preview): `NEXT_PUBLIC_SITE_BRAND`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_LENAQAR_TENANT_ID`, `API_BASE_URL`, `X_API_KEY`, `BFF_SECRET`, `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_IMAGE_BASE_URL`, `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_META_PIXEL_ID`.
3. Domain `lenaqar.com` + `www` → 308 to apex; DNS per Vercel; HTTPS automatic.
4. **Backend allowlist:** the API requires `X-BFF-Secret` and may pin origins — confirm `lenaqar.com` and the `*.vercel.app` preview domain are permitted, or every request 403s. (My probes only proved server-to-server access from this machine.)
5. Post-deploy: Search Console + sitemap submit; confirm the five events in GA4 realtime and Pixel Helper.

---

## 15. Remaining questions

All product questions from the previous revision are answered. Two operational items remain:

1. **Inventory (§13)** — will TMG's four projects be loaded into the `lenaqar` tenant tonight? If not, `/opportunities` ships disabled and the launch is seller-door only. Nothing else in the plan is blocked.
2. **Backend origin allowlist** — my probes proved server-to-server access from this machine. Confirm the API accepts requests carrying `X-BFF-Secret` from the Vercel deployment (`lenaqar.com` + the `*.vercel.app` preview host) before go-live, or every request 403s in production.

Resolved and recorded: TMG is the sole developer with four projects (Noor · Madinaty · South Med · Celia) · `presentValue` hidden behind a flag · `info@lenaqar.com` held out of the footer until the mailbox is live · LenaAI logo and OG image reused, so no design asset blocks the launch.

---

## 16. Explicitly NOT building (YAGNI)

Accounts · login page · saved searches · dashboards · maps · ROI/mortgage calculators · blog · document-upload portal · escrow · admin CMS · English version · comparison tools · favourites · composite opportunity score · discount-vs-market % · rental-yield or appreciation forecasts · countdown badges (no real exit date exists) · price-index API · pre-increase alerts · principal purchases.

`/prices` and `/about` are P1 stubs only after the P0 table is green.
