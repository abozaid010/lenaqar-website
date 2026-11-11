# Post-submit: average prices + WhatsApp match link

Plan only. No code changed. Approved 2026-11-11. Hour figures in "Build order" are estimates.
Prompt: `docs/post-submit-matches-prompt.md`.

## Context

Today a buyer who submits the lenaqar form sees "طلبك وصلنا" and a link to `/opportunities`. Nothing tells them
what their request costs in the market, and nothing brings them into WhatsApp where the agent works.

Target flow:

1. Buyer submits the form → success screen shows **average prices** for their request and one **WhatsApp button**.
2. Button opens WhatsApp with a prefilled message.
3. Backend recognises that message, builds a match share for the sender's phone, and replies with
   `https://www.lenaai.net/match/<phone>_<suffix>`.

No new agent tool. No change to `lenaAI-website`.

## Decisions (settled)

| # | Decision | Choice | Why |
|---|---|---|---|
| 1 | Auth for requirement-by-phone | Bearer CRM auth (`auth_service.get_current_client`), on `requirements_router`, **not** under `/public`. Phone goes in a POST body, never in the URL. Same ACL as `GET /requirements/{user_id}`. | The public site holds only the public API key, so it can never read a requirement by phone. Phones stay out of access logs. |
| 2 | Who creates the match share | **Backend auto-create inside the WhatsApp inbound pipeline**, deterministic, no LLM call. | WhatsApp proves the sender owns the phone; the website cannot. Same pattern as the existing contact gate (`held` reply) and `detect_demand_offer_ref`. |
| 3 | Average price grouping | Full filter first, then relax one field at a time until the sample is big enough. Never relax city or property type. Response names the scope actually used. | Avoids the 2026-11-09 audit bug (`price_scope_note`): city-wide figures quoted as district prices. |
| 4 | Small / empty sample | `< 5` units after all relaxing → `available: false`. UI hides the price block and still shows the WhatsApp button. | Never invent a price. |

Defaults I chose (change any before build):

- Zero matching units at WhatsApp time → fixed Arabic line, no link, team is already notified by the form lead. No agent call.
- No requirement on file for the sender's phone → message falls through to the normal agent flow.
- Success screen applies to **both** entry points: home `RequestComposer` and the header "اشتري وحدة" dialog.
- All Arabic copy below is a draft and needs your approval before merge.

## Finding that changes the price work

`CombinedPriceRange.get_combined_price_range_top3` fetches up to 2000 units from each source, then keeps only the
**3 cheapest** (`top_k = 3`). Its `average_sq_meter_price` is the average of those 3 units, and `matching_count` is
never above 3. Showing that as "average price" would understate the market.

Fix without rewriting: extract the fetch + filter + dedupe into one method that returns the full list. The top-3
method slices that list (behaviour unchanged). The new endpoint computes stats over the full list.

---

## Test cases (write these first)

### Backend A — requirement by phone (`tests/test_requirement_by_phone.py`)

Pattern: `tests/test_public_buy_request_router.py` (FastAPI `TestClient`, patched DBs).

| ID | Case | Expect |
|---|---|---|
| A1 | Valid phone, lead + requirement exist in caller's client | 200, `{user_id, requirement}` |
| A2 | Same phone in formats `+2010…`, `2010…`, `010…` | same `user_id` each time |
| A3 | Phone exists only under another client | 404, no data leak |
| A4 | Requirement doc `client_id` differs from caller's client | 404 |
| A5 | Lead exists, no requirement doc | 404 `Requirement not found` |
| A6 | Invalid phone (`abc`, empty) | 400 |
| A7 | No Bearer token | 401 |
| A8 | Public API key only (`X-API-Key`), no Bearer | 401 |
| A9 | Body `client_id` differs from token's client | 403 |
| A10 | Route order: `POST /requirements/by-phone` is not captured by `/{user_id}` routes | handler A is called |
| A11 | Lookup creates no dashboard or requirement document | no writes on the fakes |

