# Server-Side API Migration — Findings & Planning Context

**Project:** LenaAI CRM (Next.js App Router)  
**Date:** June 16, 2026  
**Purpose:** Collect context for moving network calls server-side — hide backend API details from the browser Network tab, reduce API misuse risk, and improve performance — **without breaking current functionality**.

---

## Executive Summary

Today, **almost all CRM data flows through the browser directly to the backend API** (`NEXT_PUBLIC_API_BASE_URL`). The shared client module `src/utils/api.js` (~2,500 lines, `"use client"`) exposes **~90 direct backend HTTP calls** via `src/lib/axiosInstance.js`. Users can see every endpoint, query param, and response in DevTools.

A **partial server-side layer already exists** and works well:

- Server axios (`src/utils/axiosInstance.js`) + server actions
- Server profile fetch (`fetchClientProfileFromCookies`)
- Schedule page server prefetch
- Public property pages full SSR
- 12 Next.js Route Handlers (BFF proxies for upload, auth refresh, admin clients, match share, etc.)

The migration is **feasible incrementally** by extending existing patterns. Full hiding of backend URLs requires a BFF/proxy layer; **httpOnly access tokens** are a separate hardening step with higher auth refactor risk.

---

## Goals

| Goal | What it means |
|------|----------------|
| **Hide backend API** | Browser Network tab shows only same-origin calls (`/api/...`, Server Actions), not `api.lenaai.net/...` |
| **Reduce misuse** | Users cannot copy Bearer tokens + endpoint URLs from DevTools to call backend directly |
| **Improve performance** | SSR initial data, smaller client bundle, server-side caching, fewer client waterfalls |
| **Keep functionality** | All CRM flows (dashboard, units, chat, campaigns, uploads, permissions) continue working |

---

## Current Architecture

