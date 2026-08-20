# Cleanup verification notes

## Task 2.2 — Admin cross-import check (2026-08-20)

```bash
grep -rn "from ['\"]@/app/(admin)\|from ['\"]@/app/allProberties\|from ['\"]@/components/dashbord" \
  src/app/(lenaqar) src/components/lenaqar src/lib/lenaqar src/lib/units src/components/schema
```

**Result:** empty — no offenders in the keep-set.

## Task 2.1 deviation

Admin files `LeadDetailPane.jsx` and `ScheduleUserDetailsDialog.jsx` still referenced the moved dialog. Updated imports to `@/components/lenaqar/buy-request-dialog` so the build stays green until Batch 3.1 removes admin.

## Batch 3.1 deviations

- `src/app/projects`, `src/app/units`, `src/components/projects` did not exist — skipped.
- Removed CRM WhatsApp bulk dialog usage from `units-filter.jsx` and `resale_page_query.jsx` so `allProberties` (deleted in 3.4) still builds.
- Deleted `mobile-sticky-action-bar.tsx` and `unit-details-page.tsx` (admin-only, broke tsc after admin removal).

## Phases 5–9 (2026-08-20)

- **Branch:** `cleanup/lenaai-removal` (12 commits ahead of `webstiecleaning` at completion)
- Buy-request dialog slimmed to public field set; catalog projects via `/api/lenaqar/catalog-projects`
- Removed `src/utils/api.js`, auth/token helpers, CRM dashboard hooks
- i18n now loads `public/locales/public-ar.js` / `public-en.js` (~18 KB vs 181 KB `ar.js`)
- Dropped 251 npm packages (exceljs, recharts, leaflet, swiper, etc.)
- `npm run build` passes; lenaqar payload tests 30/30 pass
- `lint:seo`: 6 errors remain on legacy redirect pages (`properties/`, `property/`, `unit/`) — pre-existing