### Backend B — price insight (`tests/test_price_insight.py`, `tests/test_combined_price_units.py`)

| ID | Case | Expect |
|---|---|---|
| B1 | `get_combined_price_range_top3` after the refactor | same output as before (existing `test_price_range_purpose_visibility.py` and `test_requirement_purpose_and_price_range.py` stay green) |
| B2 | New full-list method, 40 units across Chroma + Firestore with 5 duplicates | 35 units, deduped by `unitId` |
| B3 | Rent or non-visible units in the raw rows | dropped (`_keep_inventory_units`) |
| B4 | 40 units match the full filter | `available: true`, `sample_size: 40`, `relaxed: []`, `scope.level` = deepest level sent |
| B5 | 2 units at sub_district, 30 at district | `relaxed` contains `sub_district`, `scope.level: "district"`, `sample_size: 30` |
| B6 | Relax order | delivery → area → sub_district → bedrooms → district; stops at first rung with `>= 5` |
| B7 | 3 units even at city + type | `available: false`, no price fields, `sample_size: 3` |
| B8 | 0 units | `available: false`, `sample_size: 0`, HTTP 200 |
| B9 | Units missing `totalPrice` or `landArea` | excluded from per-m² average, never divide by zero |
| B10 | `area` given | `estimated_total = round(avg_price_per_sqm × area)`; absent when `area` is missing |
| B11 | Outliers with `n >= 20` | per-m² values outside P5–P95 excluded from the average; `lowest`/`highest` report the trimmed range |
| B12 | Missing `city` or `property_type` | 400 |
| B13 | No / wrong `X-API-Key` | 401 |
| B14 | Unknown city string | `available: false`, not a 500 |
| B15 | Response never contains unit ids, codes, owner or client fields | allowlist assertion |
| B16 | Source raises (Chroma down) | Firestore-only result, still 200 |

### Backend C — WhatsApp match request (`tests/test_match_request.py`, `tests/test_match_share_auto_create.py`)

Pattern: `tests/test_demand_offer.py` and `tests/test_match_share_create.py`.

| ID | Case | Expect |
|---|---|---|
| C1 | Exact prefilled text | `detect_match_request` → True |
| C2 | Text with extra whitespace / trailing emoji / debounced with a second line | True |
| C3 | "عايز شقة في التجمع", demand-offer opener, `OPP-…` opener, seller opener | False |
| C4 | Requirement on file, 6 matching units | share created with `unit_ids` in rank order (max 10), reply contains `{NEXTJS_ORIGIN}/match/<digits>_<6 chars>`, agent **not** invoked |
| C5 | Token phone digits equal the WhatsApp sender's E.164 digits | match |
| C6 | Stored share `requirements` snapshot | only allowlisted keys; no name, phone, notes, score, assignment, ids |
| C7 | `created_by` on the share | `"lenaqar_whatsapp"`; public GET still strips it |
| C8 | Dismissed unit codes on the requirement | never in `unit_ids` |
| C9 | Requirement on file, 0 matching units | no share created, fixed "no match yet" reply, agent not invoked |
| C10 | No requirement for the sender | intercept returns None → normal pipeline runs (contact gate, agent) |
| C11 | Requirement belongs to another client | treated as C10 |
| C12 | Same buyer sends the message twice within 24 h, requirement unchanged | same token re-sent, no second share doc |
| C13 | Requirement updated after the last share | new share created |
| C14 | Non-lenaqar spec receives the text | intercept not run |
| C15 | Stop request in the same message | stop rule wins (`__NO_REPLY__`) |
| C16 | `matchShareDB.create` fails | falls through to the normal pipeline, error logged, no broken link sent |
| C17 | `requirement_matches` REST endpoint after the core extraction | unchanged output and ACL (existing tests stay green) |
| C18 | Turn is saved to the conversation timeline with `match_token` | one `LenaMessage` |

### lenaqar (`node --test`, pattern `src/lib/lenaqar/__tests__/whatsapp-intent.test.js`)

