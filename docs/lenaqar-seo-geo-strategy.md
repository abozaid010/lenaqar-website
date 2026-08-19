# Lenaqar — SEO & AI-Search (GEO/AEO) Audit and Strategy

Audit date: 2026-08-20. Scope: `lenaqar.com` production + local `main`-branch code.
Competitor benchmark: `aqarexit.com`.

Everything below is measured from the live site, the live competitor, and the code —
not assumed. Where a number is inferred rather than measured, it says so.

---

## 1. Current SEO audit

### 1.1 The headline finding

**Production has 4 indexable URLs. AqarExit has 2,731.**

| | Lenaqar | AqarExit |
|---|---|---|
| URLs in `sitemap.xml` | **4** | **2,731** |
| Listing pages in sitemap | **0** | 2,720 |
| Static/content pages | 4 | 11 |
| Listing structured data | none | `Product` + `Offer` + `PropertyValue` |
| Blog / guides | none | none |
| Project / area / developer pages | none | none |
| AI crawlers allowed | yes (by default) | **blocked** |

Measured:

```
curl -s https://lenaqar.com/sitemap.xml   | grep -c "<loc>"   →    4
curl -s https://aqarexit.com/sitemap.xml  | grep -c "<loc>"   → 2731
```

The sitemap generator in [sitemap.ts](src/app/sitemap.ts) is correct — it appends one
URL per unit from `fetchOpportunities()`. Locally that returns ~40 units. **In production
it returns zero:** `https://lenaqar.com/opportunities` renders 42 KB with zero listing
links, versus 286 KB and 40 cards locally. So the feed fetch is failing or filtering to
empty in the production environment.

This is the single highest-value item on the whole roadmap. Every other SEO improvement
multiplies a listing count that is currently zero. It is an environment/data issue
(API key, `BFF_SECRET`, or the `client_id=homey` inventory being empty in prod), not a
code bug I can fix blind — see P0-1.

### 1.2 On-page metadata

**Every public page ships a doubled brand name in `<title>`.** The root layout sets
`template: "%s | لينا عقار"` in [metadata.js](src/app/metadata.js), and each page's own
title already ends in the brand. Measured live:

| Page | Rendered `<title>` |
|---|---|
| `/` | `لينا عقار \| اخرج من وحدتك أسرع وبفلوس أكتر \| لينا عقار` |
| `/sell` | `بيع وحدتك \| لينا عقار — اتفاق مكتوب وخروج أسرع \| لينا عقار` |
| `/calculator` | `احسب خروجك \| لينا عقار — مقارنة إلغاء العقد مع البيع \| لينا عقار` |
| `/opportunities` | `فرص الكاش \| لينا عقار — وحدات بخطة سداد من المطور \| لينا عقار` |
| `/privacy` | `سياسة الخصوصية والشروط والأحكام \| لينا عقار \| لينا عقار` |
| `/opportunities/{code}` | `madinaty b14 \| فرصة كاش من لينا عقار \| لينا عقار` |

Google truncates Arabic titles around 55–60 characters. Repeating a 9-character brand
burns the most valuable pixels in the SERP and pushes the differentiating phrase out of
view. On `/sell` the brand appears **twice inside one title**.

**Titles target no real search demand.** "فرص الكاش" is internal vocabulary. Nobody
searches it. The keywords with actual volume — ريسيل، بدون أوفر، تنازل، سعر التعاقد
القديم، شقق للبيع في [مشروع] — appear in **zero** page titles.

**Title/H1 intent mismatch on the homepage.** The title promises a seller outcome
("اخرج من وحدتك أسرع") while the H1 promises a buyer outcome
("كمّل استثمار غيرك واشتري بيت بسعر زمان"). Search engines weight title–H1–body
coherence; this page currently declares two different intents.

