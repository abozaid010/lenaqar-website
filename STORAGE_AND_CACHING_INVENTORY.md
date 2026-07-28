# Storage & Caching Inventory

Scan of the LenaAI website codebase (Next.js App Router). Options we **do not** use: **SWR**, **Zustand**, **Redux**, **IndexedDB**, **Service Worker / Cache API**.

---

## Cookies (`js-cookie` + `next/headers` cookies)

Auth, tenant, and locale session — primary durable client identity for SSR + client.

| Key (`COOKIE_KEYS`) | Purpose |
| --- | --- |
| `access_token` | Bearer auth |
| `refresh_token` | Token refresh |
| `access_token_exp` | Client-side expiry checks |
| `lena-website-client_id` | Tenant / client id |
| `client_info` | Profile snapshot (name, email, role fields, etc.) |
| `lang` | UI locale (`ar` / `en`) |

**Where used**

- `src/constants/cookieKeys.js` — key definitions
- `src/lib/LenaCookiesManager.js` — client read/write via `js-cookie`
- `src/lib/CookieConfig.js` — cookie option helpers
- Auth: `src/app/(auth)/_actions/actions.js`, `src/app/api/refresh-token/route.js`, `src/app/api/auth/status/route.js`, `src/app/api/auth/clear-session/route.js`, `src/proxy.js`
- Server pages / layouts reading cookies: admin layout, dashboard, units, team, developers, analytics, market-index, locations, marketing layout, root page, etc.
- BFF / API routes: `src/app/api/crm/[...path]/route.js`, social-media BFF, upload, openwa, match/share, locations catalog, client admin routes
- Role / profile: `src/lib/getRoleFromToken.js`, `src/lib/fetchClientProfile.server.js`, `src/lib/kingAdmin.js`
- Locale: `src/context/translate-api.js` (persists `lang` cookie)

---

## localStorage

Cross-tab / cross-session UI preferences and caches.

| Key / pattern | Purpose | Used in |
| --- | --- | --- |
| `dashboard-filters:{user}` | Dashboard filter persistence | `src/lib/dashboard-filters-storage.js`, `src/hooks/useDashboardFilterPersistence.js` |
| `dashboard-team-members:v3:{id}` | Cached team members for dashboard filters | `src/lib/dashboard-team-emails-session.js` |
| `campaignIds` | Campaign id list fallback for filters | `src/app/(admin)/dashboard/_components/clients-list-query.jsx`, `dashbord-filter.jsx` |
| `usersId` | Lead navigation order | `clients-list-query.jsx`, `NavigationButtons.jsx` |
| `lena_units_favorite_searches_{admin\|public}` | Saved unit search presets | `src/lib/units/favorite-searches.js`, `src/hooks/use-favorite-unit-searches.js` |
| `projects_filters` (default) | Projects list URL filters | `src/hooks/useUrlFilters.js` |
| `lenaai_contacts_cache` | Developer/client contact cache | `src/lib/contact-info.ts` |
| `lena:whatsapp:lastAccount:{client}:{user}` | Last WhatsApp send-from account | `src/lib/whatsapp-last-account.js`, `src/hooks/useWhatsappSelectedAccount.js` |
| `lenaNotificationReadIds` | Locally marked-read notification ids | `src/hooks/use-notifications.js` |
| `theme` | Social-media UI theme | `src/components/social-media/SocialMediaHeader.tsx` |
| `uploadUnitsExcelDialog_openCount` | Excel upload dialog open counter | `src/components/ui/upload-units-excel-dialog.jsx` |
| `lena_android_call_tip_seen_v1` | Android call tip dismissed | `src/components/phone/tel-link.js` |
| `lang` | Locale read in API layer (legacy / parallel to cookie) | `src/utils/api.js` |
| `clientId` | Validator probe only | `src/utils/clientId-validator.js` |

Helpers: `src/utils/safeJsonParser.js` (safe parse of stored JSON).

---

## sessionStorage

Tab-lifetime UI state (cleared when the tab closes).

| Key / pattern | Purpose | Used in |
| --- | --- | --- |
| `lena_units_session_filters_{admin\|public}` | Units list filter draft | `src/lib/units/session-filters.js`, `src/hooks/use-units-filter-draft.js` |
| `lena_pending_approval_session_filters` | Pending-approval units filters | `src/lib/units/pending-approval-session-filters.js` |
| `broker_units` | Detected broker unit ids for badges | `src/lib/units/broker-units-session.js`, `src/components/ui/resale_page_query.jsx` |
| `lenaai.unitsListOrigin` | Back-nav origin from units list → detail | `src/utils/units-navigation-source.js` |
| `lena.locations.catalog.v1` | Locations catalog client session cache | `src/utils/city_manager.js`, `src/lib/locations/invalidate-locations-catalog.client.js` |
| `lena.socialMedia.activationBaseline` | Social activation UI baseline | `src/components/social-media/ActivationUiProvider.tsx` |
| `openwa-auto-prompt-done` | OpenWA auto-prompt once per tab | `src/hooks/useOpenwaConnection.js` |

---

## TanStack React Query (in-memory client cache)

**Primary client server-state cache.** Singleton `QueryClient` in `src/providers/query-client-provider.jsx` (default `staleTime` / `gcTime` = 5 min).

