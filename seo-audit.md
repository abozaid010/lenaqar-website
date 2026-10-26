# Lenaqar — Nationwide SEO & AI Search Visibility Audit

**Audit date:** 2026-10-26  
**Live host audited:** `https://www.lenaqar.com/` (apex `https://lenaqar.com` → 308 to www)  
**Repo audited:** local `lenaqar` workspace (includes unpublished Buyer Guide work)  
**Market:** Egyptian residential buyers (request-first marketplace)

**Operating rules followed:** Evidence from live HTTP responses and repo inspection only. No invented rankings, volumes, or AI citation rates. Search Console / GA property access was **not** available in this session — organic KPI baselines must be filled after owner access.

---

## 1. Executive summary

Lenaqar’s live site already has solid fundamentals for a young marketplace: SSR Arabic HTML, unique titles on core pages, AI crawlers allowed, ~**496** sitemap URLs (mostly opportunity detail pages), GA (`G-L76Z647950`) + Meta Pixel present, and high-intent request landings for New Cairo / Zayed / October / ready-to-move / villas / North Coast.

The largest gaps between **buyer search intent** and **what Google/AI can currently cite** are:

1. **Wrong public contact numbers on production** (phone `+201036364340`, WhatsApp `wa.me/491745661918`) — destroys trust and conversion for organic visitors; fixed in repo, **not live**.
2. **Buyer Guide city architecture not deployed** — live `/guides` still shows only 2 short articles; `/guides/el-shorouk/` → **404**. Repo has 53 published guides (many still containing `[[VERIFY]]`).
3. **Host inconsistency:** primary UX is `www`; sitemap + many canonicals emit `https://lenaqar.com` (non-www). Soft duplicate / signal split risk.
4. **Location coverage incomplete vs target list:** no dedicated request landings for Madinaty, El Shorouk, Mostakbal City, Fifth Settlement (as its own hub), Noor City, or New Administrative Capital — only New Cairo (bundles التجمع), Zayed, October.
5. **Thin / VERIFY-heavy guide drafts** (≈195 `[[VERIFY]]` markers across ≈45 files) — if deployed as-is, risk of low-value/near-doorway pages and AI distrust. Prefer verified El Shorouk P1-quality pages first; keep others indexable only with clear “pending verification” framing or temporary `noindex` until audits arrive.
6. **Guide WhatsApp CTAs** use `data-analytics="click_whatsapp"` only — **no GA event fire** (unlike marketplace WhatsApp components).
7. **AI mention benchmark not run** in this session (no ChatGPT/Gemini/Perplexity query API). Protocol included below for owner/manual runs. Public web search for «لينا عقار» / lenaqar buyer queries did **not** surface lenaqar.com in the tool results sampled (brand visibility weak / noisy).

**Highest ROI path (30 days):** deploy contact + guides + www canonical consistency → add missing city request landings → verify/enrich price maps city-by-city → wire guide lead analytics → measure Search Console + GA.

---

## 2. Evidence sources

| Source | Result |
|---|---|
| `GET https://www.lenaqar.com/robots.txt` | 200; Allow includes `/guides/*`, `/opportunities/*`; AI bots listed; **no** `Disallow: /internal/` on live |
| `GET https://www.lenaqar.com/sitemap.xml` | 200; **496** `<loc>`; hosts all `https://lenaqar.com` (non-www) |
| `GET https://lenaqar.com/sitemap.xml` | 308 → www sitemap |
| `GET https://www.lenaqar.com/guides` | 200; title «دليل المشتري — اكتب طلبك بشكل أوضح»; **2** guide links only |
| `GET …/guides/el-shorouk/` | **404** |
| `GET …/` HTML | `telephone:+201036364340`; multiple `wa.me/491745661918`; gtag + Meta Pixel |
| `GET …/llms.txt` | Old copy; no city guide index; no WhatsApp 01002891933 rule |
| Local `content/guides/**` | 53 MD files, status `published` (editor choice 2026-10-26); ~195 `[[VERIFY]]` |
| Local `src/config/lenaqar-contact.js` | Correct `+201002891933` / network `+201016080323` — **not reflected live** |
| Analytics property / GSC | **Not accessed** — impressions/clicks/queries unknown |

---

## 3. Prioritized findings

### P0 — Fix before or with next production deploy