| ID | File | Case | Expect |
|---|---|---|---|
| L1 | `whatsapp-match-request.test.js` | `matchRequestMessage()` | exact string, ends with `MATCH`, no digits / `@` (no user data) |
| L2 | same | `matchRequestHref()` | `wa.me/201002891933?text=…` URL-encoded |
| L3 | `price-insight.test.js` | `priceInsightQuery(requirement)` flat fields | `{city, district, sub_district, property_type, area, bedrooms, delivery}` |
| L4 | same | requirement with `preferred_locations[]` and `preferred_property_types[]` | uses the first of each |
| L5 | same | no city or no type | returns null → no backend call |
| L6 | same | `formatPriceInsight(data)` with `available: false` | null (block hidden) |
| L7 | same | `relaxed` includes `district` | scope label is the city, not the district |
| L8 | same | numbers | `ar-EG` grouping, rounded, no decimals |
| L9 | manual / preview | submit succeeds, insight call fails | success screen still shows, WhatsApp button present, no price block, no raw error |
| L10 | manual / preview | RTL at 375 px | no horizontal scroll, button full width, logical properties only |
| L11 | manual / preview | repeat submit within 5 min (`findRepeatSubmit`) | same screen, no second `Lead` conversion event |

### lenaAI-website (regression only, no code change)

| ID | Case | Expect |
|---|---|---|
| W1 | Open `/match/<token>` for a share with `created_by: "lenaqar_whatsapp"`, client `lenaqar` | units render through `loadCustomerUnitsFromSharePayload` (`unit_ids` path) |
| W2 | Requirements brief | shows location, type, budget from the allowlisted snapshot |

---

## Design

### Repo 1 — `LENAAI-Agent`

#### 1. Requirement by phone

New `src/services/crm_access/requirement_lookup.py`

- `async def requirement_by_phone(phone, client_id) -> Optional[dict]` → `{user_id, requirement}` or None.
- Reuses: `PhoneNumber.try_normalize`, `FirestoreUsersDB.shared().get_or_create_user_id_for_phone(phone, client_id)`
  (deterministic id, writes no document), `requirementsDB.get_requirements(user_id)`.
- Tenant guard: `requirement["client_id"] == client_id`, else None.

Edit `src/api_routers/requirement_router.py`

- `POST /requirements/by-phone`, registered **above** the `/{user_id}` routes.
- Deps: `get_read_rate_limiter()`, `auth_service.get_current_client`.
- `require_client_id(current_client, …)`; body `client_id` optional and must equal it.
- `require_collaborator_lead(principal, user_id, allow_shared=True)` — same as `get_requirement`.

Request

```json
{ "phone": "+201000000000", "client_id": "lenaqar" }
```

Response 200

```json
{ "status": true, "code": 200,
  "data": { "user_id": "8a21c3f0-…", "requirement": { "client_id": "lenaqar", "preferred_locations": [ … ], "max_price": 5000000 } } }
```

Errors: 400 invalid phone · 401 no Bearer · 403 client mismatch / ACL · 404 no requirement.

#### 2. Average prices

Edit `src/database/combined_price_range.py`

- New `get_combined_price_units(...)`: the current parallel Firestore + Chroma fetch, `_keep_inventory_units`,
  merge, dedupe by `unitId`, **no cap**. Adds optional `sub_district`.
- `get_combined_price_range_top3` calls it and slices `[:top_k]`. No behaviour change.

Edit `src/database/firestore_units_db.py`

- `get_price_units_by_manual_filter`: optional `sub_district` equality filter (index-free, same style as `district`);
  add `sub_district` to the `select([...])` list.
- Chroma: `ChromaUnitFilters` has no `sub_district`. For the sub_district rung, filter the merged rows in memory;
  rows without the field are dropped for that rung only.

New `src/services/price_insight.py`

- `async def price_insight(*, city, district, sub_district, property_type, area, bedrooms, delivery) -> dict`.
- Reuses: `get_combined_price_range()`, `DeliveryDateExtractor.shared().date_from_user_query`,
  `ClientsCache.shared().get_sharing_policy(PUBLIC_UNIT_CLIENT_ID)` (client filter only when `ONLY_MY_UNITS`),
  `LocationResolverV2.shared().resolve_location(...)` for city/district canonical values, purpose fixed to `buy`.
