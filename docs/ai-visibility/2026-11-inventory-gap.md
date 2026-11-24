# Inventory gap: "30k+ units" vs 872 public listings (2026-11-24)

Phase 0 of the AI-visibility plan. Read-only. No code or data was changed.
Labels: **V** verified (source + date), **H** hypothesis, **unknown** = not measured (never 0).

## Answer in one line

The site asks the API for one slice only: tenant `lenaqar`, resale, for sale. That slice has 872 units. The developer (primary) inventory, about 24.8k units in 874 projects, is stored under tenant `public` and the site never queries it.

## Numbers

| # | What | Count | Source (all 2026-11-24) | Label |
| --- | --- | --- | --- | --- |
| 1 | Units the site can show: `client_id=lenaqar`, `purpose=sell`, `is_primary=false`, `visibility=visible` | 872 | `GET /public/v1/units`, paged to the end (55 pages) | V |
| 2 | Of these, indexable (price + area + delivery) and in the sitemap | 833 | audit of `sitemap.xml` (898 URLs, 833 listings) | V |
| 3 | Primary units under tenant `lenaqar` | 0 | same endpoint with `is_primary=true` | V |
| 4 | Projects under tenant `public` | 874 | `GET /public/projects` (one call, 886 projects in total) | V |
| 5 | Sum of the stored `units_count` on those 874 projects | 24,785 | same call | V for the stored counter; the true unit count is unknown |
| 6 | `public` projects with at least 1 unit / at least 10 units | 813 / 470 | same call | V |
| 7 | Projects and stored unit counter of all other tenants (broker CRM accounts) | 12 projects / 129 units | same call | V |
| 8 | Resale units under tenant `public` | unknown | 96 seen in the first 6 pages; not paged to the end | unknown |
| 9 | Units of broker tenants with no project record | unknown | needs a database count | unknown |
| 10 | Exact size of the whole units collection | unknown | a direct database count was not permitted in this session | unknown |

Rows 1 + 5 give 25,657 units. Against "30k+" that explains about 85% (estimate). The plan's 95% target is **not met**: rows 8–10 need one count per tenant from the database (`units_v1`, grouped by `clientId`, `is_primary`, `purpose`, `visibility`). That is an owner action or a permission to grant.

### Where the developer inventory is (stored counters, tenant `public`)

| City | Units |
| --- | --- |
| New Cairo | 6,999 |
| New Administrative Capital | 5,182 |
| North Coast | 4,295 |
| 6 October | 2,979 |
| Cairo | 2,198 |
| Sheikh Zayed | 1,483 |
| Other cities | 1,649 |

## Data quality of the developer inventory (sample, not the whole set)

Sample: first 20 API pages, 320 units, `client_id=public`, `purpose=sell`, `is_primary=true`. The API order is not random, so treat this as an indication.

- Price, area, delivery, developer, project, unit code: 320/320 each.
- At least one image: 305/320. Rooms: 265/320. Down payment: 300/320. District: 296/320.
- Would pass the site's indexable rule (`isOpportunityIndexable`): 320/320.
- Rows identical to another row in project + type + area + rooms + price: 0.
- Source: all `import_v2`. 178 projects, 100 developers in the sample.
- Last update month: 140 in 2026-11, 50 in 2026-09, 44 in 2026-07, 86 between 2026-02 and 2026-06. So more than half the sample is older than two months.

Resale under tenant `public` (first 6 pages, 96 units): price 96/96, area 94/96, images 38/96, developer 58/96; sources `website` 80, `ai_extraction` 9, `ai_generated` 6.

## Why the site cannot simply switch the filter

1. **Page size.** The API returns 16 units per page whatever is asked (`LENAAI-Agent/src/database/firestore_units_db.py:2123`). The site asks for 50 and sets `maxPages: 100`, so the real ceiling is 1,600 units; above it the catalogue fetch throws (`fetch-cursor-pages.js`), it does not truncate. 872 units already take 55 calls.
2. **Rate limit.** Public endpoints allow 60 requests per minute per IP when the limiter is on (`rate_limiter_utils.py`). 24.8k units = about 1,550 pages = about 26 minutes per full read (estimate).
3. **Build.** `generateStaticParams` and the sitemap both read the full catalogue. They are sized for hundreds of units, not tens of thousands.
4. **Thin-page risk.** 24.8k near-identical unit pages (same project, same plan, different floor) are weaker evidence than one page per project with real ranges.

`GET /public/projects` returns all 886 projects in one call with `start_price`, `start_areas`, `payment_plans`, `delivery_date`, `units_count` and `updatedAt`. That is the scalable source for inventory pages.

## What this means for the plan

- The site copy says LenAqar serves developer and resale units (tracker B20), but only resale is visible. The largest asset is not crawlable today.
- Recommended shape for Phase 3: one page per project with real records (470 projects have 10 or more units), not one page per primary unit. Area × type hubs can then count projects and units from the same call.
- Phase 1 only needs a small safety change now: make the paging bound match the API's real page size, so resale growth past 1,600 units does not break the feed.

## Owner decisions needed

- **G1.** May developer (primary) inventory from tenant `public` be published on lenaqar.com? If yes: as project pages only, or unit pages too; and which fields (prices, payment plans) are allowed.
- **G1b.** May resale units under tenant `public` be shown (39% have images in the sample)?
- **Count.** Run or permit one grouped count on `units_v1` to close rows 8–10 and confirm the stored counters in row 5.

## Not checked

Whether instant-match already searches tenant `public`; whether developers gave permission to republish price lists; the age rule after which a price list is stale (ties to gate G2).

## Update, 2026-11-24 (later the same day): exact developer count

The project snapshot (`scripts/build-project-snapshot.mjs`) paged the whole developer set through the public API: 1,443 pages, complete.

| What | Count | Label |
| --- | --- | --- |
| Developer units for sale, visible, tenant `public`, primary | 23,086 | V (paged to the end, 2026-11-24) |
| Of these, usable for a price summary (price, area, plausible price per m²) | 23,011 | V |
| Units whose project record was not found | 71 | V |
| Projects with 10 or more usable units, not marked sold out | 431 | V |
| Units behind those 431 project pages | 21,213 | V |

So the developer set is 23,086 units, not the stored counter's 24,785 (row 5). With the 872 resale units that is 23,958 units reachable through the public API. The rest of "30k+" is rows 8–9 (resale under tenant `public`, broker tenants) and still needs the grouped database count.

Owner decision G1 (2026-11-24): publish project pages with a unit-price summary, no private data. Built as `/projects` and `/projects/<slug>`; see tracker item B31.