Good news, and it is genuinely good: **every public page has exactly one `<h1>`, a
unique canonical, complete Open Graph, and Arabic content that renders server-side.**
Arabic is a synchronous static import in [translate-api.js](src/context/translate-api.js),
so `translate()` output is in the SSR HTML — verified in the raw response, not the DOM.
That is the foundation most Next.js sites get wrong, and it is right here.

### 1.3 Property pages — the money pages

Measured on `/opportunities/aXcvoehA`:

- **H1 is `madinaty b14`** — a raw internal project code, in English, on an Arabic site.
  No property type, no bedrooms, no size, no price, no city.
- **Title is the same raw code** plus doubled brand.
- **Meta description is a template** with no numbers: "وحدة في madinaty b14 من
  Talaat Moustafa | TMG. الكاش المطلوب والتفاصيل…"
- **No listing structured data.** Only `BreadcrumbList` renders. There is no
  `RealEstateListing`, `Product`, `Offer`, or price markup of any kind.
- **URL is an opaque code** (`aXcvoehA`) carrying zero keyword signal.
- **Every image shares one `alt`** — the project name, repeated.

Compare AqarExit's equivalent page, which does all of this properly:

- Title: `هاسيندا ووترز — بألم هيلز · رأس الحكمة | عقار إكزت`
- Description: `شاليه في هاسيندا ووترز بالتنازل من غير أوفر. المطلوب كاش دلوقتي
  3,300,000 ج.م والباقي أقساط على المطور.` — type + project + concept + a real number.
- Schema: `Product`, `Offer`, `Brand`, 4× `PropertyValue`, `BreadcrumbList`.

The data to fix all of this **already exists** in the payload. `toPublicOpportunity()`
in [to-public-opportunity.js](src/lib/lenaqar/to-public-opportunity.js) already carries
`buildingType`, `roomsCount`, `bathroomCount`, `landArea`, `city`, `district`,
`subDistrict`, `totalPrice`, `downPayment`, `overPrice`, `remainingAmount`,
`installmentYears`, `deliveryYear`, `finishing`, `view`, `floor`, `isPrimary`. None of
it reaches the title, the H1, or any schema. This is the cheapest large win available.

### 1.4 Indexability and crawl integrity

**Soft 404 across an unbounded URL space.** Any unknown single-segment path returns
**HTTP 200**, not 404:

```
curl -o /dev/null -w "%{http_code}" https://lenaqar.com/this-page-does-not-exist-123
→ 200
```

The admin route `src/app/(admin)/[email]/page.jsx` has a catch-all dynamic segment that
swallows every unmatched single-segment URL and renders the CRM "Client Information"
screen. It does set `robots: { index: false }`, so this will not pollute the index — but
it produces unlimited soft-404s in Search Console, wastes crawl budget that should be
going to listings, and means a typo'd or mis-linked public URL fails silently instead
of visibly.

**Admin pages are reachable under the client-id prefix.** `next.config.mjs` rewrites
`/:clientId/units/:code` → `/units/:code`, and the canonical unit share URL is
`/{clientId}/units/{code}`. `robots.txt` disallows `/units/` and `/units/*` — neither
pattern matches `/homey/units/ABC`. Fetching `/homey/units/aXcvoehA` unauthenticated
returns **HTTP 200 with no `<title>`, no robots meta, and no canonical** — an error
boundary served as a success. The same hole exists for `/{clientId}/dashboard`,
`/{clientId}/team`, `/{clientId}/analytics` and every other rewritten admin path. Only
`/*/admin/` is wildcarded today.

**Brand leakage.** `/allProberties` still ships LenaAI CRM metadata
("All Properties - AI-Powered Real Estate Listings | LENAAI"). It is disallowed in
robots.txt so the damage is contained, but the soft-404 page above serves
"Client Information - LENAAI AI Sales Agent" on `lenaqar.com` at HTTP 200.

**`/match/[token]` has no metadata at all** and is not disallowed. Shared client match
links are crawlable.

