# CLAUDE.md — LenaAI CRM (Next.js)
ROLE: Act As Senior Next JS, and Senior UX engineer,
## Stack & Theme
Next.js App Router · TypeScript · Tailwind · React Query · Axios (`src/utils/axiosInstance`)
Primary color `#030250` — defined once in `globals.css`, never hardcoded elsewhere.

## Architecture
`(admin)/` — CRM pages (units, myProjects, campaigns, developers, team, dashboard) — wrapped in sidebar layout
`(auth)/` — login flows | `projects/[id]/[slug]` · `properties/[id]` — standalone full-page detail views (no admin layout)
`src/lib/` server API helpers · `src/utils/api.js` shared layer · `src/hooks/` React Query hooks · `src/context/` i18n + auth

## Component Rules
**Reuse first**: `UnifiedDialog`, `ImageWithLoader`, `LoadingSpinner`, `LenaField`, `LenaTextArea`, `SearchableDropdown`, `EditButton`, `DeleteButton`, `WhatsAppButton`, `OwnerActions`
New components must match existing spacing, styling, and patterns exactly.

## UX (Non-Negotiable)
Primary action → **top-right** · Cancel/Back → top-left · Delete → always needs confirmation dialog
Forms: labels above fields, inline validation, keep short · No raw API errors — unified messages only
Hide (don't disable) unauthorized actions · Mobile-first · Full RTL, no hardcoded `left`/`right`

## Routing Rule for Detail Pages
Detail pages (`properties/[id]`, `projects/[id]/[slug]`) must live **outside** `(admin)/` to avoid the sidebar layout.
`/units/[id]` redirects to `/properties/[id]` — feature-flagged via `NEXT_PUBLIC_NEW_UNIT_DESIGN`.

## Auth & Permissions
Cookies (`COOKIE_KEYS`) → `getRoleFromToken` + `useModuleActions` + `useBrokerPermission` · Server components read cookies directly; client components use hooks.

## Sidebar & Navigation
- **Sidebar always visible**: Keep sidebar visible at all times for admin users
- **Admin routes structure**: All admin routes start with client_id, e.g. `http://localhost:3000/public/units` where `public` is the client_id for the currently logged in user

## Constraints
Server components fetch data · Client components handle interactions only · Prefer local state; React Query for server state
No new patterns, dependencies, or layout changes without a clear need — stability over experimentation

yes please use (translate('…')). everywhere.   for lcoalzaiton


- Think before you write code. Define the assumptions, ask questions if anything is unclear, and don't guess.

- Write the minimum code that solves the problem, without any unnecessary complexityor abstractions.

- Only modify what needs modifying. Don't touch any code that isn't relevant to the requirements. Every modification must have a clear reason in the specifications.
-  wiret production ready code and dont use fake/dump solutions to skip issue,  better to look for issues root cause .
- Before you begin, define the goal.%    