| ID | Finding | Evidence | Impact |
|---|---|---|---|
| P0-1 | Wrong WhatsApp + phone on live | Footer/HTML `+201036364340`, `wa.me/491745661918` | Broken conversion; schema `telephone` wrong |
| P0-2 | City guides 404 on live | `/guides/el-shorouk/` 404 vs repo routes | Zero organic capture for price/pros/compare queries |
| P0-3 | Sitemap/canonical host ≠ www | Sitemap locs `https://lenaqar.com/...`; browser prefers www | Diluted indexing signals |
| P0-4 | Mass VERIFY content if deployed blindly | 195 markers; many P1/P3 tables empty placeholders | Thin content / trust risk for Google + AI |

### P1 — High impact architecture & intent coverage

| ID | Finding | Evidence |
|---|---|---|
| P1-1 | Missing city request landings for Madinaty, Shorouk, Mostakbal, Fifth Settlement, Noor, NAC | Only 3 apartment city landings in `buyer-landings.js` |
| P1-2 | Fifth Settlement intent folded into New Cairo landing only | Title/desc mention التجمع but URL is `/apartments-for-sale/new-cairo` |
| P1-3 | Related links still point at pre-redirect guide paths | Works via 301 after deploy, but should target `/guides/buying/...` + city hubs |
| P1-4 | Guide WA clicks not in GA events | `GuideWhatsAppCta` / sticky: `data-analytics` only; no `trackEvent` |
| P1-5 | Live robots missing `/internal/` disallow | Live robots.txt dump; repo already fixed |

### P2 — Quality, GEO, measurement

| ID | Finding |
|---|---|
| P2-1 | `llms.txt` live outdated vs buyer-guide positioning |
| P2-2 | English support is effectively none (ar-EG only) — OK if intentional; don’t invent parallel EN sites without ops |
| P2-3 | Meta Pixel `VIEW_CONTENT_PATHS` under-covers `/guides/*` deep URLs |
| P2-4 | Opportunity pages dominate sitemap (good for inventory SEO) but educational internal links from guides → filtered opportunities are weak until guides are live |
| P2-5 | No measured AI citation baseline |

### What’s already good (preserve)

- SSR Arabic + `dir=rtl` / `lang=ar-EG`
- AI crawler allows (GPTBot, OAI-SearchBot, PerplexityBot, etc.)
- Request-first landings without fake inventory counts
- Opportunities feed in sitemap (~480 unit URLs observed)
- Organization / LocalBusiness / FAQ patterns on several pages
- Security headers (HSTS, etc.) present

---

## 4. Target location inventory

| Location | Official / common names | Live URL coverage | Repo guides | Gaps |
|---|---|---|---|---|
| New Cairo (broad) | القاهرة الجديدة | `/apartments-for-sale/new-cairo` | `/guides/new-cairo/*` | Deploy guides; clarify vs TG5 |
| Fifth Settlement | التجمع الخامس | Mentioned inside New Cairo landing | `/guides/fifth-settlement/*` | Dedicated request landing recommended |
| Madinaty | مدينتي | **None** (inventory may exist in feed) | `/guides/madinaty/*` | Landing + deploy guides |
| Mostakbal City | مدينة المستقبل | **None** | `/guides/mostakbal-city/*` | Landing + verify prices |
| El Shorouk | مدينة الشروق | **None** | `/guides/el-shorouk/*` (P1 strongest) | Landing + deploy |
| Sheikh Zayed | الشيخ زايد | `/apartments-for-sale/sheikh-zayed` | `/guides/sheikh-zayed/*` | Deploy guides; VERIFY prices |
| 6th of October | 6 أكتوبر / ٦ أكتوبر | `/apartments-for-sale/6th-of-october` | `/guides/6th-of-october/*` | Deploy guides |
| Noor City | مدينة نور / نور | Token in `SITE.network` only | **No guide** | Request landing only until fact sheet |
| New Administrative Capital | العاصمة الإدارية | Address entity only | **No guide** | Request landing; avoid price claims without sources |
| North Coast | الساحل الشمالي | `/chalets-for-sale/north-coast` | — | Out of city week plan; keep |
| Egypt villas / ready | — | `/villas-for-sale/egypt`, `/ready-to-move-properties` | buying guides | Cross-link after deploy |

**Hierarchy to preserve:** City → district/حي → compound/كمبوند → project phase → unit. Do not create one URL that pretends a compound is a city.

---

