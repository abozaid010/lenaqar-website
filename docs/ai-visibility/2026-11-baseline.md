# AI-search visibility: evidence baseline (2026-11-15)

Labels: **V** verified (evidence and date given) · **S** supplied but unverified · **I** inaccessible · **H** hypothesis.
Goal: improve the chance that ChatGPT Search, Claude web search and Gemini cite or accurately recommend LenAqar, and that this produces qualified inquiries. No inclusion, ranking, citation or training outcome is promised.

## 1. Measurement tracks: status on 2026-11-15

| Track | Source of truth | Status |
|---|---|---|
| A. Technical eligibility | `scripts/seo-health.mjs`, plus Search Console and server/CDN logs where available | **V** health script run (section 4). GSC: **I**. Real crawler logs: **I** |
| B. AI visibility | Saved consumer-app answers (`docs/ai-visibility/runs/`) | Not started. Needs a decision on accounts/runtime. All 160 API runs on 2026-11-02 were skipped (no keys), so they are not observations |
| C. Acquisition | GA4 `G-3QC63HK3DQ`, plus GSC | **I**: no read access from this machine. Recorded as unknown, not zero |
| D. Business outcomes | GA4 events, plus the lenaai.net CRM (`lead_code` / UTM) | **I**. `whatsapp_click` counts as an interaction, never a lead. "Qualified lead" is not yet defined by the owner |

Rule: when data is missing or delayed, the metric is recorded as unknown, never 0. Direct traffic is never counted as AI traffic.

## 2. Original-plan claims, rechecked

| Claim | Label | Evidence (2026-11-15) |
|---|---|---|
| GA4 tag is live | V (tag) / I (collection) | Homepage HTML contains `gtag/js?id=G-3QC63HK3DQ`. `/g/collect` and Realtime not checked |
| Conversion events exist | V (code) / I (firing) | `src/constants/analytics.js`: `buy_request_submitted`, `sell_request_submitted`, `whatsapp_click` |
| robots.txt allows AI crawlers | V | Live robots.txt has 18 user-agent groups (`*` + 17 named). `/_next/` is not disallowed |
| AI crawlers get 200 | V (simulated only) | Simulated UAs from one Mac IP. Real crawler IPs: **I** |
| llms.txt helps AI visibility | V live / H impact | Google says AI features need no special AI text files |
| Sitemap lastmod is build time | **False** | `src/app/sitemap.ts`: a stable constant for static pages and per-guide `date_updated` |
| Site is Arabic-only | V | `/en` → 404; no hreflang |
| Tracker open items | S | `seo-feature-progress.json` last updated 2026-11-04 |
| Resale guide noindex is caused by `date_planned` | **False** (checked in code) | `seo_index: false` plus «تحت المراجعة» placeholders. It is intentional: `REPORT/seo-release-2026-11-03/excluded-guides-triage.json` (content_incomplete) |

## 3. Official crawler documentation (read 2026-11-15)

| Provider | Search / discovery | User-initiated retrieval | Training | Verification |
|---|---|---|---|---|
| OpenAI | `OAI-SearchBot` decides inclusion in ChatGPT search. Follows robots.txt; changes take ~24 h | `ChatGPT-User`. robots.txt may not apply; not used for search inclusion | `GPTBot`, independent of search | `openai.com/searchbot.json`, `chatgpt-user.json`, `gptbot.json` |
| Anthropic | `Claude-SearchBot` | `Claude-User` | `ClaudeBot` | `claude.com/crawling/bots.json` |
| Google | `Googlebot` index. AI Overviews and AI Mode need only "indexed + snippet-eligible"; no special markup or llms.txt. Traffic is in GSC Performance under "Web" | Google user-triggered fetchers | `Google-Extended` token: Gemini training **and Gemini Apps grounding**. It does not affect Google Search, AI Overviews or AI Mode | Reverse plus forward DNS, or the published IP JSON files |

Sources: developers.openai.com/api/docs/bots · support.claude.com/en/articles/8896518 · developers.google.com/search/docs/crawling-indexing/google-common-crawlers · …/appearance/ai-features · …/crawling-indexing/verifying-googlebot.
Not documented (**H**): which third-party indexes ChatGPT search and Claude web search query, beyond their own bots.

## 4. Technical findings

- **V** `seo-health.mjs` against production, 2026-11-15: 80 PASS, 6 WARN, 1 FAIL. Raw JSON: `REPORT/seo-health/2026-11-15-production-before.json`.
  - FAIL: `/apartments-for-sale/madinaty` does not link `/guides/madinaty`. The landing component renders only the `related` entries that are other landing pages, so every guide link in `buyer-landings.js` was silently dropped on all 12 area pages.
  - WARN: listings have no link to their area guide; only the site-wide footer links two price maps.
- **V** 7 guide hrefs in the landing data use a trailing slash, which answers with a 308 redirect.
- **V** 3 compare guides are `noindex` and still contain placeholders. They answer the "compare areas" prompt but are not ready.
- **V** `/guides/madinaty/prices-2026` uses Aqarmap asking prices as its **only** data source. Its author is the Organization only; no named person.
- **V** 13 of 19 sampled listings were last updated before 2026-10-01 and are still marked `InStock`. The policy question goes to the owner; no change is made.
- **V** `/opportunities` TTFB: 3.4 s on a cache MISS (single request). Under 1.5 s median in the health run.
- **V** `/about` returns 404. No page names the team or reviewers.
- **V/H** 2 of 4 photos on `/opportunities/kBqU7H1A` fail. The origin (`api.lenaai.net/gcs/lenaqar_c3c201eb`, `…54e8fea6`) returns 404, and production `/_next/image` answers **402 `OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED`**. **H:** the Vercel image-optimization quota may be exhausted for uncached images; cached ones still return 200. Owner to check Vercel usage.

## 5. Changes in this PR (Day 1)
1. Area pages render their indexable guide links: the price map and the hub, in canonical form with no trailing slash. Unfinished (noindex) guides are skipped automatically and start showing once indexable.
2. Listings in a known guide area link to that area's price map and hub. Unknown areas get no link rather than a guessed one.
3. `scripts/seo-health.mjs` adds a repeatable technical eligibility check. Simulated crawler requests are labeled as simulated.
4. The resale guide stays `noindex` (intentional). Finishing it is Day 3–5 content work with official sources.