- Area: band `0.8×–1.25×` of the requested area on the first rung.
- Ladder, stop at the first rung with `sample_size >= MIN_SAMPLE (5)`:
  1. all fields → 2. drop delivery → 3. drop area band → 4. drop sub_district → 5. drop bedrooms → 6. drop district.
- Stats over units that have both `totalPrice` and `landArea`: average price per m², average total, lowest, highest.
  P5–P95 trim on per-m² when `n >= 20`.

New `src/api_routers/public_price_insight_router.py`; register in `src/main.py`

- `GET /public/v1/price-insight` — no personal data, so query params are fine. `/public` is already in the BFF bypass list.
- Deps: `get_public_rate_limiter()`, `thirdparty_authenticator.validate_public_api_key`.

Request

```
GET /public/v1/price-insight?city=new%20cairo&district=fifth%20settlement&sub_district=al%20narges
    &property_type=apartment&area=150&bedrooms=3&delivery=2027
```

`city` and `property_type` required; the rest optional.

Response 200, enough data

```json
{ "status": true, "code": 200,
  "data": {
    "available": true,
    "sample_size": 30,
    "scope": { "level": "district", "city": "new cairo", "district": "fifth settlement",
               "sub_district": null, "property_type": "apartment", "bedrooms": 3 },
    "relaxed": ["delivery", "sub_district"],
    "avg_price_per_sqm": 38500,
    "avg_total_price": 5650000,
    "lowest_total_price": 3900000,
    "highest_total_price": 8200000,
    "estimated_total": 5775000,
    "basis": "asking_prices",
    "as_of": "2026-11-11"
  } }
```

Response 200, not enough data

```json
{ "status": true, "code": 200, "data": { "available": false, "sample_size": 3 } }
```

`as_of` is the query date of a live inventory read, not a claim about when prices were verified.

#### 3. WhatsApp match request (no new tool, no LLM call)

New `src/utils/match_request.py`

- `detect_match_request(text) -> bool`. Matches the `MATCH` marker after the dash, or the phrase
  `الوحدات المناسبة لطلبي`, or English `units match(es|ing) my request`. Same style as `src/utils/demand_offer.py`.

Edit `src/services/crm_access/match_service.py`

- Extract the pipeline body of `requirement_matches` into `match_requirement_units(requirement, *, client_id, limit)`
  (gate → `fetch_match_candidates` → dismissed filter → `filter_eligible` → `rank_units` → rejection re-check).
- `requirement_matches` keeps the ACL and redaction and calls it. REST output unchanged.

New `src/utils/public_requirement_snapshot.py`

- Python port of the allowlist in `lenaAI-website/src/lib/match/public-requirement-snapshot.js`
  (location, property types, purpose, rooms, area, budget, payment, finishing, delivery). The public
  `GET /match/share/v1/{token}` returns `requirements` as stored, so the snapshot must be clean at write time.

New `src/services/match_share_service.py`

- `async def create_buyer_match_share(*, client_id, user_id, phone, name) -> Optional[dict]` → `{token, url, unit_count}`.
- Steps: `requirementsDB.get_requirements` → tenant guard → `match_requirement_units(limit=10)` →
  reuse a share younger than 24 h when the requirement has not changed → else `matchShareDB.create(...)` with
  `RequirementToUnitsFilter.convert` for `unit_filters`, `created_by="lenaqar_whatsapp"`.
- URL: `f"{NEXTJS_ORIGIN}/match/{token}"` (`src/utils/config.py`, default `https://www.lenaai.net`).
- Returns `{unit_count: 0}` with no share when nothing matches.

Edit `src/database/firestore_match_share_db.py`

- `latest_for_user(client_id, user_id)`: single-field equality query on `user_id`, client and expiry filtered in memory
  (no composite index).