**robots/sitemap disagree when the feed is off.** `robots.ts` only allows
`/opportunities` when `SITE.feed.enabled`, but `sitemap.ts` lists `/opportunities`
unconditionally.

### 1.5 Structured data

Site-wide `Organization`, `LocalBusiness`, and `WebSite` render on every page — correct
and well-formed. Beyond that:

- **`WebSite.potentialAction` points at a search that does not exist.** It declares
  `/opportunities?q={search_term_string}`, but `parseOpportunitySearchParams()` accepts
  `area`, `cash`, `delivery`, `city`, `district`, `sub_district`, `project`, `bedrooms`,
  `min_price`, `max_price`, `property_type` — and no `q`. The declared SearchAction
  silently does nothing.
- **`ProjectSchema`, `DeveloperSchema`, and `UnitSchema` are dead code** — imported
  nowhere. All three also reference an undefined variable `t` (`t?.schema?.developer`),
  which throws `ReferenceError` the moment a fallback path is taken. They are currently
  harmless only because nothing renders them.
- **No `FAQPage`, no `Article`, no `RealEstateListing`** anywhere.
- `BreadcrumbSchema` hard-codes the first crumb as `"Home"` in English on an Arabic site.

### 1.6 Technical / performance / mobile

Solid already: `compress: true`, `poweredByHeader: false`, a full security-header set,
HSTS, WebP+AVIF image formats, sensible `deviceSizes`, `minimumCacheTTL` of 8 h,
`revalidate = 900` (ISR) on all listing routes, and `generateStaticParams()` pre-building
opportunity detail pages. Mobile-first RTL layout with logical properties throughout.
No blocking issues found.

Gaps: no `hreflang` despite a working ar/en switcher; no global `not-found`; no
pagination on `/opportunities` (the feed is hard-capped at
`SITE.feed.maxUnits: 40`, so listings beyond 40 are unreachable *and* unindexable — a
hard ceiling on the listing corpus even after the prod feed is fixed); `dangerouslyAllowSVG: true`
in the image config is worth a second look.

### 1.7 Stale documentation

`SEO_RULES.md`, `SEO_IMPLEMENTATION.md`, and `docs/seo-geo-content-qc.md` all describe a
different product (LenaAI CRM, `www.lenaai.net`, "ChatGPT for real estate") and mandate
LenaAI keywords in every title. `docs/seo-geo-content-qc.md` references
`src/content/seo/keyword-map.ts`, `public/locales/seo-*.js`, `src/components/web/seo/`,
`/blog` and `/faq` — **none of which exist**. `scripts/check-seo.js` enforces the LenaAI
rules in CI. Anyone following these docs today makes Lenaqar's SEO worse.

---

## 2. AqarExit competitive analysis

### 2.1 What they are

Near-identical concept, tighter framing. H1:
"البايع يسترجع كل اللي دفعه كاش، والمشتري ياخد سعر التعاقد القديم." Positioning:
"منصة التنازل عن وحدات التقسيط بدون أوفر." Free for sellers, 1.25% buyer commission.

### 2.2 Where they beat Lenaqar today

1. **680× the indexable inventory** — 2,720 listing pages vs 0 in production.
2. **Proper listing schema** — `Product`/`Offer`/`PropertyValue` on every listing.
3. **Descriptive, number-bearing titles and descriptions** on listing pages.
4. **Deeper funnel architecture** — separate `/sellers`, `/buyers`, `/how-it-works`,
   `/faq`, `/story`, `/exit-report`, `/developers` pages. Lenaqar has `/sell` and nothing
   for the buy side except the listing index.
5. **Bilingual with `hreflang`** — full `/en` subtree, `xhtml:link` alternates in the
   sitemap.
6. **A B2B page aimed at developers** — "عميل مش قادر يكمّل ≠ عقد لازم يتلغي" — a smart
   link-and-partnership magnet Lenaqar has no equivalent for.