## 5. Keyword → URL mapping (selected high-intent)

Legend: **Live** = currently indexable on production · **Repo** = exists locally · **Gap** = missing/inadequate

### El Shorouk

| Query intent | Best URL | Fit | Action |
|---|---|---|---|
| أسعار الشقق في الشروق / سعر المتر | Repo `/guides/el-shorouk/prices-2026/` | Strong (sourced Aqarmap Oct 2026) | **Deploy**; improve |
| مميزات وعيوب الشروق | Repo `/guides/el-shorouk/pros-cons/` | Medium | Deploy; finish VERIFY |
| شقق للبيع في الشروق | Gap → add `/apartments-for-sale/el-shorouk` | — | **Create** request landing |
| لو معاك 3 مليون في الشروق | Repo `/guides/el-shorouk/budget-3m/` | Strong twin of reel | Deploy |
| الشروق ولا التجمع | Repo `/guides/compare/el-shorouk-vs-fifth-settlement/` | Weak (VERIFY) | Improve after TG5 numbers |

### Fifth Settlement / New Cairo

| Query | Best URL | Fit | Action |
|---|---|---|---|
| شقق للبيع في التجمع الخامس | Live New Cairo landing (partial) | Partial | Add TG5 landing or strengthen H2/FAQ on New Cairo + guide hub |
| أسعار التجمع الخامس | Repo `/guides/fifth-settlement/prices-2026/` | Weak VERIFY | needs_numbers / audit before promoting |
| أفضل مناطق السكن في التجمع | Repo pros-cons | Weak | Improve |
| شقق للبيع في القاهرة الجديدة | Live `/apartments-for-sale/new-cairo` | Good request-first | Improve; link guides |

### Madinaty / Mostakbal

| Query | Best URL | Action |
|---|---|---|
| شقق للبيع في مدينتي | Gap | Create landing; deploy guides after numbers |
| أسعار مدينتي | Repo prices VERIFY | Audit first |
| مدينتي ولا المستقبل | Repo compare VERIFY | Improve with verified delivery facts |
| مدينة المستقبل تقسيط / تحت الإنشاء | Repo red-file + prices | Due-diligence angle (good GEO); verify |

### Zayed / October

| Query | Best URL | Action |
|---|---|---|
| شقق للبيع في الشيخ زايد | Live landing | Link city guides after deploy |
| شقق للبيع في 6 أكتوبر | Live landing | Same |
| زايد ولا أكتوبر | Repo compare VERIFY | Improve from Doc 01 audit research |

### Noor / NAC

| Query | Best URL | Action |
|---|---|---|
| شقق في مدينة نور / نور | Gap | Request landing only; **no** invented price map |
| العاصمة الإدارية شقق للبيع | Gap | Request landing; cite only verified sources later |

### Evergreen buyer

| Query | URL | Action |
|---|---|---|
| إزاي أكتب طلب عقاري | Live old path → 301 to `/guides/buying/...` after deploy | Keep |
| ريسيل ولا إطلاق جديد | Same | Keep + internal links |
| إلغاء ولا ريسيل | Repo `/guides/buying/cancellation-vs-resale/` + `/calculator` | Deploy |

**Cannibalization watch:** New Cairo landing vs Fifth Settlement landing vs `/guides/new-cairo` vs `/guides/fifth-settlement` — differentiate: landings = request CTA; guides = research/prices; opportunities = inventory.

---

## 6. Competitor & AI visibility

### Competitors (observable category — not ranked here)

Typical Egyptian SERP/AI sources for these queries (category list, not a measured share):

- Listing portals: Aqarmap, Property Finder, Nawy, Dubizzle  
- Developer / project sites  
- Independent publishers / agency blogs (e.g. area “pros & cons” posts)  
- Prior internal benchmark mention: AqarExit (see `docs/lenaqar-seo-geo-strategy.md`, Aug 2026)

**Not claimed:** traffic, keyword volumes, or current SERP positions — GSC not connected in this audit.

### AI crawler access (measured)

Live `robots.txt` **allows** GPTBot, OAI-SearchBot, ChatGPT-User, PerplexityBot, Google-Extended, etc., on guides and opportunities. Good for GEO. `llms.txt` exists but is incomplete on production.

### AI answer benchmark protocol (to run manually / later)

For each city, ask ChatGPT, Gemini, Perplexity (same day, logged-out where possible):