Edit `src/services/whatsapp_messaging/inbound_agent_handlers.py`

- New helper `_match_request_reply(turn, request) -> Optional[dict]` returning
  `{"output": <text>, "intermediate_steps": []}`.
- Call it in `_run_whatsapp_agent_pipeline` after the stop-request check and **before** `_apply_contact_gate`,
  only when `spec is LENAQAR_SPEC`; send through `_respond_whatsapp_turn` like the contact gate does.
- Call the same helper at the matching point of `run_lenaqar_flows_auto_reply`. Confirm which `WhatsAppAgentType`
  the `lenaqar` client runs in production before wiring; both go through the one helper.
- `turn.user_id` is already the form lead's id: the form (`_create_single_lead`) and WhatsApp inbound
  (`inbound_identity.py`) both use `get_or_create_user_id_for_phone(phone, client_id)`.

Reply drafts (need approval):

- Matches: `دي الوحدات المناسبة لطلبك 👇\n{url}\nاختار اللي يعجبك وزميلنا هيتواصل معاك.`
- No matches: `طلبك متسجل عندنا. مفيش وحدات مطابقة دلوقتي، وأول ما يتوفر اختيار مناسب زميلنا هيتواصل معاك.`

### Repo 2 — `lenaqar` (this repo, branch `enable_chat`)

| File | Change |
|---|---|
| `src/lib/lenaqar/price-insight.js` (new) | Pure helpers `priceInsightQuery(requirement)` and `formatPriceInsight(data)`. Unit-tested. |
| `src/lib/lenaqar/price-insight.server.js` (new) | `loadPriceInsight(requirement)` → `GET /public/v1/price-insight` via `@/utils/axiosInstance`. Any failure returns null. |
| `src/app/(lenaqar)/_actions/buy-request.js` | After a successful save, call `loadPriceInsight` with the built requirement. Return `{ ok, userId, priceInsight }`. Insight failure never fails the submit. Same rate limit as today. |
| `src/lib/lenaqar/whatsapp.js` | `matchRequestMessage()` → `مرحبا لينا عقار، عايز أشوف الوحدات المناسبة لطلبي — MATCH`; `matchRequestHref()` via `formatPhoneForWhatsApp(LENAQAR_CONTACT.whatsappE164, …)`. |
| `src/components/lenaqar/buy-request-success.jsx` (new) | Success card: title, price block (hidden when null), WhatsApp primary button, existing `/opportunities` link as secondary, "اكتب طلب تاني". Reuses `actionButtonClass`, `trackWhatsAppClick({intent:"buy", location:"buy_request_success"})`. Logical properties only. |
| `src/components/lenaqar/request-composer.jsx` | `success` state stores `priceInsight`; renders `BuyRequestSuccess` in place of the inline block. |
| `src/components/lenaqar/buy-request-cta.jsx` | Pass `saveResult.priceInsight` to `onSubmitted`. Without `onSubmitted` (header dialog): show `BuyRequestSuccess` in the dialog instead of `router.push`. |
| `public/locales/lenaqar-ar.js`, `lenaqar-en.js` | New keys under `lenaqar.onboarding`: `successPriceTitle`, `successPricePerMeter`, `successPriceTotal`, `successPriceRange`, `successPriceBasis`, `successWhatsapp`. Both files already have uncommitted edits — add keys, touch nothing else. |

Copy drafts (need approval):

- `successPriceTitle`: `متوسط الأسعار المعروضة لطلبك في {place}`
- `successPricePerMeter`: `متوسط سعر المتر: {value} جنيه`
- `successPriceTotal`: `متوسط السعر الإجمالي: {value} جنيه`
- `successPriceBasis`: `بناءً على {count} وحدة معروضة · {date}`
- `successWhatsapp`: `شوف الوحدات المناسبة لطلبك على واتساب`

Not touched: the in-progress requirement-feed work (`requirements/route.js`, `requirement-feed-client.js`,
`requirement-sort.js`, `storytelling-homepage.jsx`, `page.jsx`).