### Data flow (today)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         BROWSER (Network tab visible)                    │
├─────────────────────────────────────────────────────────────────────────┤
│  Client Component                                                        │
│       ↓ useQuery / useMutation / direct call                             │
│  src/utils/api.js  ("use client", ~100 exports)                          │
│       ↓                                                                  │
│  src/lib/axiosInstance.js  ("use client")                              │
│       ↓ Authorization: Bearer <access_token>                             │
│       ↓ x-client-id: <from JWT>                                         │
│  BACKEND API  (NEXT_PUBLIC_API_BASE_URL → e.g. api.lenaai.net)          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                    SERVER (partial — not yet default)                    │
├─────────────────────────────────────────────────────────────────────────┤
│  Server Component / Server Action / Route Handler                        │
│       ↓                                                                  │
│  src/utils/axiosInstance.js  ("use server")                              │
│       ↓ reads httpOnly + non-httpOnly cookies via next/headers           │
│  BACKEND API                                                             │
└─────────────────────────────────────────────────────────────────────────┘
```

### Dual axios instances

| File | Directive | Used by | Cookie/token source |
|------|-----------|---------|---------------------|
| `src/lib/axiosInstance.js` | `"use client"` | `src/utils/api.js`, `news-feed.jsx` | `LenaCookiesManager` (js-cookie) — **access token readable in JS** |
| `src/utils/axiosInstance.js` | `"use server"` | Server actions, `serviceFetching.js`, `unit-api.ts`, `project-api.ts` | `cookies()` from `next/headers` |

**Important:** `src/utils/api.js` is marked `"use client"` but is imported by `src/lib/projects/project-api.ts` (server context). This cross-boundary import is a smell and should be untangled during migration.

### API configuration (exposed to client bundle)

```6:11:src/lib/apiConfig.js
const api_base_url = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.lenaai.net";
export const API_BASE_URL = ...
export const PUBLIC_X_API_KEY = (process.env.NEXT_PUBLIC_X_API_KEY ?? "").trim();
```

- `NEXT_PUBLIC_API_BASE_URL` — **full backend URL in client JS**
- `NEXT_PUBLIC_X_API_KEY` — **public API key in client bundle** (used for `/public/*` routes)
- `NEXT_PUBLIC_IMAGE_BASE_URL` — image host also public

### Auth & cookies

```11:17:src/lib/CookieConfig.js
ACCESS_TOKEN: {
  ...
  httpOnly: false,  // ← readable by JavaScript
},
REFRESH_TOKEN: {
  ...
  httpOnly: true,
},
```

| Cookie | httpOnly | Client-readable | Used for |
|--------|----------|-----------------|----------|
| `access_token` | **No** | Yes (js-cookie + document) | Bearer header on every client axios call |
| `refresh_token` | Yes | No | `/api/refresh-token` (browser sends automatically) |
| `client_id` | No | Yes | Routing + fallback when JWT missing |
| `client_info` | No | Yes | Display name, type in UI |

**Token refresh flow (hybrid):**

1. Client axios gets 401 → `TokenRefreshService` → `POST /api/refresh-token`
2. Server reads httpOnly refresh token, calls backend, sets cookies
3. Client **also** updates access token in js-cookie (`LenaCookiesManager.setAccessToken`)
4. **`src/proxy.js` IS the active middleware.** Next.js 16 renamed the middleware convention `middleware.(js|ts)` → `proxy.(js|ts)` (function `middleware` → `proxy`). So `src/proxy.js` (exports `proxy` + `config`) is auto-loaded by the framework and **already runs on every request** — its auth redirects (missing-access-token → `/api/refresh-token?redirect=...`, bare `/dashboard` → `/{clientId}/dashboard`, logged-in `/` → dashboard, no-refresh-token → `/login` + cookie wipe) are live in production. The build confirms this: `ƒ Proxy (Middleware)`. **Do not create a `middleware.js`** — Next 16 errors on having both.

### Routing

- Admin URLs: `/:clientId/{adminPath}` rewritten to `/{adminPath}` via `next.config.mjs`
- Admin layout (`src/app/(admin)/layout.jsx`) is a **server component** — fetches profile via `getCachedClientProfile()` server-side
- Most admin `page.jsx` files are **server shells** that render a **client wrapper** with no server-fetched list data

**Pattern (dominant):**

```jsx
// page.jsx (Server) → metadata + pass searchParams
export default async function UnitsPage({ searchParams }) {
  return <UnitsPageClient searchParams={searchParams} clientId={clientId} />;
}
// UnitsPageClient ("use client") → useQuery → api.js → backend
```

**Exception (good pattern to copy):**

```jsx
// schedule/page.jsx — server prefetches, passes initial data to client
const [scheduleData, salesData] = await Promise.allSettled([
  getschedual(...),
  getSalesData()
]);
return <Schedual initialData={...} />;
```

### State management

- **TanStack Query** global singleton (`src/providers/query-client-provider.jsx`)
  - `staleTime`: 5 min, `gcTime`: 5 min (recently reduced for memory)
- **React Query hooks** in `src/hooks/` wrap `api.js` functions
- Related prior audit: `MEMORY_AUDIT_AND_IMPLEMENTATION_PLAN.md` (pagination, cache pressure)

---

## Security Exposure Analysis

### What users can see/do today in DevTools

1. **Full backend base URL** and every path (`/units/v1/slim-list`, `/messages/v2/all`, etc.)
2. **Authorization Bearer token** on every request (access token is not httpOnly)
3. **`x-client-id` header** derived from JWT client-side
4. **Request/response bodies** — leads, units, chat messages, analytics, WhatsApp payloads
5. **Query parameters** — filters, cursors, user IDs, client IDs
6. **`NEXT_PUBLIC_X_API_KEY`** in bundled JS (for public endpoints)
7. **Console logs in dev** — client axios logs every request URL (`🚀 Axios Request: GET ...`)

### Endpoints with highest misuse risk (client-exposed)

| Category | Example endpoints | Risk |
|----------|-------------------|------|
| **Destructive** | `DELETE /units/delete`, `DELETE /user/delete-user`, `DELETE /developers/{id}` | Data loss |
| **Messaging** | `POST /chat/client-message`, `POST /whatsapp/send_messages`, campaign chat endpoints | Spam / impersonation |
| **Admin** | `GET /admin/data-projection`, `client/admin/clients`, `DELETE /client/...` | Cross-tenant access attempts |
| **Bulk ops** | `POST action/v1/create/bulk`, Excel import endpoints | Mass actions |
| **CRUD** | Units, projects, developers, campaigns, payment plans | Unauthorized modifications |

### What moving server-side actually achieves

| Protection | Server proxy helps? | Notes |
|------------|---------------------|-------|
| Hide endpoint URLs | ✅ Yes | Browser only sees `/api/crm/units` etc. |
| Hide response shapes | ✅ Partial | Still visible in browser if data returned to client |
| Prevent token theft | ⚠️ Partial | Requires **httpOnly access token**; server-only calls alone don't fix readable cookie |
| Prevent replay if token stolen | ❌ No | Backend must enforce authz per request |
| Rate limiting | ✅ Yes | Can add at Next.js BFF layer |
| Hide `X-API-Key` | ✅ Yes | Move `PUBLIC_X_API_KEY` to server-only env |

**Reality check:** Hiding Network tab entries **does not** stop a determined attacker with a valid session. It raises the bar and prevents casual API scraping/copy-paste. Backend authorization remains the real security boundary.

---

## Performance Analysis

### Current client-side costs

| Issue | Location | Impact |
|-------|----------|--------|
| Large client API module | `src/utils/api.js` ~2,500 lines, `"use client"` | Increases JS bundle |
| Client-side waterfalls | Page mount → useQuery → API → render | Slower TTFB/FCP vs SSR data |
| TanStack Query cache growth | Navigation across dashboard/units/projects | Memory pressure (see MEMORY_AUDIT doc) |
| Non-paginated fetches | `fetchProjects()`, legacy hooks | Loads 800+ projects client-side |
| Duplicate fetches | Client refetch after server already has cookies/profile | Wasted requests |
| Dev logging overhead | Client axios interceptors log every URL | Noise + minor perf hit |

### Performance wins from server-side migration

1. **SSR initial data** — first paint with content (schedule page pattern)
2. **Server-side caching** — e.g. `getCachedClientProfile`, `profileShortCache` (2.5s dedup)
3. **Parallel server fetches** — `Promise.all` in RSC (schedule page)
4. **Smaller client bundle** — move `api.js` logic server-side; client keeps thin action callers
5. **Reduced React Query scope** — use for mutations/refetch only, not primary reads
6. **Backend connection pooling** — server-to-server more efficient than many browser connections

### Performance risks during migration

- **Server Actions latency** — extra hop for interactive UI; mitigate with optimistic updates
- **RSC payload size** — don't serialize full 800-project lists; keep pagination
- **Cold starts** (if serverless) — batch requests, cache on server
- **Over-fetching on navigation** — use `revalidatePath` / tag-based cache intentionally

---

## Existing Server-Side Patterns (Reuse These)

### 1. Server axios + cookies

`src/utils/axiosInstance.js` — reads `ACCESS_TOKEN` from cookies, auto-refresh on 401, adds `X-API-Key` for `/public/*`.

### 2. Server actions (mutations)

| File | Functions | Backend calls |
|------|-----------|---------------|
| `src/app/(auth)/_actions/actions.js` | `loginAction` | via `src/utils/server-api.js` |
| `src/app/(admin)/dashboard/_actions/actions.js` | `addNewAction`, `sendNewMessage` | `action/v1/create`, `/chat/client-message` |
| `src/app/(admin)/dashboard/_actions/leads.js` | bulk import, add lead | leads endpoints |
| `src/app/(admin)/team/_actions/actions.js` | `addNewSales`, `editEmployee` | via `serviceFetching.js` |

### 3. Server data helpers

| File | Purpose |
|------|---------|
| `src/components/services/serviceFetching.js` | Schedule, sales employees, analytics (server) |
| `src/lib/fetchClientProfile.server.js` | Profile with inflight dedup + short cache |
| `src/lib/getCachedClientProfile.server.js` | React `cache()` wrapper for layout |
| `src/lib/units/unit-api.ts` | Server unit fetches for detail pages |
| `src/lib/projects/project-api.ts` | Server project fetches (needs cleanup) |
| `src/utils/server-api.js` | Login only (server) |

### 4. Next.js Route Handlers (BFF — 12 routes)

| Route | Purpose |
|-------|---------|
| `POST /api/refresh-token` | Token refresh (client + middleware redirect) |
| `POST /api/upload` | Image upload proxy with processing |
| `POST /api/client/signup` | Client signup |
| `GET/PATCH /api/client/admin/clients` | King admin client list (auth gate) |
| `GET/PATCH/DELETE /api/client/admin/clients/[clientId]` | Admin client CRUD |
| `GET/PUT/DELETE /api/client/whatsapp-instance` | WhatsApp instance proxy |
| `POST /api/auth/clear-session` | Logout |
| `GET/POST /api/match/share/*` | Public match share (token-based) |
| `GET /api/contact.vcf` | Contact card |

**Partial BFF already in `api.js`:**

- `uploadImages()` → `fetch("/api/upload")` ✅
- `fetchAdminClients()` → `axiosInstance.get("/api/client/admin/clients")` ✅
- WhatsApp instance CRUD → `/api/client/whatsapp-instance` ✅
- Most other ~85 calls → **direct backend** ❌

### 5. Full SSR pages (reference implementations)

| Page | Server fetch |
|------|--------------|
| `src/app/allProberties/[code]/page.jsx` | `resolvePublicUnitByCodeParam` → server unit API |
| `src/app/(admin)/schedule/page.jsx` | `getschedual` + `getSalesData` parallel prefetch |
| `src/app/(admin)/layout.jsx` | `getCachedClientProfile()` for sidebar permissions |

---

## Client-Side API Inventory

### `src/utils/api.js` — ~100 exports, ~90 axios calls

Grouped by CRM module:

#### Auth & profile
- `loginUser` (client duplicate of server-api login)
- `getProfileData`, `updateProfileData`, `uploadClientLogo`, `deleteClientLogo`
- `getClientid`, `getValidatedApiClientId` (client JWT decode helpers)

#### Dashboard / leads
- `fetchUsersData` — `GET messages/v2/all`
- `getChatHistory`, `sendClientMessage`, `resetUnreadMessagesCount`
- `getClientRequirements`, `updateUserRequirements`
- `addLeadTags`, `removeLeadTags`, `replaceLeadTags`
- `createUserAction`, `createBulkUserActions`, `updateUserAction`
- `updateUserInfo`, `updateUserName`, `deleteUser`
- `toggleAutoReply`, `getClientActions`
- `fetchScheduledActionsByDate`

#### Units
- `fetchUnitsFilter`, `fetchPendingApprovalUnits`, `fetchUnitById`, `fetchUnitByCode`
- `addSaleUnit`, `addRentUnit`, `updateSaleUnit`, `updateRentUnit`, `deleteUnit`
- `approveUnit`, `extractUnitFromText`, `getShareUnitData`
- `fetchUnits` (full list — `/units/all`)

#### Projects / compounds
- `fetchProjects`, `fetchProjectsPaginated`, `fetchProjectsNames`, `fetchProjectById`
- `fetchCitisAndProjects`, `addCompound`, `updatecompound`, `deleteProject`
- `addNewPhase`, `updatePhase`, `deletePhase`, `importProjects`

#### Developers
- `fetchDevelopers`, `fetchDeveloperNames`, `fetchDeveloperDetails`
- `addDeveloper`, `updateDeveloper`, `deleteDeveloper`
- `getDeveloperContactOverride`, `setDeveloperContactOverride`, `deleteDeveloperContactOverride`
- `importDevelopers`

#### Campaigns
- `fetchCampaigns`, `fetchCampaignNamesOnly`, `createCampaign`, `updateCampaign`

#### Campaign chat (WhatsApp)
- `fetchCampaignSessions`, `fetchCampaignSession`
- `toggleCampaignAIReply`, `updateCampaignSessionName`, `toggleCampaignFavorite`, `updateCampaignNotes`
- `sendCampaignReply`, `sendWhatsappAutomationMessages`, `sendWhatsappMessages`

#### Analytics
- `fetchManagerAnalytics`, `fetchLegacyUserAnalytics`, `fetchLegacyMonthData`
- (Server duplicates exist in `serviceFetching.js` for some analytics)

#### Team / schedule (partial server overlap)
- `deleteEmployee` (client) vs `createNewEmployee`/`editExistingEmployee` (server)
- `getAvailableSlots`, `createBooking`

#### Notifications & news
- `fetchNotifications`, `markNotificationRead`, `markAllNotificationsRead`
- `fetchNews`

#### Payment plans
- `fetchPaymentPlans`, `createPaymentPlan`, `updatePaymentPlan`

#### Admin / king admin
- `fetchAdminClients`, `updateAdminClient`, `deleteClient` (partially proxied)
- `fetchClientPermissionSchema`, `fetchDataProjection`
- `upsertClientWhatsappInstance`, `deleteClientWhatsappInstance`

#### Match share (public)
- `createMatchShareToken`, `getMatchShareContext`, `savePublicUnitReaction`, `submitMatchViewingRequest`
- (Some proxied via `/api/match/share/*`; client functions may still call backend in places)

#### Media
- `uploadImages` → already uses `/api/upload` ✅
- `deleteImage` → direct `DELETE /gcs/{imageId}` ❌

### React Query hooks (all client-side → `api.js`)

| Hook | Data |
|------|------|
| `use-users-data.js` | Dashboard leads list |
| `use-users-infinite-data.js` | Infinite scroll leads |
| `use-units-page-data.js` | Units grid |
| `use-pending-approval-units-page-data.js` | Pending units |
| `use-unit-details-data.js` | Single unit |
| `use-unit-mutations.js` | Unit CRUD mutations |
| `use-admin-shared-data.js` | Developers, projects, cities |
| `use-clients-data.js` | King admin clients |
| `use-notifications.js` | Notifications polling |
| `use-excel-export.js` | Export |
| `useMessagingProviderConfig.js` | WhatsApp config |
| `use-import-leads.js` / `use-add-lead.js` | Lead import |

### Direct `api.js` importers (60+ files)

Key areas:

- **Dashboard:** `clients-table.jsx`, `LeadDetailPane.jsx`, `chat-client-wrapper.jsx`, split-view dialogs
- **Units:** `units-page-client.jsx`, `add-unit-Modal.jsx`, filters, grids
- **Projects:** `ProjectsList.jsx`, `add-project-dialog.jsx`
- **Developers:** `developers-client-wrapper.jsx`, `developer-details-page.jsx`
- **Campaigns:** `CampaignsPageClient.jsx`, `CampaignDialog.jsx`
- **Campaign chat:** entire `page.jsx` (667 lines client)
- **Analytics:** `AnalyticsPageClient.jsx`, `AnalyticsDashboard.jsx`
- **Settings:** `clientInfo.jsx`, `ClientsListWrapper.jsx`
- **Map, news, schedule dialogs, team table**

### Admin pages: server vs client data loading

| Page | Server data fetch? | Client fetches via api.js? |
|------|-------------------|---------------------------|
| `schedule` | ✅ Prefetch schedule + sales | Partial (dialogs) |
| `layout` | ✅ Profile for sidebar | Sidebar may refetch |
| `dashboard` | ❌ Metadata only | ✅ Full leads table |
| `units` | ❌ clientId cookie only | ✅ Full units grid |
| `myProjects` | ❌ | ✅ Projects list |
| `developers` | ❌ | ✅ Developers infinite scroll |
| `campaigns` | ❌ | ✅ |
| `campaign-chat` | ❌ | ✅ Heavy real-time |
| `analytics` | ❌ | ✅ |
| `team` | ❌ Permission check only | ✅ Team table client fetch |
| `notifications` | ❌ | ✅ Polling |
| `news` | ❌ | ✅ Direct client axios in news-feed |
| `map` | ❌ | ✅ |
| `[email]` settings | ❌ | ✅ Profile form |

---

## Migration Approach Options

### Option A — Next.js Route Handlers (BFF)

Create `/api/crm/*` routes that proxy to backend.

**Pros:** Clear REST surface, works with `fetch` from client, easy to add rate limits/logging  
**Cons:** Many route files, must duplicate auth/validation per route, client still needs thin fetch layer

**Best for:** Read endpoints with query params, file uploads, third-party-like APIs

### Option B — Server Actions

Move mutations and some reads to `"use server"` functions.

**Pros:** No manual route files, typed, integrated with forms/`useActionState`, cookies automatic  
**Cons:** Not ideal for GET caching semantics, harder for polling/infinite scroll, 10mb body limit (already configured)

**Best for:** Form submissions, CRUD mutations, bulk actions

### Option C — RSC data fetching (Server Components)

Fetch in `page.jsx`, pass `initialData` to client components.

**Pros:** Best performance (SSR), SEO, no client API for first paint  
**Cons:** Refetch/filter changes need server re-render or supplementary client fetch

**Best for:** List pages with filters (units, dashboard), detail pages

### Option D — Hybrid (recommended)

Combine all three — matches existing codebase patterns:

```
Reads (lists)     → RSC prefetch + React Query initialData for filter changes
Mutations         → Server Actions (extend dashboard/_actions pattern)
Uploads           → Existing /api/upload pattern
Polling/chat      → BFF routes or Server Actions with short cache
Public pages      → Already SSR via unit-api.ts — keep
```

---

## Recommended Phased Plan

### Phase 0 — Quick wins (low risk, high visibility)

**Goal:** Establish patterns without breaking flows.

- [x] Add server-only env `API_BASE_URL` (non-`NEXT_PUBLIC_`) for server axios; keep `NEXT_PUBLIC_` during transition — `apiConfig.js` now prefers `API_BASE_URL` / `X_API_KEY` / `IMAGE_BASE_URL` with public fallback
- [x] Move `PUBLIC_X_API_KEY` to server-only env for proxied public routes — `X_API_KEY` now takes precedence; drop public fallback once `/public/*` calls are server-proxied
- [x] Remove/guard client axios console logging in production (`src/lib/axiosInstance.js`) — gated behind `NODE_ENV === "development"`
- [ ] Document which 12 BFF routes exist; align naming (`/api/crm/...`)
- [x] ~~Wire `src/proxy.js` as `middleware.js`~~ — **already active** via Next 16's `proxy.js` convention. Added dev-only observability (`x-mw-decision` header + decision logging) and `GET /api/auth/status` to test the auth/refresh flow.

**Files:** `apiConfig.js`, `lib/axiosInstance.js`, `proxy.js` (dev observability), `app/api/auth/status/route.js` (new, dev-only)

### Phase 1 — Read-heavy pages (performance + hide list endpoints)

**Goal:** SSR initial list data; Network tab shows same-origin only for first load.

| Module | Current | Target |
|--------|---------|--------|
| Units page | `UnitsPageClient` + `use-units-page-data` | Server fetch slim-list in `page.jsx`, pass `initialUnits` |
| Dashboard leads | `DashboardPageClient` + `use-users-infinite-data` | Server fetch first page in `page.jsx` |
| Developers | `useDevelopers` infinite query | Server fetch first page |
| Projects | `useProjectsPaginated` | Server fetch first page |
| Notifications | client polling | BFF `GET /api/crm/notifications` |

**Pattern (from schedule page):**

```jsx
// page.jsx
const initialData = await fetchUnitsServer(searchParams);
return <UnitsPageClient initialData={initialData} searchParams={searchParams} />;
```

**React Query adjustment:**

```js
useQuery({
  queryKey: [...],
  queryFn: () => fetchViaBFF(...),
  initialData: serverInitialData,
});
```

### Phase 2 — Mutations via Server Actions

**Goal:** Hide write endpoints; centralize validation.

| Module | Functions to migrate |
|--------|---------------------|
| Units | add/update/delete/approve |
| Projects | add/update/delete phases |
| Developers | CRUD + contact override |
| Dashboard | tags, requirements, user info (some already in actions.js) |
| Campaigns | create/update |
| Settings | `updateProfileData`, logo upload/delete |

**Reuse:** `dashboard/_actions/actions.js`, `leads.js`, `team/_actions/actions.js` as templates.

**Each action should:**

1. Read `client_id` from server cookies (`getClientid()` from `clientCookies.js` — already server-safe)
2. Assert permissions (`assertCanManageTeam`, `useModuleActions` server equivalent)
3. Call `src/utils/axiosInstance.js`
4. `revalidatePath()` affected routes
5. Return `{ success, message }` — never raw API errors (per UX rules)

### Phase 3 — High-interaction modules (hardest)

| Module | Challenge | Approach |
|--------|-----------|----------|
| **Campaign chat** | Real-time, infinite scroll, many endpoints | BFF routes under `/api/crm/campaign-chat/*`; keep client UI |
| **Dashboard chat** | `sendNewMessage` already has server action but client also calls `api.js` | Consolidate to server action only |
| **Analytics** | Charts + filters | Server prefetch summary; BFF for filter changes |
| **Map view** | Geo + units overlay | BFF geo endpoints |
| **Excel import/export** | Large payloads | Server Actions with streaming or Route Handler |
| **News feed** | Uses client axios directly | Move to server action or RSC |

### Phase 4 — Auth hardening (optional but recommended for token hiding)

**Goal:** Access token not readable in JS.

- [ ] Set `ACCESS_TOKEN.httpOnly: true` in `CookieConfig.js`
- [ ] Remove `LenaCookiesManager.getAccessToken()` from client axios (eliminate client axios entirely)
- [ ] All API calls go through server layer; client never attaches Bearer
- [ ] Update `TokenRefreshService` — server sets httpOnly access cookie; client only triggers `/api/refresh-token`
- [ ] Update `getRoleFromToken.client.js` → rely on server-passed permissions (already partially done via `ModuleActionsProvider`)

**Risk:** High — touches every auth touchpoint. Do after Phases 1–3 stable.

### Phase 5 — Cleanup

- [ ] Deprecate `src/utils/api.js` client exports; split into `src/lib/server-api/*.ts` (server) + thin `src/lib/client-api.ts` (BFF fetch only)
- [ ] Remove `src/lib/axiosInstance.js` (client) when unused
- [ ] Fix `project-api.ts` importing client `api.js`
- [ ] Reduce TanStack Query to interactive cache only
- [ ] Update `CLAUDE.md` architecture section

---

## Risk & Breakage Matrix

| Area | Risk | Mitigation |
|------|------|------------|
| Filter/pagination URL state | Medium | Pass `searchParams` to server fetch; keep client refetch for changes |
| Infinite scroll | Medium | BFF cursor endpoints; seed with server first page |
| File uploads (10mb) | Low | Already proxied via `/api/upload` — extend pattern |
| Permissions (`module_actions`) | High | Server must check on every action; mirror `useModuleActions` server-side |
| `client_id` in URL vs cookie | Medium | Server validates `client_id` from JWT matches route (existing `clientId-validator.js`) |
| Campaign chat X-API-Key | Medium | Server adds key; remove from client env |
| King admin flows | Medium | Keep `isRequestFromKingAdmin` gate on BFF routes |
| i18n error messages | Low | Continue `getApiErrorMessage` / `translate()` in server actions |
| RTL / mobile | Low | No UI changes in Phase 1–2 |
| Tests | Medium | No API integration tests found — add manual test plan per phase |

### Functionality that must keep working (checklist)

- [ ] Login / logout / token refresh / permissions_updated redirect
- [ ] Sidebar + module action hiding
- [ ] Dashboard leads: search, filter, infinite scroll, bulk actions, split view
- [ ] Lead detail: chat, requirements, tags, actions, WhatsApp
- [ ] Units: filter, pagination, add/edit/delete, pending approval, share links
- [ ] Projects: pagination, phases, import
- [ ] Developers: infinite scroll, contact override
- [ ] Campaigns + campaign chat (WhatsApp)
- [ ] Schedule calendar + bookings
- [ ] Team CRUD with role-based `module_actions`
- [ ] Analytics dashboards
- [ ] Notifications bell + polling
- [ ] King admin: clients list, signup, WhatsApp instance
- [ ] Public property pages (`/allProberties/[code]`)
- [ ] Match share public page
- [ ] Image upload (units, projects, logos)
- [ ] Excel import/export
- [ ] i18n (ar/en) + RTL

---

## Key Files Reference

### Must understand before changing

| File | Role |
|------|------|
| `src/utils/api.js` | Main client API surface (~90 backend calls) |
| `src/lib/axiosInstance.js` | Client axios (Bearer from js-cookie) |
| `src/utils/axiosInstance.js` | Server axios (Bearer from `cookies()`) |
| `src/lib/apiConfig.js` | `NEXT_PUBLIC_API_BASE_URL`, `PUBLIC_X_API_KEY` |
| `src/lib/CookieConfig.js` | httpOnly flags |
| `src/lib/LenaCookiesManager.js` | Client cookie read/write |
| `src/lib/TokenRefreshService.js` | Client refresh via `/api/refresh-token` |
| `src/lib/fetchClientProfile.server.js` | Server profile pattern to copy |
| `src/components/services/serviceFetching.js` | Server analytics/schedule/sales |
| `src/providers/query-client-provider.jsx` | TanStack Query defaults |
| `next.config.mjs` | Server Actions 10mb, admin rewrites |

### Existing server actions

- `src/app/(auth)/_actions/actions.js`
- `src/app/(admin)/dashboard/_actions/actions.js`
- `src/app/(admin)/dashboard/_actions/leads.js`
- `src/app/(admin)/team/_actions/actions.js`

### Hooks to refactor (per phase)

- `src/hooks/use-users-data.js`
- `src/hooks/use-users-infinite-data.js`
- `src/hooks/use-units-page-data.js`
- `src/hooks/use-admin-shared-data.js`
- `src/hooks/use-clients-data.js`
- `src/hooks/use-notifications.js`
- `src/hooks/use-unit-mutations.js`

---

## Suggested BFF Route Structure (future)

```
/api/crm/
  ├── units/          GET list, GET [id], POST, PATCH, DELETE
  ├── projects/       GET list, GET [id], POST, PATCH, DELETE
  ├── developers/     GET list, GET [id], POST, PATCH, DELETE
  ├── leads/          GET list, GET [userId], messages, tags, actions
  ├── campaigns/      GET, POST, PATCH
  ├── campaign-chat/  sessions, session, reply, toggle-ai, ...
  ├── analytics/      stats, user-analysis, monthly
  ├── notifications/  GET, POST read
  ├── profile/        GET, PATCH
  ├── team/           GET employees, POST, PUT, DELETE
  └── media/          upload (exists), DELETE image

/api/auth/            refresh-token (exists), clear-session (exists)
/api/client/          signup, admin clients (exists)
/api/match/           share routes (exists)
```

Server Actions can replace many of these for mutations; BFF routes better for GET + polling.

---

## Environment Variables (proposed split)

| Variable | Current | Proposed |
|----------|---------|----------|
| `NEXT_PUBLIC_API_BASE_URL` | Client + server | **Remove from client** after migration |
| `API_BASE_URL` | — | Server-only backend URL |
| `NEXT_PUBLIC_X_API_KEY` | Client bundle | `X_API_KEY` server-only |
| `NEXT_PUBLIC_SITE_URL` | Keep public | Keep |
| `NEXT_PUBLIC_IMAGE_BASE_URL` | Keep public | Keep (images must load in browser) |

---

## Testing Plan (per phase)

1. **Auth flows** — login, expired access token refresh, permissions_updated logout, king admin access
2. **Per-module smoke** — load page, verify data matches pre-migration, apply filter, paginate
3. **Mutations** — create/edit/delete with success + validation error toasts (unified messages)
4. **Permissions** — unauthorized actions hidden (not disabled), server returns 403 gracefully
5. **Network verification** — DevTools shows no `api.lenaai.net` calls after phase completion
6. **Performance** — compare LCP/FCP on dashboard + units before/after (Lighthouse)
7. **RTL/mobile** — spot check Arabic + mobile viewport
8. **Public pages** — `/allProberties/[code]`, `/match/[token]` unchanged

---

## Open Questions (decide before implementation)

1. **Backend CORS** — Can backend restrict origins to Next.js server only after migration?
2. **Rate limiting** — Add at BFF layer, backend, or both?
3. **Caching strategy** — `unstable_cache` / `revalidateTag` per entity, or React Query only on client?
4. **Campaign chat** — Polling interval vs WebSocket (if any)? Highest complexity module.
5. **httpOnly access token** — Phase 4: do in same project or separate auth hardening sprint?
6. **middleware.js** — Should `src/proxy.js` be activated for route protection?
7. **API contract** — Will backend add a dedicated "frontend aggregator" API, or pure Next.js BFF?
8. **Observability** — Server-side logging/monitoring for proxied calls (Sentry, etc.)?

---

## Related Documents

- `CLAUDE.md` — project conventions (server components fetch data, client handles interactions)
- `MEMORY_AUDIT_AND_IMPLEMENTATION_PLAN.md` — pagination/cache performance context
- `src/app/(admin)/campaign-chat/README.md` — `NEXT_PUBLIC_X_API_KEY` requirements

---

## Summary: Where to Start

**Smallest safe first step:** Migrate **units list read** using the schedule page pattern — server-fetch in `units/page.jsx`, pass `initialData` to `UnitsPageClient`, add `GET /api/crm/units` BFF route (or server-only fetch function). Verify Network tab no longer shows `/units/v1/slim-list` on first load.

**Parallel quick win:** Migrate **analytics reads** to existing `serviceFetching.js` server functions (duplicates already exist for some endpoints).

**Defer:** Campaign chat (Phase 3), httpOnly access token (Phase 4).

This document is **findings only** — no code changes applied. Use it as the planning baseline for the next implementation sprint.
