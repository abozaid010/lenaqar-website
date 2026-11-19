# Instant match — plan and progress

_Plan approved by the owner 2026-11-19. Built the same day; every step is in an open PR.
Nothing is merged or deployed._

Goal: a buyer sees real units seconds after sending a request, and can reach us by
WhatsApp or phone from every unit. Product goal behind it: sell a unit within 24 hours.

## Decisions made (owner, 2026-11-19)

- Flow **A**: one short form, then a full match page on lenaqar.com.
- Place picker **P2**: tap default areas, several allowed, plus a search box to type any
  other place or project.
- Default areas: Cairo, New Cairo, Sheikh Zayed, 6 October, Madinaty, New Capital,
  Fifth Settlement, Al Shorouk, First Settlement.

## Status

| # | Step | Where | Status |
| --- | --- | --- | --- |
| 1 | A match must sit in a place the buyer named | LenaAI-Agent#253 | PR open |
| 2 | Near misses shown beside fewer than 5 matches; nearby places read when short | LenaAI-Agent#253 | PR open |
| 3 | `GET /public/v1/buy-request/match/{ref}` | LenaAI-Agent#253 | PR open |
| 4 | Unit-card WhatsApp opener (`OPP-<code> — MATCH-<ref>`) goes to the agent | LenaAI-Agent#254 | PR open |
| 5 | Place picker P2, city-only places, several places in the payload | lenaqar, this branch | PR open |
| 6 | Short form (flow A) | lenaqar, this branch | PR open |
| 7 | Match page with WhatsApp + Call on every unit | lenaqar, this branch | PR open |
| 8 | Unit taps recorded, team push, shown on the lead in the admin | LenaAI-Agent#255 (stacked on #253), lenaqar this branch, lenaai-website#887 | PRs open |
| 9 | Units with off-catalog place values | `docs/instant-match-offcatalog-units-2026-11-19.csv` | list ready, fix waits for the owner |

Merge and deploy order: LenaAI-Agent#253 first, then this lenaqar branch. #254 at any
time. #255 after #253 (retarget it to `main`), then lenaai-website#887.

Before LenaAI-Agent#253 is live, the match page shows "مش قادرين نعرض الوحدات دلوقتي"
with the WhatsApp button, so the lenaqar branch should not go out first.

## What differs from the approved plan

1. **Submit does not return the units.** The match page reads the GET endpoint instead:
   one read path, and a reload or a shared link works.
2. **PRs are grouped, not one per step.** Steps 1–3 edit the same functions, and so do 5–7.
3. **"Filter chips edit the request"** is a summary row plus one "تعديل الطلب" button that
   reopens the form with the saved request. Chips are not edited one by one.
4. **Payment mode can stay unstated.** The short form does not ask for it, so nothing is
   assumed. Before, a form without a mode was sent as cash with a "ready" delivery date.
5. **Scoring fix added to #253.** A whole-city place scored lower than a district place, so
   a mixed list showed one place only. Found in the live check, not in the plan.
6. **Typed text with no catalog result** is stored as a place with only a `project` name.
   The backend still tries to resolve it; unresolved, it is not a filter.

## Location audit (2026-11-19)

Sources: live catalog `GET https://www.lenaqar.com/api/locations/catalog` (33 cities,
408 districts, 93 sub-districts) and all 830 resale units from `GET /public/v1/units`
(local backend on the live database, read only). The shared developer (primary) pool is
not in that feed and was not audited.

Matching compares the lowercased `city` and `district` of a unit with `==`, so each chip
sends exactly these values (`src/lib/lenaqar/request-places.js`):

| Chip (owner's name) | Arabic label | Level | Exact value sent | Resale units |
| --- | --- | --- | --- | --- |
| Cairo | القاهرة | city | `cairo` | 136 |
| New Cairo | القاهرة الجديدة | city | `new cairo` | 391 |
| Sheikh Zayed | الشيخ زايد | city | `sheikh zayed` | 36 |
| 6 October | 6 أكتوبر | city | `6 october` | 78 |
| New Capital | العاصمة الإدارية | city | `new administrative capital` | 53 |
| Madinaty | مدينتي | district | `new cairo` > `madinaty` | 144 |
| Fifth Settlement | التجمع الخامس | district | `new cairo` > `fifth settlement` | 173 |
| Al Shorouk | الشروق | district | `cairo` > `el shorouk city` | 43 |
| First Settlement | التجمع الأول | district | `new cairo` > `first settlement` | 31 |

Findings:

1. All 9 names exist in the catalog. Five are cities and four are districts.
2. Three chips sit inside another chip: Madinaty, Fifth Settlement and First Settlement are
   inside New Cairo; Al Shorouk is inside Cairo. Picking a city covers its districts.
3. Place was not a hard rule in the matcher. Live check before the fix: "New Cairo +
   Al Shorouk, apartment, max 4.5M" let 72 Cairo units outside Al Shorouk through.
4. 29 of 830 resale units carry a city or district that is missing or not in the catalog,
   so a district chip can never find them. They are listed in the CSV of step 9.

## Flow as built

1. Form, one screen: places, property type, max budget, name, phone, "not a broker".
   Rooms, payment mode, down payment, delivery and notes sit in a collapsed optional block.
2. Submit saves the request and returns `match_ref`; the buyer is sent to
   `/requests/match/<match_ref>`.
3. Match page: matched units first, then "قريب من طلبك" with the difference written on
   each card. "تعديل الطلب" reopens the form.
4. Every card: WhatsApp (unit code + `MATCH-<ref>`) and Call. Phones get a WhatsApp + Call
   bar at the bottom.

## Rules for the place picker

- Tapping a city chip covers its districts; they show as included.
- Up to 5 places per request.
- Typed text searches cities, districts, sub-districts, their aliases (Arabic and English)
  and project names. A picked result is stored with its exact catalog values.
- Text with no result can still be added. It is saved on the request as written.

## Verification done

- Backend: 262 tests pass in the nine matching and public-request test files, 122 in the
  three files that need credentials, 113 for the WhatsApp opener, 50 for the tap endpoint.
  The only failures are three tests that fail the same way on `main`.
- Backend, live inventory, read only: place rule, near misses and timing (0.3–2.2 s).
- Website: 262 unit tests pass. Form, match page, not-found state and tap recording
  checked in the browser at phone and desktop width against a dry-run backend that saves
  nothing and reads real units.

## Not verified

- The whole backend test suite: a run without credentials hung near the end and was
  stopped, so only the files around the changed code were compared with `main`.
- A production build of lenaqar (`next build`) was not run locally.
- The agent's reply to the unit-card opener: live LLM runs are owner-only.
- The team push on a real device, and the admin list in the browser.

## Open decisions for the owner

1. Customer-facing Arabic copy in the lenaqar PR and the team push copy in
   LenaAI-Agent#255 are drafts for approval.
2. Step 9: who corrects the 29 units — a one-off script approved per unit, or by hand in
   the admin. The CSV has empty `correct_city` / `correct_district` columns to fill.
3. Done 2026-11-19: `units-location-search.jsx` and `searchable-project-select.jsx` were
   deleted on the owner's word. Nothing imported them.
