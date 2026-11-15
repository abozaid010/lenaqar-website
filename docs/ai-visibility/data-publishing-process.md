# Publishing LenAqar market data (repeatable process)

Applies to every LenAqar-computed number shown on the site, e.g. the asking-price tables on the area price guides (`src/lib/guides/inventory-summary.js`).

## 1. Datasets (assessed 2026-11-15)
| Dataset | What it is | Publishable? |
|---|---|---|
| Public resale feed (`/public/v1/units`, client `lenaqar`, `is_primary=false`) | resale listings visible on lenaqar.com. `dataSource`: mostly `ai_generated` (owner/broker WhatsApp messages extracted by AI, human-approved `pending_approval → visible`), plus `website`, `mobile_app`, `ai_extraction` | **Yes**, as asking prices, with the origin stated |
| Price insight (`/public/v1/price-insight`) | medians over resale units at `presentValue` (cash value); developer units excluded; implausible price/m² dropped; 5% tails trimmed from 20 units; scope widening reported in `relaxed` | **Yes**, only when the scope is exactly the labelled place and `relaxed` is empty |
| Developer (primary) inventory | developer price lists at installment totals; some imports carry range endpoints, which are not real units | **Not yet**: needs cash-equivalent normalisation and range-endpoint removal; never mix it into resale figures |
| Third-party figures (Aqarmap, etc.) | other sites' published averages | Quote with attribution and date; never relabel as LenAqar research |

## 2. Rules for every published figure
1. **Source and date:** the API `as_of`, plus the range of listing record dates.
2. **Coverage:** place (district or whole city, never mixed), property type (apartments only, no villas), resale vs developer stated.
3. **Sample:** n per row; rows below **20** are omitted (threshold is a judgment call, reviewed at day 30).
4. **Statistic:** median price per m², median unit price, 5–95% range; method listed on the page.
5. **Price type:** asking prices, never described as sale prices or "verified".
6. **Exclusions:** developer units, impossible price/m², widened scopes, thin categories.
7. **Limitations:** listing ages shown; may differ from other sources because the sample differs.
8. **No filler:** if a row fails a rule it disappears; we never estimate a missing number.

## 3. Adding a market
1. Probe the price-insight API for the place and type; check `level`, `relaxed` and n.
2. Check the feed for that place: `dataSource` mix, duplicates (project + area + price), round-million prices, totalPrice vs presentValue gaps.
3. Add a `GUIDE_INVENTORY` entry with `level` ("district" or "city"), city, district, type, Arabic label and listings link.
4. Add or extend tests (scope match, thin rows, widened answers).
5. Build, check the page HTML and a phone-width render, and add the URL to the health check if it is a priority page.
6. Record it in `ai-visibility-feature-progress.json`.

## 4. Update history
| Date | Markets | Notes |
|---|---|---|
| 2026-11-15 | Madinaty (PR #40) | first table |
| 2026-11-15 | Fifth Settlement (n=151), New Cairo city (n=334), El Shorouk (n=29; 2BR omitted) | this change; Fifth Settlement 98 apartments in the feed, 87 `ai_generated` |
