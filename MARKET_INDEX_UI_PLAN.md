# Market Index — Admin UI Implementation Plan (Phase 1)

> Executable plan for a fresh engineer. Every path, helper, and pattern below was
> verified against the codebase on 2026-07-19. Where a fact must be re-verified at
> runtime (backend shape, `homey` client, tokens), an explicit verification step is given.
> **Never assume — run every verification gate before writing the dependent code.**

---

## 0. Scope & Non-Goals

**Goal:** New admin-only page(s) to **add / view / publish** Market Index cards
(locations → card general data → reference units → publish + version history), talking to
the backend `/market-index/*` API (see `Market Index — API Specification (Phase 1)` in the
task description — treat it as the API source of truth, but re-verify against the running
backend in Gate 0).

**Visibility rule (hard requirement):**
- Only for the tenant **`client_id === "lenaqar"`** (case-insensitive compare, like
  [dashboard-lead-sort.js:16](src/utils/dashboard-lead-sort.js:16) does with `LENAQAR_CLIENT_ID = "lenaqar"`).
- Only for **role `admin` or `owner`** (JWT-derived, exactly like
  `canManageTeamFromToken()` in [getRoleFromToken.js:66](src/lib/getRoleFromToken.js:66)).
- Everyone else: the sidebar item is **hidden** (not disabled) and the route returns **404**
  (`notFound()`), per CLAUDE.md "Hide (don't disable) unauthorized actions".

**Non-goals (do NOT build in this phase):**
- Public estimator page (`POST /market-index/estimate` UI) and aggregates view — later phase.
- Any change to existing screens. The **only** shared files you may touch are the four
  additive registrations listed in §3.1 (proxy, rewrites, sidebar, locales). Everything
  else is new files.

---

## 1. Verified Architecture Facts (do not re-derive, but re-verify Gate 0)

| Fact | Where verified |
|---|---|
| Middleware lives in `src/proxy.js` (Next 16 proxy). **Never create `middleware.js`.** | [proxy.js](src/proxy.js) |
| Admin URLs are `/{clientId}/{path}` (e.g. `/homey/market-index`). Two registrations make this work: `adminPaths` in [proxy.js:29](src/proxy.js:29) (auth + refresh + bare-path redirect) **and** `adminPaths` in the `rewrites()` of [next.config.mjs:84](next.config.mjs:84) (maps `/{clientId}/path` → `/path` page). A new admin route must be added to **both** lists. | proxy.js, next.config.mjs |
| Admin pages live in the `src/app/(admin)/` route group; its [layout.jsx](src/app/(admin)/layout.jsx) provides Sidebar, `I18nProvider`, `TokenRefreshProvider`, `ModuleActionsProvider`. | (admin)/layout.jsx |
| All browser → backend CRM calls go through the existing BFF catch-all [route.js](src/app/api/crm/[...path]/route.js): `fetch("/api/crm/<backend-path>")`. It injects `Authorization: Bearer` from the httpOnly cookie, `x-client-id`, and (via the server [axiosInstance](src/utils/axiosInstance.js)) the `X-BFF-Secret` header. **No new API routes are needed** — `/api/crm/market-index/...` forwards to `<API_BASE_URL>/market-index/...` as-is. | api/crm route + axiosInstance |
| Server components call the backend directly through the server-only [`axiosInstance`](src/utils/axiosInstance.js) (`"use server"`, `baseURL = API_BASE_URL`, adds Bearer + `X-BFF-Secret` automatically). Pattern to copy: [notifications.server.js](src/lib/notifications.server.js). | axiosInstance.js |
| Dev `.env`: `API_BASE_URL=http://localhost:8000`, `BFF_SECRET` set. So the spec's optional `ENABLE_BFF_SECRET_GATE` is already satisfied by existing plumbing — **do not add any secret handling**. | `.env` |
| Server role check: `getRoleFromToken()` / roles `["admin","owner"]` — [getRoleFromToken.js](src/lib/getRoleFromToken.js). Server client-id (tamper-proof): `decodeJwtClientId(accessToken)` — [jwtCookieUtils.js:34](src/lib/jwtCookieUtils.js:34), falling back to the `COOKIE_KEYS.CLIENT_ID` cookie (same fallback order as the CRM BFF route). | lib |
| Client-side equivalents for the Sidebar: `getRoleFromToken()` and `getClientIdFromToken()` from [getRoleFromToken.client.js](src/lib/getRoleFromToken.client.js). Conditional-item pattern to copy: the King-Admin "clients" item at [Sidebar.jsx:438](src/components/dashbord/common/Sidebar.jsx:438) (`{isMounted && isCurrentUserKingAdmin() && (<Link …>)}`). | Sidebar.jsx |
| i18n: client components use `const { translate } = useI18n()` ([useI18n.js](src/hooks/useI18n.js)); server components use `getServerTranslations(locale)` ([getServerTranslations.ts](src/utils/getServerTranslations.ts)). Keys live in `public/locales/en.js` + `ar.js`. ⚠️ `en.js` defines `sidebar:` **twice** (lines ~170 and ~519); the **last** literal wins — add sidebar keys to the later block and verify with the node one-liner in §6.2. | locales |
| React Query is already provisioned ([query-client-provider.jsx](src/providers/query-client-provider.jsx)); hook pattern to copy: [use-clients-data.js](src/hooks/use-clients-data.js); query-key factories: [query-utils.js](src/utils/query-utils.js). | hooks |
| Reusable UI (CLAUDE.md "reuse first"): `UnifiedDialog`, `LoadingSpinner`, `confirm-delete-dialog`, and the inputs barrel [`src/components/ui/inputs/index.js`](src/components/ui/inputs/index.js) (LenaField wrapper, `lena-text-field`, `lena-textarea`, `searchable-dropdown-select`). Read [LENA_FIELD_USAGE.md](src/components/ui/inputs/LENA_FIELD_USAGE.md) before building forms. | components/ui |
| Backend rejects request bodies > 100 KiB (413). Market-index payloads are small JSON; no chunking needed, but keep evidence lists bounded in the UI. | project memory |
| Primary color `#030250` comes from `globals.css` variables — never hardcode. Full RTL: use logical classes (`ms-*`, `me-*`, `start-*`, `end-*`, `text-start`), never `left/right`. | CLAUDE.md |

