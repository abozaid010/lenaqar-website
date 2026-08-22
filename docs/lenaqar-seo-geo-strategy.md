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

## Implementation log — pass 2 (2026-08-21)

Pass 1 (2026-08-20) fixed titles, listing metadata, `RealEstateListing` schema, the AI
crawler allowlist and the admin crawl hole. Since then the CRM route group was removed
from this repo and the production feed outage was fixed upstream, so pass 2 re-measured
everything before changing anything.

Verified against a production build (`npm run build`, exit 0) served by `next start`.

### P0 — inventory ceiling: done

**Measured first.** Walking the API's own cursor pagination
(`/public/v1/units?client_id=lenaqar&purpose=sell&is_primary=false`) returned
**135 units, all 135 listable** (`totalPrice > 0`). The site was publishing 40 —
`maxPages 4 × pageSize 16 = 64` fetched, then `.slice(0, 40)`. 95 units (70%) were
invisible to search.

- `SITE.feed` bounds raised to `pageSize 50 / maxPages 30 / maxUnits 1500`. These are
  runaway guards, not a product cap: the cursor loop already stops on
  `has_more_next: false`, so the whole catalogue publishes and only a looping API
  reaches these numbers.
- `/opportunities` paginated at `SITE.pageSize = 24`. Verified: exactly **135 cards
  across 6 pages**, no gaps and no duplicates. Page weight dropped from ~286 KB (40
  cards, one document) to ~180 KB.
- Pagination is real `<a href>` links, not buttons — that is the only path a crawler has
  to units below page 1. Filters carry across pages; changing a filter resets `page`.
- Each page is self-canonical (`?page=2` canonicals to itself). Filter combinations still
  all fold back to the clean `/opportunities` URL, so facets cannot spawn indexable
  duplicates while paginated units stay reachable.
- An out-of-range `?page=` now calls `notFound()` instead of clamping — clamping served
  the last page under unlimited distinct self-canonical URLs.

**Result: sitemap went from 46 URLs / 40 listings to 141 URLs / 135 listings.**

### P1-3 — TTFB and static rendering: done, and it was the biggest structural win

The root layout was `async` and read `cookies()` for a `lang` value that no longer
decides anything: the CRM (the only English consumer) is gone, there is no language
switcher, and `LenaqarLocale` already forces `ar` on every public page. That one read was
opting **every route** into dynamic rendering.

Removed it, and routed `fetchOpportunityByCode` off the CRM's cookie-reading
`axiosInstance` onto the same cookie-free `bffFetch` path the feed uses — consolidated
into one `publicApiGet()` helper, so there is now a single server→backend call site for
the public catalogue.

Build output before → after:

| Route | Before | After |
|---|---|---|
| `/opportunities/[slug]` | `ƒ` dynamic | `●` **135 pages prerendered** |
| `/`, `/sell`, `/calculator`, `/how-it-works`, `/privacy` | `ƒ` dynamic | `○` static |

Measured TTFB on a listing page: **1.8 ms** (was ~650 ms in production).

### P1-1 — FAQ: fixed a live policy violation, not just a gap

`FaqSchema` was already emitting `FAQPage` markup with five Q&As on `/how-it-works` —
but **none of those questions or answers were rendered on the page**. Structured data
that does not match visible content is a Google structured-data policy violation and is
grounds for a manual action.

Rather than add a separate `/faq` route (YAGNI — `/how-it-works` already owns this
content and is already in the sitemap and robots allowlist), the same five entries now
render visibly through a new `FaqSection`. Both the schema and the section read one
`FAQ_IDS` list in `src/lib/lenaqar/faq.js`, with the strings in the locale, so an entry
cannot exist in markup without also rendering. The wording is the team's existing copy,
unchanged.

Verified: **5/5 schema entries have matching visible text** in the served HTML.

### P1-2 — `project_ar`: measured, not fixable in code

**67 of 135 units (50%) have no `project_ar`.** This is data entry, not a translation
capability — the same projects already appear in both forms in the feed, so the site
renders `شقة 3 غرف للبيع في مدينتي ب 14` for one unit and
`شقة 3 غرف للبيع في madinaty b14` for another.

The concentration makes this cheap to fix upstream. `madinaty` alone is spelled **nine
different ways** across ~19 units (`madinaty b14`, `madinaty b15`, `madinaty b10`,
`madinaty b11`, `madinaty b1`, `madinaty b6`, `madinaty`, `Madinaty`, `b14`), plus
19 units with no project at all. Normalising the madinaty variants fixes ~19 units.

Separately, `PLACES_AR` was extended after auditing all 38 distinct city/district values
in the feed against the map: added `fifth settlement → التجمع الخامس` (a top-volume
Egyptian keyword that was rendering in English), plus `6 october`, `el shorouk`,
`alamein new city`, `madinaty`, `rehab`, `montaza`, `al-abbaseya`, `marina`. The
remaining unmapped values are project and zone codes leaking into the `district` field
(`mu-23`, `r8 district`, `c1`, `town center mall`, `green river`) — those correctly fall
through to the raw value rather than being guessed at.

### P1-4 — `notFound()` returning HTTP 200: root-caused, partly fixed

Static routes now return a correct **404** — `/no-such-page` verified. That came free
with the P1-3 layout fix.

Dynamically-rendered routes still return **200** with the not-found body:
`/opportunities/{unknown-slug}` and `/opportunities?page=99`.

This is **framework behavior in Next 16.2.7, not something in this codebase.** Proven by
elimination, each tested against a production build:

1. Not the proxy — a path excluded from the `proxy.js` matcher behaved identically.
2. Not the root layout — removing `cookies()` fixed static routes only.
3. Not `loading.jsx` / Suspense — removing the boundary on `[slug]` changed nothing.
4. A scratch route containing nothing but `export const dynamic = "force-dynamic"` and
   `notFound()` also returned **200**.

**Deliberately not "fixed" by setting `dynamicParams = false`** on `/opportunities/[slug]`.
That would produce a true 404 for unknown slugs, but `generateStaticParams` only runs at
build time — so any unit added to the backend between deploys would 404 until the next
build. Trading live inventory for a status code is the wrong way round when inventory is
the thing this whole roadmap is trying to grow.

Impact is contained: those responses carry `noindex, follow` (verified in the served
HTML), so nothing is indexed. The residual cost is soft-404 reports in Search Console and
some wasted crawl budget. Worth revisiting on a future Next upgrade.

### Files touched

`src/config/site.js` · `src/app/layout.jsx` · `src/lib/lenaqar/opportunities.server.js` ·
`src/app/(lenaqar)/opportunities/page.jsx` · `opportunities-page-content.jsx` ·
`src/components/lenaqar/opportunity-pagination.jsx` (new) · `opportunity-filters.jsx` ·
`src/lib/lenaqar/faq.js` (new) · `src/components/lenaqar/faq-section.jsx` (new) ·
`src/components/schema/FaqSchema.jsx` · `how-it-works-content.jsx` ·
`src/lib/lenaqar/listing-seo.js` · `public/locales/lenaqar-{ar,en}.js`

### Still open

- **`project_ar` on 67 units** — backend data task, quantified above.
- **`notFound()` → 200 on dynamic routes** — framework limitation, noindex-contained.
- **P2 items untouched:** descriptive listing slugs (still `aXcvoehA`), project/area
  landing pages, guides, internal linking between listings.
- `npm run lint` is still broken (`next lint` was removed in Next 16), and
  `SEO_RULES.md` / `SEO_IMPLEMENTATION.md` / `scripts/check-seo.js` still enforce LenaAI
  rules that would damage Lenaqar's SEO if followed.