### 2.3 Where they are wide open

**They have locked themselves out of AI search.** Their `robots.txt`:

```
User-agent: *
Content-Signal: search=yes, ai-train=no, use=reference

User-agent: GPTBot           Disallow: /
User-agent: ClaudeBot        Disallow: /
User-agent: Google-Extended  Disallow: /
User-agent: meta-externalagent  Disallow: /
User-agent: Applebot-Extended   Disallow: /
User-agent: CCBot            Disallow: /
User-agent: Bytespider       Disallow: /
User-agent: Amazonbot        Disallow: /
```

This is Cloudflare's default managed block, almost certainly switched on without a
decision being made. The consequence is the same either way: when someone asks ChatGPT,
Claude, Perplexity, or Gemini "إزاي أبيع وحدة مش قادر أكمّل أقساطها؟", AqarExit
**cannot be cited**. Their content is unavailable to the retrieval layer.

This is the strategic opening. GEO is the one arena where Lenaqar can lead from a
standing start, against a competitor that has voluntarily forfeited.

**Other gaps:**

- **Zero informational content.** 11 static pages, no blog, no guides. Every
  "ما هو الريسيل؟" / "الفرق بين الريسيل والتنازل" query is unclaimed by them.
- **`/faq` exists but carries no `FAQPage` schema** — no rich results, no answer-engine
  extraction.
- **No project, area, or developer landing pages.** "شقق للبيع في مدينتي",
  "ريسيل هايد بارك", "أسعار التجمع الخامس" — all uncontested by them.
- **UUID URLs** (`/buy/opportunity/001976e9-0a67-…`) — no keyword signal, same weakness
  as Lenaqar's short codes.
- **Sell-side-only concept.** They are strictly a زero-overprice assignment platform.
  Lenaqar's broader inventory — resale, old contracts, developer units, investment
  opportunities — is a genuinely wider keyword surface, if the pages exist to hold it.

### 2.4 SERP reality check

For the head terms (`شقق ريسيل`, `شقق للبيع في التجمع الخامس`), page one belongs to
Nawy, PropertyFinder, Dubizzle, and SemsarMasr — portals with domain authority neither
Lenaqar nor AqarExit will approach this year. **AqarExit does not rank for them either.**

Do not chase head terms. The winnable ground is the concept long tail
(بدون أوفر، تنازل، سعر التعاقد القديم), the informational layer, and AI answers — where
the competitive set is one competitor who has blocked the AI crawlers.

---

## 3. Keyword map

Volumes are not available without a paid Egypt-locale keyword tool (Ahrefs/Semrush are
listed in this workspace but unauthorized). Priority below is by **strategic value and
winnability**, and should be re-scored against real volume once GSC has 30 days of data.

### Tier A — concept long tail (winnable now, high intent)

| Keyword | Intent | Target page |
|---|---|---|
| تنازل عن وحدة / تنازل عن وحدات التقسيط | transactional | `/sell` |
| وحدة بدون أوفر / شقة بدون أوفر | transactional | `/opportunities` |
| بيع وحدة مش قادر أكمل أقساطها | transactional | `/sell` |
| إلغاء التعاقد مع المطور / استرداد فلوس الوحدة | transactional | `/calculator` |
| شراء وحدة بسعر التعاقد القديم | transactional | `/opportunities` |
| عقود قديمة / سعر قديم عقارات | commercial | `/opportunities` |

### Tier B — buy-side commercial (needs listing pages to exist first)

شقق ريسيل · عقارات ريسيل · وحدات للبيع بالتقسيط · عقار أقل من سعر السوق ·
فرص استثمار عقاري في مصر · شراء عقار بسعر أقل من السوق

Target: `/opportunities` + per-listing pages. **Blocked on P0-1** — with zero listings
indexed, none of this is reachable.

### Tier C — entity/geo (scalable, only where real inventory exists)