---

## 2. Gate 0 — Runtime Verification (BLOCKING: do this before writing any code)

As of plan-writing, **neither localhost:3000 nor localhost:8000 was running** (connection
refused). Nothing below was runtime-verified yet — that is your first job.

1. **Start the backend** (separate repo/service) on `http://localhost:8000`.
   Verify the market-index router exists and matches the spec:
   ```bash
   curl -s http://localhost:8000/openapi.json | python3 -c "
   import json,sys; d=json.load(sys.stdin)
   print('\n'.join(p for p in d['paths'] if 'market-index' in p))"
   ```
   Expected paths: `/market-index/locations/roots`, `/locations/{id}/children`,
   `/locations/{id}`, `/cards`, `/cards/{location_id}`, `/cards/{location_id}/units`,
   `/cards/{location_id}/units/{unit_id}`, `/cards/{location_id}/publish`,
   `/cards/{location_id}/history`, `/cards/{location_id}/versions/{version}`,
   `/estimate`, `/aggregates/{location_id}`.
   **If any path or schema differs from the spec, the spec is stale — the running backend wins. Stop and reconcile.**
2. **Start the frontend**: `npm run dev` (port 3000). `.env` already points
   `API_BASE_URL=http://localhost:8000`.
3. **Verify the `homey` tenant + an admin/owner login exist on the local backend.**
   Log in through the app UI (`/login`) as a homey admin/owner. Then confirm the JWT claims:
   ```bash
   # paste the access_token cookie value from DevTools → Application → Cookies
   node -e "const t=process.argv[1].split('.')[1];console.log(JSON.parse(Buffer.from(t.replace(/-/g,'+').replace(/_/g,'/'),'base64').toString()))" "<ACCESS_TOKEN>"
   ```
   You must see `client_id: "lenaqar"` (or CLIENT_ID cookie `homey`) and `role`/`client_type`
   of `admin` or `owner`. If no homey credentials exist locally, get them created on the
   backend first — do not fake the gate.