### Repo 3 — `lenaAI-website`

No change. `/match/[token]` already renders any share doc with `unit_ids`. Run W1 and W2 only.

---

## Edge cases

1. Buyer submits with phone A, sends WhatsApp from phone B → no requirement for B → normal agent flow.
2. Buyer taps the button twice / WhatsApp debounces two messages → one share, same link (C12).
3. Buyer edits the prefilled text → phrase or `MATCH` marker still detected; otherwise the agent handles it as free text.
4. Requirement names several locations or types → price insight uses the first; matching uses all (existing behaviour).
5. Sub-district has few units → scope widens and the UI names the wider area (B5, L7).
6. Area missing → no `estimated_total`; per-m² and totals still shown.
7. Installment buyer → figures are total asking prices only. Never labelled as مقدم or قسط.
8. Price endpoint slow or down → success screen renders without the price block (L9).
9. Share token contains the buyer's phone digits (existing design) → the link is sent only to that phone on WhatsApp.
10. Share expires (`EXPIRES_DAYS`) → buyer taps the button again → new share.
11. Invalid phone on the lead → `build_match_share_token` returns None → fall through to the agent (C16 path).
12. Repeat submit within 5 minutes reuses the first result → `priceInsight` must be stored with it in
    `saveLastBuyRequestSubmit`, or fetched again; plan: store it.

## Build order

| Step | Repo | Work | Estimate |
|---|---|---|---|
| 0 | lenaqar | Copy this plan to `docs/post-submit-matches-plan.md` | 2 min |
| 1 | LENAAI-Agent | Tests A, then requirement-by-phone service + endpoint | 2 h |
| 2 | LENAAI-Agent | Tests B, then `get_combined_price_units`, `price_insight`, public router | 4 h |
| 3 | LENAAI-Agent | Tests C, then detector, match core extraction, share service, inbound hook | 5 h |
| 4 | lenaqar | Tests L1–L8, then helpers, action, success component, locale keys | 4 h |
| 5 | all | End-to-end check on staging, W1–W2 | 1 h |

Backend ships first (steps 1–3). lenaqar step 4 degrades safely if the price endpoint is missing.
One branch per repo, PR into `main`. Backend rule: module-level imports only.

## Verification

1. `cd LENAAI-Agent && pytest tests/test_requirement_by_phone.py tests/test_price_insight.py tests/test_combined_price_units.py tests/test_match_request.py tests/test_match_share_auto_create.py tests/test_price_range_purpose_visibility.py tests/test_requirement_purpose_and_price_range.py tests/test_match_share_create.py tests/test_demand_offer.py`
2. `cd lenaqar && node --test src/lib/lenaqar/__tests__/whatsapp-match-request.test.js src/lib/lenaqar/__tests__/price-insight.test.js`
3. Backend running locally: `curl -H "X-API-Key: <key>" "http://localhost:<port>/public/v1/price-insight?city=new%20cairo&property_type=apartment"` → `available` true/false, never 500.
4. lenaqar dev preview: submit the form with a test phone → success card shows price block + WhatsApp button; check 375 px RTL; block the price call → card still renders.
5. Staging WhatsApp: send the prefilled message from the same test phone → reply contains a `/match/<phone>_<suffix>` link; open it on lenaai.net → units render.
6. Send the same message again → same link. Send it from a phone with no requirement → agent answers normally.

## Noticed, out of scope

`addUnitForRequirementMessage` in `lenaqar/src/lib/lenaqar/whatsapp.js` now sends `… — REQ-<ID>`, while
`detect_demand_offer_ref` in `LENAAI-Agent/src/utils/demand_offer.py` only matches `(مرجع: <12 hex>)`. From the code,
the demand-card opener no longer triggers the DEMAND OFFER note. Not verified in production. Separate fix.

---

## Build notes (2026-11-11) — what differs from the plan above

Built on `feat/post-submit-matches` in `LENAAI-Agent` and `lenaqar`. Where this section and the plan disagree, this section is what the code does.

### Backend