`شقق للبيع في {مشروع}` · `ريسيل {مشروع}` · `أسعار {مشروع}` · `وحدات {مطور}` ·
`عقارات {منطقة}` — for Madinaty, Hyde Park, New Cairo, South Med, Celia, Noor, TMG.

**Rule: generate a page only where ≥3 real listings exist for that entity.** Below that
threshold it is a thin page and a liability. This is what keeps the strategy on the
right side of "no mass-generated SEO pages."

### Tier D — informational / AEO (the GEO play)

ما هو الريسيل في العقارات؟ · ما الفرق بين الريسيل والتنازل؟ · ما معنى وحدة بدون أوفر؟ ·
كيف أشتري وحدة بسعر قديم؟ · إجراءات التنازل عن وحدة ورسومها · هل شراء وحدة بدون أوفر
أفضل؟ · كيف أحسب سعر المتر؟ · إيه اللي بيحصل لو ألغيت التعاقد مع المطور؟

Target: `/faq` + `/guides/*`. **Uncontested by AqarExit at the schema layer, and
uncontested by them entirely in AI retrieval.**

---

## 4. Recommended architecture

Adapted to what exists — not a rebuild. New routes marked **NEW**.

```
/                          home — split buyer/seller intent cleanly
/sell                      seller funnel (exists)
/calculator                exit calculator (exists)
/opportunities             buy-side index (exists) — add pagination
  /opportunities/[code]    listing detail (exists) — descriptive slug + schema
/faq                       NEW — FAQPage schema, the AEO anchor
/how-it-works              NEW — process, fees, timeline
/guides/[slug]             NEW — informational content, Article + FAQPage
/projects/[slug]           NEW — gated on ≥3 real listings
/developers/[slug]         NEW — gated on ≥3 real listings
/areas/[slug]              NEW — gated on ≥3 real listings
```

`/projects`, `/developers`, and `/areas` are already `Disallow`ed in robots.txt for the
CRM. Public equivalents must either use different paths or the robots rules must be
narrowed to the client-id-prefixed CRM variants — not left ambiguous.

---

## 5. Content plan

**Phase 1 (immediate, AEO foundation):** `/faq` with `FAQPage` schema, answering the
Tier D questions directly in the first sentence, then in depth. `/how-it-works` with the
real process, the real commission, and the real timeline — all of which are already
stated on `/privacy` and can be lifted verbatim rather than invented.

**Phase 2 (guides):** one guide per Tier D cluster. Direct answer first, then depth.
`Article` + `FAQPage` schema. Internal links out to `/opportunities` and relevant
project pages.

**Phase 3 (entity pages):** project/developer/area pages, generated only above the
3-listing threshold, each with real aggregate data — listing count, price range,
delivery years — computed from the feed, never estimated.

**Deal intelligence:** the brief's "Lenaqar Deal Score" concept should be built only on
fields the API actually returns. `totalPrice`, `downPayment`, `overPrice`,
`remainingAmount`, `installmentYears`, and `deliveryYear` are real; a market-average
comparison is **not** currently available in the payload. Publishing "وفر محتمل" or a
discount-vs-market percentage without a real market baseline would be fabricated data —
exactly what the brief prohibits. Ship the honest version now (cash required, cash
multiple, price/m², developer price with its date) and add market comparison only when a
sourced baseline exists.

The existing honesty disclaimer — "مضاعف الكاش بيقيس كفاءة الكاش بس — مش وعد بمكسب" —
is a real E-E-A-T asset. Keep it visible.

---

## 6. GEO / AI-search strategy

The thesis: **AqarExit blocks every AI crawler. Lenaqar should explicitly welcome them.**