4. **Verify the BFF path end-to-end** from the logged-in browser session (DevTools console):
   ```js
   fetch('/api/crm/market-index/locations/roots').then(r => r.json()).then(console.log)
   ```
   Expected: the standard envelope `{ status: true, code: 200, data: { locations: [...], count: n } }`.
   Also verify the admin endpoint: `fetch('/api/crm/market-index/cards').then(r=>r.json())`
   → `{ status: true, data: { cards: [], count: 0 } }` (or existing cards).
5. **Verify a 403 for a non-admin**: log in as a `team_user` (if available locally) and
   repeat the `/cards` call → expect HTTP 403 / `detail: "Market Index admin access required"`.

---

## 3. Implementation

### 3.1 Route + shared-file registration (the ONLY edits to existing files)

1. [src/proxy.js:29](src/proxy.js:29) — add `'market-index'` to the `adminPaths` array.
   This gives the route the same auth/refresh protection and bare-path redirect
   (`/market-index` → `/{clientId}/market-index`) as every other admin screen.
2. [next.config.mjs:84](next.config.mjs:84) — add `'market-index'` to the `adminPaths`
   array inside `rewrites()`. This maps `/{clientId}/market-index[/...]` to the
   `(admin)/market-index` pages (both the base and `:rest*` variants are generated by the
   existing `flatMap`).
   ⚠️ Requires a dev-server **restart** to take effect.
3. [src/components/dashbord/common/Sidebar.jsx](src/components/dashbord/common/Sidebar.jsx) —
   one new conditional `<Link>` (see §3.4).
4. `public/locales/en.js` + `public/locales/ar.js` — new `marketIndex` key group + one
   `sidebar.marketIndex` key (see §3.5).

Nothing else in existing screens/files may change.

### 3.2 New files — data layer

```
src/lib/market-index/marketIndex.server.js   ← server-component reads (RSC)
src/utils/market-index-api.js                ← browser calls via /api/crm/*
src/hooks/use-market-index.js                ← React Query hooks (client)
```

**`src/lib/market-index/marketIndex.server.js`** (pattern: `notifications.server.js`)
- `import axiosInstance from "@/utils/axiosInstance";` (server-only, adds Bearer + BFF secret).
- Functions (all return the parsed envelope's `data` or `null` on failure — never throw
  into the RSC render):
  - `fetchMarketCards({ status, limit } = {})` → `GET /market-index/cards`
  - `fetchMarketCard(locationId)` → `GET /market-index/cards/{locationId}` (returns `{ card, units }`; treat 404 as `null` — "no draft yet")
  - `fetchLocation(locationId)` → `GET /market-index/locations/{locationId}`
- Envelope handling: `res.data.status === true ? res.data.data : null`.

**`src/utils/market-index-api.js`** (browser; pattern: the `fetch("/api/crm/…")` style —
note `fetchAdminClients` in `api.js` uses a king-admin route, but the generic pattern is
the `/api/crm` catch-all used across `utils/api.js`). One tiny shared helper inside the file:

```js
async function crm(path, options) {
  const res = await fetch(`/api/crm/market-index${path}`, options);
  const json = await res.json().catch(() => null);
  if (!res.ok || json?.status === false) {
    // Unified message per CLAUDE.md; error_message comes from the envelope,
    // FastAPI validation errors come as { detail }.
    const msg = json?.error_message || json?.detail || `Request failed (${res.status})`;
    const err = new Error(typeof msg === "string" ? msg : "Request failed");
    err.status = res.status;
    throw err;
  }
  return json?.data;
}
```