- **By-phone, access denied → 404, not 403.** A phone is guessable. A missing lead, a missing requirement and a lead the caller may not open all answer `404 Requirement not found`. Only a foreign `client_id` in the body answers 403.
- **Price insight does not call `LocationResolverV2`.** The form sends catalog tokens, so city / district are lower-cased and used as they are. An unknown city answers `available: false`.
- **Price insight answers are cached in-process for 10 minutes** (512 entries max).
- **`sample_size` is the count before the P5–P95 trim.** The trim only affects the averages and the lowest / highest figures.
- **The WhatsApp reply text carries no URL.** Reply text is stripped of links downstream (`sanitize_message_text`); the match link is appended by the response path through a new `reply_links` argument of `_respond_whatsapp_turn`. Reply copy changed to one line so the link comes last.
- **Share reuse rule.** No 24-hour window: the newest unexpired share is re-sent while the ranked units and the requirement snapshot are both unchanged; otherwise a new share is created.
- **No extra timeline message.** The turn is saved by the normal WhatsApp persistence (user message + reply with the link).
- **Hidden WhatsApp numbers.** When the sender's number is not a valid phone, the stored lead phone is used for the token.

### lenaqar

- **Prices load after the success card is on screen**, through a second server action (`loadBuyRequestPriceInsight`), not inside the submit. A slow or failing price call never delays or fails the submit, and a repeat submit shows prices too.
- **The public form has no sub-district and no area field**, so the query is city + district + type + rooms + delivery, and no "estimated total" is shown. Both are supported by the helpers when a requirement carries them.
- **One primary button** (WhatsApp, label `ابعتلي الوحدات على واتساب`); "شوف وحدات قريبة من طلبك" and "اكتب طلب تاني" are text links under it.
- **Header / page CTAs** now show the success card in a dialog instead of navigating to `/opportunities`.
- Numbers use the site's existing `EgpAmount` (Latin digits + ج.م).

### Price figures corrected (after local testing)

The first build averaged `totalPrice` over every listed unit and read high (Madinaty, 3-room apartments: 72,280 per m²).

- **Cause, measured on 2026-11-11:** developer (primary) units are listed at their installment-plan total and outnumber resale units many times over: 3,790 of 3,938 apartments in Fifth Settlement, 36,672 of 37,768 sale units overall. The 2000-row fetch limit was also filled by them, so most resale units were never read.
- **Now:** resale units only (`is_primary == false`, filtered in the query), each valued at `presentValue` (the cash-equivalent the listing cards already use for سعر المتر). A flat discount on developer units would have been a guess, so they are left out.
- **Medians, not means.** Listings contain mistyped prices and areas; one of them moved the mean per m² in Fifth Settlement to 22 million. The headline numbers are the middle unit. Rows with an impossible price per m² (under 5,000 or over 1,000,000) are dropped, and from 20 units up the lowest / highest figures leave out the cheapest and dearest 5%.
- **Response fields renamed:** `median_price_per_sqm`, `median_unit_price`, `lowest_unit_price`, `highest_unit_price`, `basis: "resale_cash_value"`.
- **Result on the same data:** Madinaty 3-room apartments 60,403 per m² from 65 units; Fifth Settlement apartments 44,751 per m² from 142 units.
- Card wording: title `متوسط أسعار إعادة البيع في {place}`, basis line `قيمة الكاش لـ {count} وحدة إعادة بيع معروضة`, button `ابعتلى الوحدات المناسبة لطلبى على الواتس`.

### Opportunities filter bar (added after local testing)

- The "see units close to your request" link carries rooms, price range and property type in the URL. The filter bar had no field for them and kept them on every Apply, so a buyer who changed the area or the cash still saw "no units" with no visible cause.
- The bar now shows each of those as a removable chip (`فلاتر من طلبك:` … `امسح الكل`). Removing a chip reloads the list without it. Location, cash and delivery behave as before.
- Checked locally with the reported URL: 0 units with all filters, 3 after removing the price cap, 5 after clearing all.

### Verified