1. Declare AI crawlers allowed by name in `robots.txt` — `GPTBot`, `OAI-SearchBot`,
   `ChatGPT-User`, `ClaudeBot`, `Claude-Web`, `PerplexityBot`, `Google-Extended`,
   `Applebot-Extended`, `meta-externalagent`, `Bytespider`, `CCBot`. Default-allow works,
   but an explicit allow is unambiguous and survives a future blanket-disallow edit.
2. `FAQPage` schema on `/faq`, `Article` on guides, `RealEstateListing` on listings —
   answer engines extract from structured data first.
3. Answer-first prose. One-sentence direct answer, then depth. This is what gets quoted.
4. Facts stated explicitly and atomically — commission percentage, timeline, what is and
   is not guaranteed — so a retrieval system can lift a single true sentence.
5. Dense, descriptive internal linking so crawlers reach every listing within 2 hops.

---

## 7. Internal linking

Listing → project → developer → area → related listings → related guide, and back.
Descriptive Arabic anchors ("شقق ريسيل في مدينتي"), never "اضغط هنا". Breadcrumbs on
every listing, localised — the current `BreadcrumbSchema` says "Home" in English.

Today `/opportunities/{code}` links to nothing except the index. Every listing is a
dead end.

---

## 8. Authority strategy

Publishable, citable data assets built from the feed — a monthly resale/assignment price
report, an opportunity index by project. These are what earn links from Egyptian
real-estate and business press, and what AI systems cite. Targets: Egyptian property
media, PropTech/startup press, business and investment publications, developer resource
pages. AqarExit's `/developers` B2B page is a model worth learning from — a partnership
angle that also attracts links.

Nothing here should be published until the underlying numbers are real and sourced.

---

## 9. Measurement baseline

Establish before further changes: GSC impressions, clicks, CTR, average position,
indexed-page count; organic sessions and leads; branded vs non-branded split; rankings
for the Tier A concept terms; and AI-search visibility (manual monthly checks in ChatGPT,
Perplexity, and Gemini for the Tier D questions).

Today's baseline is unambiguous: **4 indexed URLs, 0 indexed listings.**

---

## 10. Prioritised roadmap

### P0 — critical

| # | Item | Why |
|---|---|---|
| P0-1 | **Fix the empty production feed** | 4 indexed URLs vs 2,731. Everything else multiplies zero. Needs env/API investigation — not a code fix. |
| P0-2 | Remove doubled brand from every `<title>` | Every public page; wastes SERP pixels. |
| P0-3 | Keyword-led titles and descriptions | Currently target no real search demand. |
| P0-4 | Descriptive H1/title/description on listings | `madinaty b14` → type + rooms + size + project + city. |
| P0-5 | `RealEstateListing` schema on listings | Largest structured-data gap vs competitor. |
| P0-6 | Explicitly allow AI crawlers | The uncontested GEO opening. |
| P0-7 | Close the `/{clientId}/*` admin crawl hole | Admin pages currently crawlable at HTTP 200. |
| P0-8 | Fix the soft 404 | Unbounded 200-OK URL space. |

### P1 — high impact

`/faq` with `FAQPage` schema · `/how-it-works` · descriptive listing slugs ·
per-image alt text · fix `WebSite.potentialAction` or add real `?q=` search ·
pagination on `/opportunities` and raise the 40-unit cap · `hreflang` for ar/en ·
localise breadcrumbs · noindex `/match/[token]` · delete or fix the dead schema
components · retire the stale LenaAI SEO docs and rewrite `scripts/check-seo.js`.

### P2 — growth

Guides · project/developer/area pages behind the 3-listing threshold · deal-intelligence
layer once a sourced market baseline exists · monthly data report · backlink outreach ·
developer B2B page.

---

## Implementation log

Verified against a production build (`npm run build`, exit 0) served by `next start`,
not against the dev server.

**Done**

- **P0-2 / P0-3 — titles and descriptions.** Brand now appears exactly once per title.
  Home uses `title.absolute` to opt out of the layout template; the other four pages
  dropped their inline brand and let the template supply it. All five titles and
  descriptions rewritten around Tier A keywords (ريسيل، تنازل، أقساط، إلغاء التعاقد).