Exports (names ↔ endpoints, exactly the spec):
- `fetchLocationRoots()` → `GET /locations/roots`
- `fetchLocationChildren(locationId)` → `GET /locations/{id}/children`
- `fetchCards({status, limit})` → `GET /cards?status=&limit=`
- `fetchCard(locationId)` → `GET /cards/{id}`
- `saveCard(locationId, { general, adjustments })` → `PUT /cards/{id}` (create-on-first-edit — same call for create and edit)
- `saveUnit(locationId, unitBody)` → `PUT /cards/{id}/units`
- `deleteUnit(locationId, unitId)` → `DELETE /cards/{id}/units/{unitId}`
- `publishCard(locationId)` → `POST /cards/{id}/publish` (no body)
- `fetchHistory(locationId, {limit})` → `GET /cards/{id}/history`
- `fetchVersion(locationId, version)` → `GET /cards/{id}/versions/{version}`

**`src/hooks/use-market-index.js`** (pattern: `use-clients-data.js`)
- Local query-key factory in this file (do not edit `query-utils.js`):
  `const marketIndexKeys = { cards: (status) => ["market-index","cards",status ?? "all"], card: (id) => ["market-index","card",id], children: (id) => ["market-index","locations",id], history: (id) => ["market-index","history",id] }`.
- `useMarketCards(status)` — `useQuery`, `staleTime: 60_000`, `refetchOnWindowFocus: false`, seeded with `initialData` from the server component (passed as prop).
- `useMarketCard(locationId, initialData)` — card + units.
- `useLocationChildren(locationId)` — `enabled: !!locationId`, long `staleTime` (locations are static import data).
- Mutations `useSaveCard`, `useSaveUnit`, `useDeleteUnit`, `usePublishCard` — each
  `onSuccess`: `invalidateQueries` for `card(locationId)` and `cards` (publish also invalidates `history(locationId)`).

### 3.3 New files — pages & components

```
src/app/(admin)/market-index/
  page.jsx                                  ← RSC: guard + cards dashboard
  [locationId]/page.jsx                     ← RSC: guard + card editor shell
  _lib/access.js                            ← shared server guard
  _components/
    market-index-dashboard.jsx              ← "use client": list + filters + "New card"
    location-picker-dialog.jsx              ← "use client": roots → children drill-down
    card-editor.jsx                         ← "use client": tabs/sections wrapper
    card-general-form.jsx                   ← "use client"
    adjustments-editor.jsx                  ← "use client"
    evidence-list-editor.jsx                ← "use client" (shared by general + unit forms)
    reference-units-table.jsx               ← "use client"
    unit-form-dialog.jsx                    ← "use client" (UnifiedDialog)
    publish-panel.jsx                       ← "use client"
    version-history-dialog.jsx              ← "use client" (UnifiedDialog)
```

**`_lib/access.js` — the single guard used by both pages (server-only):**

```js
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { COOKIE_KEYS } from "@/constants/cookieKeys";
import { getRoleFromToken } from "@/lib/getRoleFromToken";
import { decodeJwtClientId } from "@/lib/jwtCookieUtils";

const MARKET_INDEX_CLIENT_ID = "lenaqar";
const ALLOWED_ROLES = ["admin", "owner"];

export async function assertMarketIndexAccess() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(COOKIE_KEYS.ACCESS_TOKEN)?.value;
  // JWT first (tamper-proof), cookie fallback — same order as the CRM BFF route.
  const clientId =
    decodeJwtClientId(accessToken) ||
    cookieStore.get(COOKIE_KEYS.CLIENT_ID)?.value ||
    "";
  const role = (await getRoleFromToken()) || "";
  const allowed =
    clientId.trim().toLowerCase() === MARKET_INDEX_CLIENT_ID &&
    ALLOWED_ROLES.includes(role.trim().toLowerCase());
  if (!allowed) notFound(); // hide, don't explain — CLAUDE.md
}
```

Note: unlike `assertCanManageTeam()`, a `null` role here means **denied** — this page is
opt-in for one tenant, and the backend still enforces 403 as defense in depth.

**`page.jsx` (dashboard, server component):**
1. `await assertMarketIndexAccess();`
2. `const cards = await fetchMarketCards();` (server-side, zero client waterfall).
3. `export async function generateMetadata()` → title "Market Index", `robots: { index: false, follow: false }` (copy the shape from [team/page.jsx](src/app/(admin)/team/page.jsx)).
4. Render `<MarketIndexDashboard initialCards={cards} />`.