**Not used:** SWR.

### Provider / utils

- `src/providers/query-client-provider.jsx`
- `src/utils/query-utils.js` — shared query keys + invalidate helpers

### Hooks (data fetching / mutations)

- Units: `use-units-page-data`, `use-pending-approval-units-page-data`, `use-unit-details-data`, `use-unit-by-code`, `use-units-by-owner-phone`, `use-unit-mutations`, `use-excel-export`
- Leads / clients: `use-clients-data`, `use-users-data`, `use-users-infinite-data`, `use-add-lead`, `use-import-leads`, `useConversation`
- Shared admin: `use-admin-shared-data` (developers, projects, locations catalog, etc.)
- Market index: `use-market-index`
- Messaging: `useMessagingProviderConfig`, `useOpenwaSessionsStatus`, `useSendWhatsappMessage` (related)
- Notifications: `use-notifications`
- Social media: `useSocialMediaPosts`, `useSocialMediaPostDetail`, `useSocialMediaComments`, `useSocialMediaCommentDetail`, `useSocialMediaDashboardSummary`, `useActivationStatus`

### Pages / components using `useQuery` / `useQueryClient` directly

- Dashboard: split view, lead panes, selection bar, actions modal, new-action form, Header (cache clear)
- Campaigns / campaign-chat
- Analytics / follow-up agent / dashboard summary
- Map (`staleTime`/`gcTime`: Infinity for session)
- News feed, schedule user dialog, Sidebar, client info, projects list, developer details
- Social-media posts / comments / dashboard clients
- Unit approve / chat images / add project & developer dialogs

---

## In-memory (no Zustand / Redux)

### React Context (UI / session memory)

| Context | Purpose | File |
| --- | --- | --- |
| I18n | Locale + `translate()` | `src/context/translate-api.js` |
| Module actions | Permission flags for UI | `src/context/module-actions-context.jsx` |
| Units bulk selection | Multi-select on units | `src/context/units-bulk-selection-context.jsx` |
| Dashboard leads bulk | Multi-select on leads | `src/context/dashboard-leads-bulk-context.jsx` |
| Average score | Dashboard score UI | `src/context/average-score.js` |
| Dashboard filter persistence | Restored filters bridge | `src/hooks/useDashboardFilterPersistence.js` |
| Social activation UI | Activation flow state | `src/components/social-media/ActivationUiProvider.tsx` |

### Module-level / process memory caches

| Cache | Purpose | File |
| --- | --- | --- |
| Locations catalog (TTL 1h) | Server process cache for city tree | `src/lib/locations/locations-catalog.server.js` |
| Client profile short cache + inflight | Dedupe RSC profile GETs (~2.5s) | `src/lib/fetchClientProfile.server.js` |
| `cache()` React/Next | Request-memoized profile / notifications | `src/lib/getCachedClientProfile.server.js`, `src/lib/notifications.server.js` |
| Locale messages `Map` | Loaded i18n dictionaries | `src/lib/i18n/load-locale-messages.js` |
| `CityManager` singleton | In-tab locations tree (+ sessionStorage) | `src/utils/city_manager.js` |
| ContactInfo maps | In-memory + localStorage contacts | `src/lib/contact-info.ts` |
| Slug → unit id TTL Map | Public unit URL resolution | `src/lib/units/unit-url-utils.ts` |
| Rate limit `Map` | API rate limiting | `src/lib/rateLimit.js` |
| Refresh-token inflight | Dedup concurrent refresh | `src/lib/refreshTokenInflight.js` |
| Match share interaction store | Ephemeral share interactions | `src/lib/match/share-token-server.js` |
| QueryClient browser singleton | Survives client navigations | `src/providers/query-client-provider.jsx` |

---

## Next.js / HTTP caching

| Mechanism | Purpose | Where |
| --- | --- | --- |
| `revalidatePath` | Invalidate RSC paths after mutations | Dashboard actions, team actions, leads actions |
| `next: { revalidate: 3600 }` | ISR-style fetch for sitemap | `src/app/sitemap.ts` |
| `Cache-Control` on locations API | Browser/CDN hints for catalog | `src/app/api/locations/catalog/route.js` |
| `Cache-Control` immutable assets | Static asset caching in proxy | `src/proxy.js` |

---

## Quick reference (by option)

```
Cookies:          auth, client_id, client_info, lang — SSR pages, BFF, proxy, LenaCookiesManager
localStorage:     dashboard filters/team, campaignIds/usersId, favorite unit searches,
                  projects_filters, contacts cache, WhatsApp last account, notification read ids,
                  theme, excel dialog counter, Android call tip, lang (api.js)
sessionStorage:   units/pending filters, broker_units, units list origin, locations catalog,
                  social activation baseline, OpenWA auto-prompt
TanStack Query:   primary client API cache (units, leads, campaigns, analytics, map, social,
                  market-index, notifications, messaging, admin shared data)
SWR:              not used
Zustand / Redux:  not used
React Context:    i18n, permissions, bulk selection, scores, dashboard filter bridge, social activation
Server in-memory: locations catalog TTL, profile short cache, rate limit, share store, locale Map
Next cache:       revalidatePath, sitemap revalidate, Cache-Control headers
IndexedDB / SW:   not used
```
