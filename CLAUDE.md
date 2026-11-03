# CLAUDE.md — LenaQar Public Marketplace (Next.js)

ROLE: Act as Senior Next.js and Senior UX engineer.

## Stack & Theme
Next.js App Router · TypeScript · Tailwind · React Query · Axios (`src/utils/axiosInstance` server-side, `src/lib/axiosInstance` client-side BFF — being slimmed)
Primary color `#030250` — defined once in `globals.css`, never hardcoded elsewhere.

## Architecture
This repo is the **public LenaQar marketplace only** — no CRM, no login, no admin sidebar.
CRM (units, leads, teams, campaigns) lives on **lenaai.net** (separate repository).

### Public routes
```
/                      home
/opportunities         listing feed
/opportunities/[slug]  detail
/sell                  list-your-unit flow
/calculator            exit calculator
/how-it-works          three flows explained
/privacy
/properties/[id]       legacy SEO redirect
/property/[id]         legacy SEO redirect
/unit/[slug]           legacy SEO redirect
```

### API routes (server-only, anonymous)
```
/api/lenaqar/catalog-projects/
/api/lenaqar/project-names/
/api/locations/catalog/
```

### Server actions
`src/app/(lenaqar)/_actions/add-sale.js`, `buy-request.js` — anonymous, rate-limited, post to `/public/v1/*`.

### Key directories
`src/app/(lenaqar)/**` · `src/components/lenaqar/**` · `src/lib/lenaqar/**` · `src/lib/units/**` · `src/lib/locations/**` · `src/context/translate-api.js` · `public/locales/lenaqar-ar.js`

## Component Rules
**Reuse first**: `UnifiedDialog`, `ImageWithLoader`, `LoadingSpinner`, `LenaTextField`, `LenaTextArea`, `SearchableDropdown`, `PhoneField`
New components must match existing spacing, styling, and patterns exactly.

## UX (Non-Negotiable)
Primary action → **top-right** · Cancel/Back → top-left
Forms: labels above fields, inline validation · No raw API errors — unified messages only
Mobile-first · Full RTL (`ar-EG`, `dir=rtl`) · No hardcoded `left`/`right` — use logical properties

## Public navigation (header)
الرئيسية · الفرص العقارية · بيع وحدتك · اشتري وحدة (dialog) · كيف نعمل
`/calculator` is footer + inline links only.

## Localization
Every user-visible string uses `translate('lenaqar.…')`. Arabic source of truth in `public/locales/lenaqar-ar.js`.

## Constraints
Server components fetch data · Client components handle interactions · Prefer local state; React Query for sell-form catalogs and buy-request dialog
No new patterns or dependencies without clear need — stability over experimentation

## Plan progress (non-negotiable)
`feature-progress.json` is the durable plan + progress file for the SEO/GEO visibility program. Keep the original phase plan and update item statuses there at the end of every task/session so direction and progress are never lost to chat. Do not start Phase 2+ without the gate recorded in that file.

## Cleanup tooling
`scripts/orphan-scan.mjs` + `scripts/entrypoints.txt` — only approved way to verify orphaned files.

## Verified takeover context
Read `WEBSITE_ARCHITECTURE.md` and the 2026-11-03 section in `docs/buyer-first-implementation-log.md` before using older plans. `feature-progress.json` remains the canonical phase tracker; verify claims against Git/CI/Vercel evidence. Phase 3 and newly proposed remediation require explicit owner approval. Preserve all stashes and unrelated work. Never infer verified prices from `updatedAt` or the current date.

## Active SEO continuation
For the approved 2026-11-03 P0/P1 continuation, read `SEO-PLAN.md` and `seo-feature-req.json`; task states are authoritative in `seo-feature-progress.json`. Keep `feature-progress.json` as the phase/release history, not a duplicate task list. Latest user approval supersedes prior stop gates for this scoped work. Planning-only turns do not imply implementation or deployment. The lead alone reconciles trackers during parallel execution.