Dashboard UI (client):
- Table/cards of `MarketCard`: `location_en_name`, `status` badge (`draft`/`published`),
  `active_version` (`v0` = never published), `updated_at`, units count is **not** in the
  list payload — don't show it.
- Filter chips: All / Draft / Published → refetch with `?status=`.
- Primary action **top-right**: "New Card" → `location-picker-dialog`.
- Row click → `/{clientId}/market-index/{card.location_id}`. Build hrefs with the
  clientId prefix exactly like the Sidebar: get it from `useParams()`? **No** — the
  rewrite hides the param from the page. Use the same approach as the Sidebar: the
  clientId is available via `getClientIdFromToken()` (client lib) or read
  `window.location.pathname.split("/")[1]`. Prefer `getClientIdFromToken()` with cookie
  fallback; verify in Gate V3 that links resolve.
- Empty state + `LoadingSpinner` for pending states.

**`location-picker-dialog.jsx`:**
- `UnifiedDialog`. Level-by-level drill-down: `fetchLocationRoots()` (spec: roots = cities)
  → column/list; clicking a node with `is_leaf === false` loads `fetchLocationChildren(id)`;
  breadcrumbs from `path_en`. Show `ar_name` when locale is `ar` (nodes carry both).
- Only a node with `is_leaf === true` enables the confirm button (backend 400s otherwise:
  "Market cards can only be attached to leaf locations").
- Confirm → navigate to `/{clientId}/market-index/{leaf.id}` (editor creates the card on
  first save — create-on-first-edit, no POST needed).

**`[locationId]/page.jsx` (editor, server component):**
1. `await assertMarketIndexAccess();`
2. `const { locationId } = await params;` — **decode**: `decodeURIComponent(locationId)`
   (ids contain `__` only, but be safe).
3. Parallel server fetch: `Promise.all([fetchMarketCard(locationId), fetchLocation(locationId)])`.
   - Location 404 → `notFound()`.
   - Location not leaf → `notFound()` (nothing to edit).
   - Card `null` (404) → render editor in "new draft" mode with `CardGeneral` defaults from
     the spec (`default_range_pct: 0.07`, weights all `25`, empty maps/lists).
4. Render `<CardEditor location={...} initialCard={...} initialUnits={...} />`.

**`card-editor.jsx`** — layout per CLAUDE.md UX:
- Header: Back button **top-start** (existing `back-button.jsx`), location breadcrumb from
  `path_en`, status + `active_version` badge; **top-end**: `Save Draft` (primary) and
  `Publish` buttons.
- Sections (simple stacked sections or existing tab pattern — match spacing of existing
  admin pages, e.g. the team/units pages): General · Adjustments · Reference Units · History link.
- `Save Draft` → `useSaveCard` with `{ general, adjustments }` only (server ignores all
  other keys). Success toast via the app's existing toast mechanism (check what
  `use-unit-mutations.js` uses and reuse it — verify before coding).

**`card-general-form.jsx`** — fields map 1:1 to `CardGeneral`:
- `public_listing_count` (integer ≥ 0; **0 is legit** — render as-is, no synthetic value).
- `location_avg_price_per_sqm` (nullable number > 0; empty input → `null`).
- `property_type_avg_price_per_sqm`: repeatable rows `[property_type dropdown][price]`.
  Property-type options = the spec's canonical list — define once in a new
  `src/lib/market-index/constants.js` (`PROPERTY_TYPES`, `VIEWS`, `FINISHINGS`,
  `EVIDENCE_SOURCES`) and verify the arrays against the running backend enums in Gate 0
  (`openapi.json` components). Use `searchable-dropdown-select` from the inputs barrel.
- `area_buckets`: per property type, rows of `min_sqm / max_sqm / avg_price_per_sqm`
  (validate `min ≤ max`, price > 0; overlap validation is done by the backend at publish —
  surface its `error_message` verbatim in the unified error style).
- `default_range_pct`: percent input shown as `7%` ↔ stored `0.07` (validate `0 ≤ x < 1`).
- `confidence_weights`: four numeric inputs, default 25 each.
- `evidence`: `evidence-list-editor` (see below).
- Labels above fields, inline validation, `LenaField` inputs — per CLAUDE.md.

