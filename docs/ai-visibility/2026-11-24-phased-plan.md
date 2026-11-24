# Revised plan: LenAqar discovery and citation in AI search (buyers and sellers)

Plan only. Nothing here is implemented, sent, merged or deployed.

## Context

Goal: Egyptian buyers and sellers who ask ChatGPT, Claude, Gemini, Perplexity or Google AI find LenAqar crawlable, accurate, and worth citing. The asset is 30k+ primary and resale units plus live buyer requests. Today the public site exposes 872 units, so most of that asset is invisible. The revised order is: explain the gap, then crawlability and indexing, then accurate property data, then inventory and demand pages, then guides. Dates, titles and llms.txt are supporting fixes inside Phase 1. No ranking or citation outcome is promised.

## What is already known (read-only probes, 2026-11-24)

- The site asks the API for tenant `lenaqar`, `purpose=sell`, `is_primary=false` (`src/config/site.js`). That returns 872 resale units; 833 pass `isOpportunityIndexable` and are in the sitemap.
- Tenant `lenaqar` has 0 primary units in the public API.
- Without a tenant filter the API returns tenant `public`, source `import_v2`, 15 of 16 units primary. The 30k+ units are most likely there (hypothesis; the API gives no total, so the count is unknown).
- The API returns 16 units per page although the site asks for 50. With `SITE.feed.maxPages = 100` the site can load about 1,600 units at most. The current data layer cannot carry 30k units (hypothesis, to confirm in Phase 0).
- Existing work to keep: 12 hubs, guides with dated asking-price tables, `llms.txt`, valid JSON-LD, `scripts/seo-health.mjs`, panel `docs/ai-visibility/panel-v1.json`, tracker `ai-visibility-feature-progress.json`, `docs/ai-visibility/corroboration-plan.md`.

## Phases

### Phase 0 — Inventory truth (P0, read-only, about half a day)
Explain 30k+ vs 872 with numbers before building anything.
- Count units by tenant × primary/resale × purpose × visibility × data source, from the backend (LENAAI-Agent, read-only queries).
- Funnel: total → returned by the public API → listable → indexable → in sitemap.
- Quality of the `public` import: share with price, area, delivery, developer, project, photos; duplicates; whether a row is a real unit or a price-list line; date of the source price list.
- Confirm the 16-per-page cap and the 1,600-unit ceiling.
- Output: `docs/ai-visibility/2026-11-inventory-gap.md` with query, date and source for every number.
- **Acceptance:** at least 95% of the 30k+ units are assigned to a named reason; no code or data changed.
- **Owner gate G1:** which primary units may be published (permission, labels, minimum data).

### Phase 1 — Crawlability and indexing (P0, 1 PR, about 1 day)
- Baseline first: Search Console indexed vs submitted (898 URLs), Bing Webmaster + IndexNow (B13), AI-crawler hits in Vercel logs (B9), `/opportunities` cache-miss TTFB 3.4 s (B11), missing pages returning HTTP 200.
- Fix what the baseline shows. Make the catalogue fetch and sitemap safe for the inventory size found in Phase 0 (sitemap index, paging that reaches every listing).
- Supporting fixes: `dateModified` + `<time>` on listings from `unit.updatedAt` (valid, not future; never `datePosted`, never "verified"); brand once in `/guides` and `/privacy` titles; hubs listed in `llms.txt`.
- **Acceptance:** `seo-health` 0 FAIL; every indexable listing is in the sitemap with a real `lastmod` and reachable in 3 clicks or fewer; audit E3 above the 0.25/4 baseline; indexed/submitted ratio recorded.

### Phase 2 — Accurate property data (P1, 1–2 PRs, about 2 days)
- Listing page as a data page: existing fields under `<h2>` sections (price, price per m² labelled as computed, specs, delivery, location, payment only when `mayShowMoneySplit`), plus the existing before-you-pay checklist copy.
- Freshness policy (B10; 88 of 118 Madinaty records older than 2026-10-01 still show InStock). **Owner gate G2:** age after which availability is no longer stated.
- Fix the 29 units whose area is not in the catalogue (`docs/instant-match-offcatalog-units-2026-11-19.csv`).
- If G1 allows: publish primary units that pass a quality gate, clearly labelled primary vs resale, with source and date.
- **Acceptance:** 20 sampled listings have JSON-LD values equal to the visible values and 3 or more H2; 0 sitemap listings fail the quality gate; no availability claim beyond the G2 age.

### Phase 3 — Inventory and demand pages (P1, 2 PRs, about 3 days)
A page exists only with enough real records; below the threshold it is not built or is `noindex`. **Owner gate G3:** threshold (proposal: 10 listings or 5 requests).
- Area × type hubs show real listings and real requests: count, median asking price per m² with sample size and date (existing price-insight method). Includes the 5 approved hubs: apartments in Nasr City, First Settlement, El Obour, Heliopolis; villas in New Cairo.
- Project pages for primary inventory (after G1): developer, unit types, price range from data, date.
- Seller demand pages: "buyers looking in X" aggregated from live requests (count, budget range, rooms), linking to `/sell`. Aggregated and stable, so the 2026-11-18 decision to keep single request pages `noindex` stands.
- **Acceptance:** every page meets G3, has a unique title and H1, numbers reproducible from the API on the date shown, sitemap entry, and links from guides and listings. `ItemList` JSON-LD only where listings are rendered.

### Phase 4 — Trustworthy guides (P2, ongoing, about 1 guide per day)
- Finish the resale step-by-step guide with official sources (B3). Methodology page (B4, needs D4). Named author and reviewer (B7, needs D3).
- Budget pages from inventory ("what 4M buys in Madinaty") and seller guides (pricing a resale unit, documents, commission).
- Monthly refresh of asking-price tables with update history.
- **Acceptance:** every number has a source and date; no placeholder text on an indexable page; FAQ JSON-LD equals the visible FAQ.

### Phase 5 — Off-site corroboration (parallel, drafts only, about half a day)
`docs/ai-visibility-offsite.md` built on the existing corroboration plan: indexing checks, entity profile text (unknown fields marked), 10 verified Egyptian property sites with Arabic pitches, 5 YouTube outlines from guide numbers, `offsite.json` for the audit. The owner performs every external action.

## Measurement (monthly, raw counts, unknown is never 0)

| What | Source | Baseline |
| --- | --- | --- |
| Citations | Panel v1, 3 assistants; seller prompts as a separate track | 2026-11-15: mention 0/72, citation 2/72, recommendation 0/72, branded 10/10 |
| Referrals | GA4 "AI Assistant" channel; Search Console; crawler hits in logs | 24 sessions 11-05 to 11-17; El Shorouk guide 102 impressions |
| Inquiries | GA4 `buy_request_submitted`, `sell_request_submitted`, `whatsapp_click` (interaction, not a lead); CRM match by lead code | 41 buy requests (1 AI-referred by 11-17), 1 sell request, 43 WhatsApp clicks |
| Technical | `ai_visibity_judge` audit; `seo-health` | 94.3/100 provisional, E3 0.25/4 |

No causation claims; before/after numbers are reported with dates only.

## Working rules

- One branch and one small PR per phase from `origin/main`; first branch `feat/ai-visibility` (Phase 1). The owner merges. The untracked `docs/instant-match-ux-audit-2026-11-19.md` and all stashes stay untouched.
- Tracker `ai-visibility-feature-progress.json` updated in every PR.
- Stop and ask when a page would show a number not in existing data, a test or build fails twice, or an external action is needed.

## Next action

Approve this plan, then Phase 0 starts: the unit counts by tenant.
