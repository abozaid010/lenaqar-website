# Publishing LenAqar market data (repeatable process)

Applies to every LenAqar-computed number shown on the site, e.g. the asking-price tables on the area price guides (`src/lib/guides/inventory-summary.js`).

## 1. Datasets (assessed 2026-11-15)
| Dataset | What it is | Publishable? |
|---|---|---|
| Public resale feed (`/public/v1/units`, client `lenaqar`, `is_primary=false`) | resale listings visible on lenaqar.com. `dataSource`: mostly `ai_generated` (owner/broker WhatsApp messages extracted by AI, human-approved `pending_approval → visible`), plus `website`, `mobile_app`, `ai_extraction` | **Yes — the only source of the guide tables.** Every count, median, range and date on a table is computed from this one sample |
| Price insight (`/public/v1/price-insight`) | medians over resale units at `presentValue`; its unit set is **not** the set shown on lenaqar.com (e.g. Fifth Settlement: API n=151 vs 98 listed apartments) and it returns no dates | **Not for public tables** (PR #47 review: mixing it with catalog dates described one sample with another's statistics). Fine for the post-submit card |
| Developer (primary) inventory | developer price lists at installment totals; some imports carry range endpoints, which are not real units | **Not yet**: needs cash-equivalent normalisation and range-endpoint removal; never mix it into resale figures |
| Third-party figures (Aqarmap, etc.) | other sites' published averages | Quote with attribution and date; never relabel as LenAqar research |

## 2. Rules for every published figure
0. **One defined sample:** the listings of that place and type shown on lenaqar.com on the observation date, one per listing code, with total price, area and a plausible price per m². Counts, statistics, source text and the freshness range all describe exactly this sample (regression test in `guide-inventory-summary.test.js`).
1. **Source and date:** the observation date (Cairo) plus the range of the sample's listing record dates.
2. **Coverage:** place (district or whole city, never mixed), property type (apartments only, no villas), resale vs developer stated.
3. **Sample:** n per row; rows below **20** are omitted (threshold is a judgment call, reviewed at day 30).
4. **Statistic:** median price per m² (total asking price ÷ area, as on listing cards), median total asking price, 5–95% range from 20 units; method listed on the page.
5. **Price type:** asking prices, never described as sale prices or "verified".
6. **Exclusions:** developer units, impossible price/m², widened scopes, thin categories.
7. **Limitations:** listing ages shown; may differ from other sources because the sample differs.
8. **No filler:** if a row fails a rule it disappears; we never estimate a missing number.

## 3. Adding a market
1. Count the place's apartment listings in the public feed (n ≥ 20 for the headline row).
2. Check the feed for that place: `dataSource` mix, duplicates (project + area + price), round-million prices, totalPrice vs presentValue gaps.
3. Add a `GUIDE_INVENTORY` entry with `level` ("district" or "city"), city, district, type, Arabic label and listings link.
4. Add or extend tests (scope match, thin rows, widened answers).
5. Build, check the page HTML and a phone-width render, and add the URL to the health check if it is a priority page.
6. Record it in `ai-visibility-feature-progress.json`.

## 4. Update history
| Date | Markets | Notes |
|---|---|---|
| 2026-11-15 | Madinaty (PR #40) | first table |
| 2026-11-15 | Fifth Settlement, New Cairo city, El Shorouk | added |
| 2026-11-15 | all four markets | method changed to one defined sample (public catalog only) after the PR #47 review; numbers now match the listings shown on lenaqar.com |