**`evidence-list-editor.jsx`** (reused for card general and each unit):
- Row = `source` (dropdown of `property_finder | aqarmap | developer | crm | other`),
  `date` (date input, submit as `YYYY-MM-DD`), `url` (optional), `notes`
  (`lena-textarea`, **required non-empty when source = other** — inline-validate this).
- Add/remove rows; DeleteRow needs no confirm dialog (it's unsaved form state), but the
  form warns on Publish if a unit/general has zero evidence (backend publish rule).

**`adjustments-editor.jsx`:**
- Two groups: **View** (12 canonical values) and **Finishing** (6 canonical values).
- Each configured key: dropdown of remaining canonical values + signed percent input
  (`+5%` ↔ `0.05`, `-10%` ↔ `-0.10`). Store as fractions; display as %.
- Omit unconfigured keys entirely (empty maps are valid).

**`reference-units-table.jsx`:**
- Table of `ReferenceUnit`: property type, area (sqm), beds/baths, estimated price, range,
  developer price, rents, evidence count, `updated_at`.
- Row actions: Edit (opens `unit-form-dialog` prefilled) · Delete (uses existing
  `confirm-delete-dialog` — **always** confirm, per CLAUDE.md) → `useDeleteUnit`.
- "Add Unit" button at the section's top-end.

**`unit-form-dialog.jsx`** (`UnifiedDialog`):
- **Create mode:** all fields editable: `property_type` (canonical dropdown), `area_sqm`
  (> 0), `bedrooms`/`bathrooms` (int ≥ 0), `estimated_avg_price` (> 0), `price_range.low/high`,
  optional `developer_price`, `monthly_rent`, `monthly_furnished_rent` (≥ 0 or empty→null),
  `evidence` list.
- **Edit mode:** identity fields (`property_type`, `area_sqm`, `bedrooms`, `bathrooms`)
  rendered **read-only text** (not disabled inputs) with a hint
  `translate('marketIndex.unit.identityLocked')` — "to change these, delete the unit and
  create a new one". Backend 400s on identity change; the UI must simply never send a
  changed identity: on edit, send the same identity + edited price fields to
  `PUT /cards/{id}/units` (the identity is how the server matches the unit — there is no
  unit-id in the PUT body).
- Client-side validation before submit (mirror server rules to avoid raw API errors):
  `low ≤ high`, `low ≤ estimated_avg_price ≤ high`, all required numerics present.

**`publish-panel.jsx`:**
- `Publish` opens a confirm `UnifiedDialog` summarizing what will happen ("publishes
  version N+1 of {location}"). On confirm → `usePublishCard`.
- Success → show `changes_summary` (units added/removed/changed, general fields changed,
  adjustments changed, initial publication) and the new `version`.
- `400` → the backend joins **all** validation issues into `error_message`; render it as a
  multi-line list (split on the backend's separator — inspect a real 400 response in Gate
  V4 to learn the join character; do not guess it).
- `409` → unified message: version conflict, refetch card and retry.

**`version-history-dialog.jsx`:**
- `fetchHistory(locationId)` → list rows: `v{version}`, `published_at`, `published_by.email`,
  compact `changes_summary`. Click a row → `fetchVersion(locationId, version)` → read-only
  snapshot view (general summary + units table, reusing the table component in a read-only
  mode). Newest first (backend already orders it).

### 3.4 Sidebar entry (edit to existing file — additive only)

In [Sidebar.jsx](src/components/dashbord/common/Sidebar.jsx), next to the King-Admin
clients item (~line 438), add:

```jsx
{isMounted && isMarketIndexVisible() && (
  <Link href={navHref("/market-index")} prefetch={false} className={/* copy exact classes from the clients item, swap isLinkActive("/market-index") */}>
    <LineChart className="h-5 w-5 mr-3" />   {/* lucide-react, already the icon lib in this file */}
    <span>{translate("sidebar.marketIndex")}</span>
  </Link>
)}
```

`isMarketIndexVisible()` is a tiny helper in a **new** file
`src/lib/market-index/access.client.js` (mirror of `kingAdmin.client.js`):

```js
import { getRoleFromToken, getClientIdFromToken } from "@/lib/getRoleFromToken.client";
export function isMarketIndexVisible() {
  const clientId = (getClientIdFromToken() || "").trim().toLowerCase();
  const role = (getRoleFromToken() || "").trim().toLowerCase();
  return clientId === "lenaqar" && (role === "admin" || role === "owner");
}
```

⚠️ Before coding, open [getRoleFromToken.client.js](src/lib/getRoleFromToken.client.js)
and confirm the exact return shapes of `getRoleFromToken()` / `getClientIdFromToken()`
(they read the non-httpOnly cookies/JWT client-side). This is a **visibility** check only —
real enforcement is the server guard + backend 403.

### 3.5 Localization (edits to existing locale files — additive only)

- `public/locales/en.js` and `public/locales/ar.js`:
  - Add `marketIndex: "Market Index"` / `ar: "مؤشر السوق"` inside the **effective**
    `sidebar` block (the LAST `sidebar:` literal — en.js has two; line ~519 wins).
  - Add a new top-level `marketIndex: { … }` group with every UI string:
    titles, section names, field labels, validation messages, publish/confirm texts,
    status labels (`draft`/`published`), history labels, identity-locked hint, unified
    error fallbacks.
- Every string in the new components goes through `translate('marketIndex.…')` — **no
  hardcoded copy**, per CLAUDE.md.
- Verify keys resolve (see §6.2 one-liner) in both locales; missing ar keys must not fall
  back to raw key names on screen.

### 3.6 Performance rules for this feature

- Both pages are **server components**; first paint includes real data (cards list / card+units) — no client fetch waterfall on load. Client hooks receive `initialData`.
- Location tree, history, versions: fetched lazily only when their dialog opens (`enabled` flags).
- `staleTime` ≥ 60 s on reads; locations effectively static → 30 min.
- No new dependencies. No context providers. Local `useState` for form state (CLAUDE.md: prefer local state; React Query only for server state).
- Keep dialogs' heavy content mounted only while open (UnifiedDialog default behavior — verify).

---

## 4. Files summary

**New (no risk to other screens):**
```
src/lib/market-index/marketIndex.server.js
src/lib/market-index/constants.js
src/lib/market-index/access.client.js
src/utils/market-index-api.js
src/hooks/use-market-index.js
src/app/(admin)/market-index/page.jsx
src/app/(admin)/market-index/[locationId]/page.jsx
src/app/(admin)/market-index/_lib/access.js
src/app/(admin)/market-index/_components/*  (9 components, §3.3)
MARKET_INDEX_UI_PLAN.md (this file)
```

**Edited (additive, one hunk each):**
```
src/proxy.js                 → + 'market-index' in adminPaths
next.config.mjs              → + 'market-index' in rewrites adminPaths
src/components/dashbord/common/Sidebar.jsx → + one gated <Link>
public/locales/en.js, ar.js  → + sidebar.marketIndex + marketIndex group
```

Anything outside these lists = out of scope. Do not "improve" neighboring code.

---

## 5. Suggested commit sequence (branch off `main`)

1. `feat(market-index): route registration + access guards (proxy, rewrites, server/client guards)`
2. `feat(market-index): data layer (server fetchers, BFF client, react-query hooks, enums)`
3. `feat(market-index): cards dashboard + location picker`
4. `feat(market-index): card editor — general, adjustments, evidence`
5. `feat(market-index): reference units CRUD`
6. `feat(market-index): publish + version history`
7. `feat(market-index): sidebar entry + en/ar localization`

Run Gate V after commits 1, 3, 6, 7 minimum.

---

## 6. Verification Gates

### Gate V1 — routing & guard (after §3.1 + guards)
Restart `npm run dev` (rewrites need it), then:
- Logged in as **homey admin/owner**: `http://localhost:3000/homey/market-index` → page renders (placeholder ok).
- Bare `http://localhost:3000/market-index` → redirects to `/homey/market-index` (proxy).
- Logged out: `/homey/market-index` → redirected to `/login` (proxy refresh flow).
- Logged in as **non-homey** admin (e.g. `public` king admin): `/{their_id}/market-index` **and** `/homey/market-index` → 404 page.
- Logged in as homey **team_user** (non-admin role): → 404.
- Dev proxy debug: check the `x-mw-decision` response header in DevTools for the protected route (`next` when authenticated).

### Gate V2 — data layer
From the homey-admin browser session console:
- `fetch('/api/crm/market-index/cards').then(r=>r.json())` → envelope ok.
- Create flow dry-run with the spec's example body via
  `fetch('/api/crm/market-index/cards/<a real leaf id from roots/children>', {method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({general:{public_listing_count:1}})})`
  → returns stored `MarketCard` with `status: "draft"`.
- Confirm the leaf-only rule: PUT on a non-leaf id → 400 `"Market cards can only be attached to leaf locations"` surfaced as unified message in the UI.

### Gate V3 — dashboard + picker (browser)
- Dashboard lists the draft card created in V2; Draft/Published filters hit `?status=`.
- "New Card" (top-end) opens picker; drill roots → children; confirm disabled until `is_leaf`; confirm navigates to `/homey/market-index/{id}` with the **clientId prefix intact**.
- Empty-state renders when no cards.

### Gate V4 — editor, units, publish (browser, against real backend)
- Save Draft round-trips `general` + `adjustments` (reload page — values persist; server-set fields shown read-only).
- Add unit with the spec example body → appears in table; server-generated `id` starts with `{location_id}__`.
- Edit unit → identity fields read-only; price edits persist.
- Delete unit → confirm dialog → row gone; backend `GET /cards/{id}` confirms.
- Publish with a unit missing evidence → 400; **all** issues rendered as a readable list, no raw API text dump beyond the backend's own message.
- Fix evidence → Publish succeeds → success panel shows `version: 1`, `changes_summary.initial_publication: true`; dashboard badge flips to `published`, `active_version: 1`.
- Publish again with no changes / concurrently → 409 handled with unified message.
- History dialog: shows `v1` with publisher email; clicking opens read-only snapshot.

### Gate V5 — UX / i18n / RTL / perf
- Switch to Arabic (default locale is `ar`): every new string translated; layout mirrors correctly (no `left-`/`right-` classes in the new code — `grep -rn "left-\|right-\|ml-\|mr-\|pl-\|pr-" src/app/\(admin\)/market-index src/lib/market-index` should return only justified hits; prefer `ms/me/ps/pe/start/end`).
- Mobile viewport (375px): dashboard table collapses/scrolls inside its own container; dialogs usable.
- No hardcoded `#030250` in new code: `grep -rn "030250" src/app/\(admin\)/market-index` → empty.
- Network tab on first load of `/homey/market-index`: **no** client fetch for the cards list (server-rendered); only lazy dialog fetches on open.

### Gate V6 — regression safety (never touch other screens)
- `git diff --stat main` — confirm the only existing files changed are the four in §4.
- `npm run lint` and `npm run build` pass.
- If the repo's test script exists (`npm test` — check `package.json` first), run it.
- Smoke-click through untouched screens as a homey admin: dashboard, units, team — sidebar unchanged apart from the new item; as a non-homey user: sidebar identical to before.

---

## 7. Known open questions (resolve at Gate 0, do not guess)

1. Exact JWT claim carrying `client_id` for homey users (`client_id` vs cookie only) —
   step 0.3 answers this; if the JWT lacks it, the guard's cookie fallback carries the
   check and the backend 403 remains the real enforcement.
2. The separator the backend uses to join publish validation issues in `error_message` —
   inspect a real 400 (Gate V4) before writing the splitter.
3. Whether local backend seed data has locations imported (`/locations/roots` non-empty).
   If empty, get the location import run on the backend first — the UI cannot create locations.
4. Toast/notification mechanism to reuse — copy whatever `use-unit-mutations.js` /
   existing admin mutations use (verify before coding; do not introduce a new toast lib).