- **P0-4 — listing pages.** New `src/lib/lenaqar/listing-seo.js` builds the H1, title,
  and description from fields already in the payload. `madinaty b14` became
  `استوديو للبيع في madinaty b14 — 67 م²`, with a description carrying the real cash
  figure and delivery year. Building types and Egyptian place names now render in
  Arabic (reusing the CRM's `property.buildingTypes` dictionary); each listing image
  gets its own alt text.
- **P0-5 — `RealEstateListing` schema.** New `ListingSchema` component emits
  `RealEstateListing` → `Accommodation` + `Offer` + `PropertyValue`. All five JSON-LD
  blocks on a listing page parse as valid JSON. Every value traces to an API field;
  `downPayment` is an `additionalProperty`, not the offer price.
- **P0-6 — AI crawlers.** `robots.ts` now declares an explicit allow group for GPTBot,
  OAI-SearchBot, ChatGPT-User, ClaudeBot, PerplexityBot, Google-Extended, Applebot-
  Extended, meta-externalagent and others — the position AqarExit has forfeited.
- **P0-7 — admin crawl hole closed.** `robots.ts` now disallows `/*/units`,
  `/*/dashboard`, and every other rewritten CRM segment alongside their root forms.
- **Also fixed:** removed the `WebSite.potentialAction` SearchAction that pointed at a
  `?q=` parameter no route reads; localised the breadcrumb root from "Home" to
  "الرئيسية"; aligned the sitemap's `/opportunities` entry with the robots feed flag;
  added a branded root `not-found.jsx`; guarded the `[email]` CRM route so it no longer
  renders the CRM screen for arbitrary URLs; stopped studios rendering "0 غرف".

**P0-8 — partially fixed, and here is the honest status.**

Unknown URLs now render the branded 404 page with `robots: noindex` instead of the CRM
"Client Information" screen. **But they still return HTTP 200, not 404.** This is not
caused by the change — it is app-wide and pre-existing: `/opportunities/{bad-code}` and
`/allProberties/{bad-code}`, which have always called `notFound()` directly, return 200
too. I confirmed by experiment that `src/proxy.js` is not the cause (a path excluded
from the proxy matcher still returned 200). The cause is that the root layout awaits
`cookies()`, making the whole tree dynamic and streamed, so the 200 is committed before
`notFound()` resolves. Fixing it properly means moving locale detection out of the root
layout — an i18n refactor well beyond this pass, and not something to do unannounced.
Impact is now limited to soft-404 reports in Search Console and wasted crawl budget;
nothing gets indexed, because the 404 page is `noindex`.

**Not done — still the highest-value open item**

- **P0-1 — the empty production feed.** Untouched. Production still has 4 sitemap URLs
  and zero indexable listings. This needs someone with production env access to work out
  why `fetchOpportunities()` returns empty there and returns 40 units locally — API key,
  `BFF_SECRET`, or the `client_id=homey` inventory. Until it is fixed, every improvement
  above applies to listing pages that Google cannot find.

**Two data problems worth raising with whoever owns the API**

- `project_ar` is empty on the feed, so listing titles read `madinaty b14` in English on
  an Arabic page. A lookup table here would be guesswork ("b14" is a phase code); the
  fix belongs in the data.
- `/opportunities/[slug]` cannot be statically generated — `getPublicUnitByCode()` reads
  `cookies()`, so `generateStaticParams()` is wasted and every listing is SSR-on-demand.

**Also noted:** `npm run lint` is broken (`next lint` was removed in Next 16), and
`SEO_RULES.md`, `SEO_IMPLEMENTATION.md`, `docs/seo-geo-content-qc.md` plus
`scripts/check-seo.js` still enforce LenaAI rules that would actively damage Lenaqar's
SEO if followed.