1. «متوسط سعر الشقق في [المدينة] 2026؟»  
2. «عايز أشتري شقة جاهزة في [المدينة] بميزانية X — أبدأ بإيه؟»  
3. «إيه الفرق بين [مدينة أ] و[مدينة ب] للسكن؟»  
4. «مين لينا عقار / lenaqar؟»

Record: mentioned? linked? accurate buyer-first description? who else cited?

**Status this audit:** protocol only — **not executed** (no assistant query tooling with citation capture in-session). Do not treat as pass/fail.

---

## 7. Recommended improvements (impact × effort)

| Priority | Work | Impact | Effort | Verification |
|---|---|---|---|---|
| P0 | Deploy contact fix (`01002891933`) | Critical | Low | Live HTML grep; schema telephone |
| P0 | Deploy Buyer Guide routes + published MD | Critical | Med | 200 on city hubs; sitemap includes guides; no soft-404 |
| P0 | Force www in `SITE.url` / sitemap / canonicals | High | Low | All locs `https://www.lenaqar.com` |
| P0 | Policy for VERIFY pages (noindex or disclaimer + enrich) | High | Med | Spot-check indexability |
| P1 | Add request landings: Madinaty, Shorouk, Mostakbal, Fifth Settlement, Noor, NAC | High | Med | Titles/H1; sitemap; internal links |
| P1 | Wire `click_whatsapp` + `lead_code` to GA on guides | High | Low | GA DebugView |
| P1 | Fix related links → buying + city hubs | Med | Low | Crawl internal links |
| P1 | Refresh live `llms.txt` / `llms-full.txt` | Med | Low | Fetch after deploy |
| P2 | Enrich city fact sheets from audits (owner) | High | High | Remove VERIFY; date_updated |
| P2 | Expand Meta ViewContent paths for guides | Low | Low | Pixel helper |
| P2 | Run AI benchmark spreadsheet | Med | Med | 8 cities × 4 prompts |

---

## 8. 30-day plan & KPIs

### Week 1
- Production deploy: contact + guides + www canonical + robots `/internal/`
- Decide VERIFY policy (recommended: keep El Shorouk P1 indexable; set other price maps to `noindex` until audit **or** leave indexable with visible “أرقام قيد التأكيد” — owner call)
- Add city request landings (6)
- Wire guide WhatsApp analytics

### Week 2–3
- Ingest owner audits → replace VERIFY on Madinaty → Mostakbal → TG5
- Strengthen internal links: landings ↔ guides ↔ `/opportunities` ↔ `#buy-request`
- Update llms.txt summaries for verified pages only

### Week 4
- AI benchmark round 1 (record sheet)
- GSC: inspect indexed guide URLs, fix coverage issues
- Review cannibalization queries for New Cairo vs TG5

### KPIs (measure after deploy + ≥14 days crawl; baselines TBD in GSC/GA)

| KPI | Target (directional) | Source |
|---|---|---|
| Indexed valuable non-opportunity pages | Guides hub + ≥7 city hubs + landings indexed | GSC URL inspection |
| Organic impressions (Search) | ↑ vs pre-deploy week | GSC |
| Organic clicks to `/guides/*` + city landings | ↑ | GSC |
| `buy_request_submitted` + WhatsApp clicks with `lead_code` | Trackable >0 on guides | GA4 |
| Qualified WhatsApp leads from organic | Owner-defined | Lead sheet |
| AI mention/citation rate | Benchmark scorecard ≥ baseline | Manual AI protocol |

**Do not claim ranking wins without GSC evidence post-deploy.**

---

## 9. Implementation plan for this repo session (next)

Immediately after this document:

1. Align `SITE.url` default / sitemap emission toward `https://www.lenaqar.com` when env unset or normalize.
2. Add missing buyer landings (request-first, no fake prices).
3. Fix related guide hrefs; wire guide WhatsApp GA events (`click_whatsapp` + lead_code).
4. Soften risk: ensure guides with heavy VERIFY expose clear disclaimer in layout; optional robots noindex helper for `needs_numbers`-class content if we reintroduce status — currently all `published` by editor request.
5. Update Meta ViewContent path prefixes; refresh `public/llms.txt` already done locally.
6. Record work in `seo-progress.md`.

**Blocked on owner:** production deploy; Search Console access; city price audits; AI benchmark runs; Facebook Page WhatsApp button (still noted in research tracker).