- Backend: 120 new tests; handler, CRM, price-tool and match-share suites give the same result with and without the change (279 passed, 6 skipped).
- Price endpoint read against the real inventory (read-only): New Cairo / Fifth Settlement / apartment / 3 rooms / ready → 47 units; an unknown city → `available: false`.
- lenaqar: 202 unit tests; success card checked in the browser at 375 px RTL, inline and in the dialog, against the real price endpoint running locally.

### Not verified

- A real WhatsApp message end to end (needs both PRs deployed).
- A real form submit on the new build (it would create a live lead).
- `next build` of lenaqar (dev compile only).

### Found on the way, not changed

- `FirestoreMatchShareDB._is_expired` never reports a share as expired: it calls `TimeManager.convert_str_to_iso_date` as a static method, the call raises, and the error is read as "not expired". Match links therefore do not expire after 30 days. Fixing it would turn older links into 404s, so it is left for a separate decision.
- The demand-card opener mismatch described under "Noticed, out of scope" above.

---

## After the first production test (2026-11-11, evening)

Four problems were reported after the site went live. What each one was, and what changed.

| # | Reported | Verified cause | Fix |
|---|---|---|---|
| 1 | Average prices never show | The live backend was still the old version: `GET https://api.lenaai.net/public/v1/price-insight` answered 404 and the route was absent from production's OpenAPI. The "Deploy to Hostinger" run for the merge was stuck in the queue during a GitHub Actions outage. The site hides the block on any failure, as designed. | Nothing to fix in the first cause except deploying. To make the block near-certain to show once deployed: the city is now relaxed last (a country-wide figure labelled مصر), and the site retries once on a timeout or 5xx. |
| 2 | Page ends up at the end after submit, success card missed | Not reproduced in desktop emulation (three ways of opening the form, no scroll event). What is certain: nothing brought the card into view, so any displacement left it off-screen. On a phone the open keyboard is the likely trigger. | On mount the success card closes the keyboard, scrolls itself to the top (again after the keyboard is gone) and takes focus. Checked by forcing the page to the very end before submit: the card lands under the header with prices and button visible. |
| 3 | Page zooms on mobile | Viewport tag was `width=device-width, initial-scale=1`. | `maximum-scale=1, user-scalable=no`. Pinch zoom is off where the browser honours it. |
| 4 | AI did not know the request and sent no match link | Two causes. (a) Same as #1: the hook was not deployed. (b) The WhatsApp message was not filed under the form lead at all: the only conversation record carrying the test number is the form lead, with no messages. WhatsApp often delivers a contact without a phone number, and a buyer may type another number in the form, so "same number = same lead" does not hold. | A random reference (`match_ref`, 8 characters) is stored on the request at submit and returned to the site. The WhatsApp message carries it: `… — MATCH-K7Q2M9XD`. The backend matches the request the reference names, builds the link for the form lead, and copies the request onto the WhatsApp contact so the agent knows it afterwards. Without a reference the sender's own request is used, as before. |

### What is still two CRM rows

When WhatsApp hides the number, the form lead (has the phone) and the WhatsApp contact (has the chat) stay two leads. The request is now on both and the match share belongs to the form lead, but they are not merged. A real merge is a separate piece of work.

### Verified

- Backend: 415 tests in the feature and regression suites.
- Rehearsal on the real test request with every write captured instead of saved: reference read from the opener, 10 matching units, link built for the form lead, request copied to a sender with a hidden number.
- Price endpoint on a local server against real inventory: the test request (Madinaty, apartment, 2 rooms, ready) → 33 units; Aswan and an unknown city → country-wide figure.
- Site: 216 unit tests. In the browser at 375 px, against a local stand-in that fakes the submit and saves nothing: viewport tag, card brought into view from a page forced to the end, WhatsApp text ending with the reference, repeat submit keeps the reference.

### Not verified

- A real form submit and a real WhatsApp message on the fixed build. Both write to the live database, and the automated browser check refused to press Submit against it.
- The cause of the scroll jump on a real phone (see #2).
