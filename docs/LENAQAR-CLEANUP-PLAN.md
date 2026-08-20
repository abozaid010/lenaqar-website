# LenaQar Cleanup Plan — Executable Task Book

**Audience:** an LLM agent executing one task at a time. Every task is mechanical, bounded, and has a verification gate.

**What LenaQar is:** a **public, read-mostly real-estate marketplace for end users**. Find a deal · sell your unit · tell us what you want to buy.

**What LenaQar is NOT:** a CRM. Units, leads, approvals, and teams are operated on **lenaai.net, which is a different repository**. This repo therefore keeps **no admin UI and no login**.

**Non-goal:** refactoring for taste, renaming, or adding features — with exactly one sanctioned addition: the new `/how-it-works` route in Phase 4.

---

## 0. Ground truth (already audited — do not re-derive)

Repo: `/Users/abozaid/workspace/lenaqar` · Next.js 16 App Router · JS/TS mix · Tailwind 4 · React Query · Axios.

| Fact | Value |
|---|---|
| Total source files (`src/**/*.{js,jsx,ts,tsx}`) | **733** |
| Files reachable from the public site under the final scope | **182** |
| **Files to remove** | **~551 (75%)** |
| Middleware | `src/proxy.js` (Next 16 name for middleware) |
| Backend | `https://api.lenaai.net`. Public flows use anonymous `/public/v1/*` endpoints authenticated by `X_API_KEY` server-side. **Backend is out of scope — never change it, never assume an endpoint is dead.** |
| Public Arabic dictionary shipped to every page | `public/locales/ar.js` — **181 KB**, of which the LenaQar part (`lenaqar-ar.js`) is only **18 KB** |

### The public surface — this is the product

```
/                      src/app/(lenaqar)/page.jsx                home
/opportunities         src/app/(lenaqar)/opportunities/          listing feed
/opportunities/[slug]  src/app/(lenaqar)/opportunities/[slug]/   detail
/sell                  src/app/(lenaqar)/sell/                   list-your-unit flow
/calculator            src/app/(lenaqar)/calculator/             exit calculator
/privacy               src/app/(lenaqar)/privacy/
/how-it-works          NEW — Phase 4
/properties/[id]       legacy → redirect (SEO)
/property/[id]         legacy → redirect (SEO)
/unit/[slug]           legacy → redirect (SEO)
/sitemap.xml /robots.txt
```

**Surviving API routes — only these three:**
```
src/app/api/lenaqar/catalog-projects/   used by the sell form
src/app/api/lenaqar/project-names/      used by the sell form
src/app/api/locations/catalog/          used by the sell form's location search
```
Every other route under `src/app/api/` goes (see Batch 3.3).

**Server actions kept:** `src/app/(lenaqar)/_actions/add-sale.js`, `src/app/(lenaqar)/_actions/buy-request.js`. Both are anonymous + rate-limited and post to `/public/v1/*`. Do not touch their contracts.

Supporting code that is **KEEP** regardless of what else is deleted:
`src/app/(lenaqar)/**` · `src/components/lenaqar/**` · `src/lib/lenaqar/**` · `src/lib/units/**` ·
`src/lib/locations/**` · `src/components/schema/**` · `src/config/site.js` · `src/context/translate-api.js` ·
`src/lib/i18n/**` · `src/lib/rateLimit.js` · `src/lib/bffFetch.js` · `src/lib/apiConfig.js` ·
`src/utils/axiosInstance.js` · `src/lib/axiosInstance.js` · `src/constants/analytics.js` ·
`src/components/analytics/**` · `src/components/phone/**`

Plus this precise set of shared UI (everything else in `src/components/ui/` goes):
```
src/components/ui/UnifiedDialog.jsx
src/components/ui/UnifiedHeader.jsx
src/components/ui/action-button-arrow.jsx
src/components/ui/action-button-class.js
src/components/ui/image-with-loader.jsx
src/components/ui/loading-spinner.jsx
src/components/ui/inputs/lena-text-field.jsx
src/components/ui/inputs/lena-textarea.jsx
src/components/ui/inputs/searchable-dropdown-select.jsx
src/components/ui/inputs/searchable-project-select.jsx
src/components/ui/inputs/units-location-search.jsx
src/components/ui/unit-forms/unit-location-search.jsx
src/components/unit-details/unit-details-skeleton.tsx
```

### The ONE cross-boundary coupling (fix before deleting anything)

`src/components/lenaqar/buy-request-cta.jsx` (166 lines, public buy flow) imports
`@/app/(admin)/dashboard/_components/split-view/EditRequirementDialog` (**1104 lines** of CRM dialog).
Handled in Task 2.1. Nothing else in the keep-set reaches into `(admin)`.

### Two files that must outlive their own directories

- `src/lib/match/requirement-to-units-filter.js` — used by the public site; the rest of `src/lib/match/` goes
- `src/lib/matching/pricing-range.js` — used by the public site; the rest of `src/lib/matching/` goes

### Confirmed by inspection — do not re-litigate

- **The public sell flow uploads no images.** `src/lib/lenaqar/sale-unit-payload.js` sends `images: []`. `/api/upload` requires an access token (401 without) and is only called from `src/utils/api.js:1327`, an admin helper. So `/api/upload`, `src/lib/imageProcessor.js`, `src/utils/processImage.ts` and `browser-image-compression` are all removable.
- **A "how we work" section already exists on the home page** — `lenaqar.home.howTitle` + `howStep1…4` in `public/locales/lenaqar-ar.js`, rendered in `src/components/lenaqar/home-content.jsx`. It is **seller-only**. Phase 4 extracts and expands it; it does not invent copy from nothing.
- **`NEXT_PUBLIC_NEW_UNIT_DESIGN` does not exist in the code.** It is mentioned only in `CLAUDE.md`. That line is stale.

---

## 1. Rules of engagement (read before every task)

1. **Never delete by filename or by guessing.** Run the reference check in §2 first. If anything still imports it, do not delete.
2. **One task per commit.** Never batch two phases into one commit.
3. **After every task, run the gate (§3).** If the gate fails, fix or revert *that task only*. Never proceed on a red build.
4. **Do not touch the backend, database, or any `/public/v1/*` contract.** Deleting a Next.js API route is allowed only when nothing in `src/` calls it.
5. **Do not add features, dependencies, or abstractions.** The only new code in this plan is Phase 4.
6. **Localization:** every user-visible string uses `translate('…')`. Never hardcode. Never delete a locale key a kept page still reads.
7. **RTL:** the public site is Arabic-first (`ar-EG`, `dir=rtl`). Never introduce hardcoded `left`/`right` — use logical properties.
8. **Colors:** primary `#030250` lives in `globals.css` only.
9. If a task's premise turns out to be wrong (file already gone, extra importer found), **record it in §10 and skip the task** — do not improvise a bigger change.
10. Work on a branch off `webstiecleaning`. Do not push or open a PR unless explicitly asked.

---

## 2. Tooling — create this first (Task 0.1)

Create `scripts/orphan-scan.mjs` with exactly this content. It computes the transitive import closure from a set of entry points and lists every `src/` file *not* reachable. This is the only approved way to decide "is this orphaned?".

```js
#!/usr/bin/env node
// Usage: node scripts/orphan-scan.mjs <entry> [<entry>...]
// Entries may be files or directories. Prints reachable files to stdout,
// and the unreachable src/ remainder to stderr under "ORPHANS".
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');
const exts = ['.ts', '.tsx', '.js', '.jsx', '.mjs'];

function resolve(spec, fromFile) {
  let base;
  if (spec.startsWith('@/')) base = path.join(SRC, spec.slice(2));
  else if (spec.startsWith('.')) base = path.resolve(path.dirname(fromFile), spec);
  else return null;
  for (const e of exts) { const p = base + e; if (fs.existsSync(p) && fs.statSync(p).isFile()) return p; }
  for (const e of exts) { const p = path.join(base, 'index' + e); if (fs.existsSync(p)) return p; }
  if (fs.existsSync(base) && fs.statSync(base).isFile()) return base;
  return null;
}

const importRe = /(?:from\s+|import\s+|require\(\s*|import\(\s*)['"]([^'"]+)['"]/g;

function walk(dir, out = []) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p, out);
    else if (exts.includes(path.extname(p))) out.push(path.resolve(p));
  }
  return out;
}

const queue = [];
for (const e of process.argv.slice(2)) {
  if (!fs.existsSync(e)) { console.error('MISSING ENTRY:', e); continue; }
  if (fs.statSync(e).isDirectory()) queue.push(...walk(e));
  else queue.push(path.resolve(e));
}

const seen = new Set();
while (queue.length) {
  const f = queue.pop();
  if (seen.has(f)) continue;
  seen.add(f);
  let src;
  try { src = fs.readFileSync(f, 'utf8'); } catch { continue; }
  importRe.lastIndex = 0;
  let m;
  while ((m = importRe.exec(src))) {
    const r = resolve(m[1], f);
    if (r && !seen.has(r)) queue.push(r);
  }
}

const reachable = new Set([...seen].map((p) => path.relative(ROOT, p)));
console.log([...reachable].sort().join('\n'));

const all = walk(SRC).map((p) => path.relative(ROOT, p)).sort();
const orphans = all.filter((p) => !reachable.has(p));
console.error(`\nREACHABLE: ${reachable.size}\nORPHANS (${orphans.length}):\n` + orphans.join('\n'));
```

**Canonical entry-point set.** Save as `scripts/entrypoints.txt`, one per line. This is the *final* set — until Phase 3 is done, temporarily append the paths you have not deleted yet.

```
src/app/layout.jsx
src/app/error.js
src/app/loading.jsx
src/app/not-found.jsx
src/app/sitemap.ts
src/app/robots.ts
src/proxy.js
src/app/(lenaqar)
src/app/properties
src/app/property
src/app/unit
src/app/api/lenaqar
src/app/api/locations
```

Run:

```bash
node scripts/orphan-scan.mjs $(tr '\n' ' ' < scripts/entrypoints.txt) > /tmp/reachable.txt 2> /tmp/orphans.txt; tail -80 /tmp/orphans.txt
```

**Reference check for a single file** (run before every individual deletion):

```bash
node scripts/orphan-scan.mjs $(tr '\n' ' ' < scripts/entrypoints.txt) 2>/dev/null | grep -F "PATH/TO/FILE"
```
Empty output = unreachable = safe to delete. Non-empty = **do not delete**.

**Text reference check** (catches dynamic strings the closure misses — route names, `next/dynamic`, hrefs):

```bash
grep -rn "TOKEN" src public scripts docs next.config.mjs package.json --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" --include="*.mjs" --include="*.json" --include="*.md"
```

**Commit Task 0.1 as:** `chore(cleanup): add orphan-scan tooling`

---

## 3. The gate — run after EVERY task

```bash
npx tsc --noEmit
```
```bash
npm run lint
```
```bash
npm run build
```
```bash
npm run lint:seo
```
```bash
node --test src/lib/lenaqar/__tests__/ && node --test src/utils/__tests__/sale-pricing-validation.test.js
```

Plus the dead-reference sweep for whatever you just removed:

```bash
grep -rn "REMOVED_TOKEN" src public next.config.mjs --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" --include="*.mjs"
```

**Green means:** tsc clean, lint clean, build succeeds, `lint:seo` no new errors vs baseline, tests pass, sweep returns nothing (or only intentional redirect entries).

---

## Phase 0 — Baseline (Task 0.2)

1. `git status` must be clean. `git checkout -b cleanup/lenaai-removal`.
2. Run every gate command in §3; save raw output to `docs/cleanup/baseline.txt`.
3. Copy the `next build` route table and First Load JS numbers into `docs/cleanup/baseline.txt` verbatim.
4. Record `du -sh .next/static` and `find src -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" \) | wc -l`.
5. Any gate command that already fails on a clean tree goes under "PRE-EXISTING FAILURES". Those are not yours to fix.

**Commit:** `chore(cleanup): record pre-cleanup baseline`
**Do not proceed until `baseline.txt` exists.**

---

## Phase 1 — Verdict table (reference, not a task)

### REMOVE — the entire CRM. It lives on lenaai.net (different repo).

| Area | Paths |
|---|---|
| **All admin UI** | `src/app/(admin)/` — every segment: `dashboard`, `units`, `team`, `campaigns`, `campaign-chat`, `schedule`, `analytics`, `news`, `notifications`, `social-media`, `market-index`, `locations`, `tools`, `matching`, `map`, `myProjects`, `developers`, `clients`, `[email]` |
| **Auth** | `src/app/(auth)/`, `src/app/api/auth/`, `src/app/api/refresh-token/`, `src/lib/TokenRefreshService.js`, `src/lib/TokenExpirationManager.js`, `src/lib/refreshTokenInflight.js`, `src/lib/jwtCookieUtils.js`, `src/lib/getRoleFromToken*.js`, `src/lib/kingAdmin*.js`, `src/components/auth/`, `src/hooks/useTokenRefresh.js` |
| **Permissions** | `src/lib/module-actions.js`, `src/lib/default-module-actions.js`, `src/lib/permission-schema.js`, `src/lib/team-module-actions.js`, `src/lib/resale-author-access.js`, `src/lib/dashboard-lead-access.js`, `src/constants/permissionsAuth.js`, `src/context/module-actions-context.jsx`, `src/hooks/useModuleActions.js`, `src/hooks/useModuleAccess.js`, `src/hooks/useBrokerPermission.js`, `src/components/actions/`, `src/services/actionCatalogService.ts` |
| **WhatsApp CRM stack** | `src/components/whatsapp/`, `src/lib/whatsapp-*.js`, `src/app/api/openwa/`, `src/app/api/client/whatsapp-instance/`, `src/hooks/useOpenwa*.js`, `src/hooks/useSendWhatsappMessage.ts` — **keep `src/lib/lenaqar/whatsapp.js`**, which builds the public CTA deep links |
| **Social media** | `src/app/(admin)/social-media/`, `src/components/social-media/`, `src/hooks/social-media/`, `src/lib/social-media/`, `src/lib/socialMediaApiConfig.ts`, `src/services/socialMedia.ts`, `src/types/socialMedia.ts`, `src/app/api/social-media/`, `src/app/api/bff/social-media/` |
| **Match sharing** | `src/app/match/`, `src/app/api/match/`, most of `src/lib/match/` and `src/lib/matching/` |
| **Legacy public listing** | `src/app/allProberties/` — LENAAI-branded, already `Disallow`ed, superseded by `/opportunities` |
| **Tenant/CRM API** | `src/app/api/crm/`, `src/app/api/client/`, `src/app/api/upload/` |
| **Empty leftovers** | `src/app/projects/`, `src/app/units/`, `src/components/projects/` |
| **Sidebar/CRM chrome** | `src/components/dashbord/` |

### KEEP

Everything listed in §0 under "The public surface", "Surviving API routes", "Supporting code", and the shared-UI list.

---

## Phase 2 — Decouple (do FIRST)

### Task 2.1 — Free the public buy-request CTA from the CRM dialog

`src/components/lenaqar/buy-request-cta.jsx` imports a 1104-line CRM dialog out of `(admin)`.

1. `git mv "src/app/(admin)/dashboard/_components/split-view/EditRequirementDialog.jsx" src/components/lenaqar/buy-request-dialog.jsx`
2. Update the import in `src/components/lenaqar/buy-request-cta.jsx` to `./buy-request-dialog`.
3. Delete the *other* referencing files' imports — they are all inside `(admin)` and will be deleted in Phase 3, so no fix is needed there.
4. Re-resolve every relative import inside the moved file to `@/…` form (it moved several directories).
5. Gate (§3). Manually confirm the buy-request dialog still opens and submits.
6. **Do not slim the dialog in this task** — that is Task 6.1. Moving and trimming in one commit makes the diff unreviewable.

**Commit:** `refactor(cleanup): move buy-request dialog into the public component tree`

### Task 2.2 — Confirm nothing else escapes the keep-set

```bash
grep -rn "from ['\"]@/app/(admin)\|from ['\"]@/app/allProberties\|from ['\"]@/components/dashbord" src/app/\(lenaqar\) src/components/lenaqar src/lib/lenaqar src/lib/units src/components/schema
```
Expected: **empty**. If not, move each offender the same way as Task 2.1 and record it in §10.

**No commit if empty** — just record the result in `docs/cleanup/verify-notes.md`.

---

## Phase 3 — Removal

Each batch is one task = one commit. **Procedure for every batch:**

```
A. Run the §2 reference check on each path. Anything still reachable → skip it, record in §10.
B. git rm -r the confirmed-unreachable paths.
C. Update the reference lists in the batch's "References to update".
D. Run the dead-reference sweep for each removed token.
E. Gate (§3).
F. Re-run orphan-scan; delete newly-orphaned files this batch caused (verify each first).
   Repeat until the orphan list stops shrinking.
G. Commit.
```

### Batch 3.1 — Delete the admin application

**Delete:** `src/app/(admin)/` (entire directory), `src/components/dashbord/`, `src/app/projects/`, `src/app/units/`, `src/components/projects/`

**References to update:**
- `next.config.mjs` → delete the whole `rewrites()` block (`adminPaths`, `clientIdSegment`, `adminRewrites`). With no admin, `/{clientId}/…` routing has no purpose. Keep `headers()` and `images`.
- `src/proxy.js` → delete `adminPaths`, `isPublicShareableUnitDetail`, `nextWithPathname`, the `/admin/*` redirect, the bare-`/{adminPath}` redirect, and the whole auth/refresh block. **Keep** the `/lenaqar` → `/` 308 redirect, the image MIME/cache handling, and the CORS block.
- `src/app/robots.ts` → `ADMIN_PATHS` stays in `Disallow` **for one release** so crawlers stop requesting the dead URLs; add a comment with a removal date. Remove those paths from any `Allow`.

**Tokens for sweep:** `(admin)`, `adminPaths`, `clientId`, `x-lena-pathname`

**Gate additions:** confirm `/`, `/opportunities`, `/sell`, `/calculator`, `/privacy` all still render, and that `/homey/units` now 404s cleanly (not 500).

**Commit:** `chore(cleanup): remove the LenaAI admin application`

### Batch 3.2 — Delete auth, permissions and the CRM WhatsApp stack

**Delete:** every path in the "Auth", "Permissions", and "WhatsApp CRM stack" rows of the Phase 1 table.

**KEEP explicitly:** `src/lib/lenaqar/whatsapp.js`, `src/components/lenaqar/whatsapp-cta.jsx`, `src/components/lenaqar/sticky-whatsapp-bar.jsx`, `src/constants/whatsapp-messaging.js` *(verify this last one — delete if unreachable)*.

**References to update:** `src/lib/LenaCookiesManager.js` and `src/constants/cookieKeys.js` — reduce to what the public site still uses (the `lang` cookie read by `src/context/translate-api.js` and `src/app/layout.jsx`). Verify with the §2 check before deleting either file outright.

**Ordering caveat — read before running step A.** A few auth files are still *transitively reachable* at this point, not because a page uses them but because the axios interceptors in `src/utils/axiosInstance.js` / `src/lib/axiosInstance.js` and the 2964-line `src/utils/api.js` pull them in:
`src/lib/TokenRefreshService.js`, `src/lib/fetchClientProfile.server.js`, `src/lib/getCachedClientProfile.server.js`, `src/lib/getRoleFromToken*.js`, `src/lib/jwtCookieUtils.js`, `src/lib/dashboard-lead-access.js`, `src/lib/resale-author-access.js`, `src/lib/whatsapp-bulk-access.js`.
Step A will correctly report them as reachable. **Skip them here** — they fall out in Task 6.2 when `api.js` is slimmed and the interceptors lose their refresh path. Do not force-delete them now; that breaks the build.

**Tokens:** `COOKIE_KEYS`, `refreshToken`, `accessToken`, `useModuleActions`, `openwa`

**Commit:** `chore(cleanup): remove authentication, permissions and CRM WhatsApp stack`

### Batch 3.3 — Delete non-public API routes

**Delete:** `src/app/api/auth/`, `src/app/api/refresh-token/`, `src/app/api/bff/`, `src/app/api/client/`, `src/app/api/crm/`, `src/app/api/match/`, `src/app/api/openwa/`, `src/app/api/social-media/`, `src/app/api/upload/`

**Survivors — exactly three:** `api/lenaqar/catalog-projects/`, `api/lenaqar/project-names/`, `api/locations/catalog/`. Verify each is still reachable *after* the deletions.

**Also delete:** `src/lib/imageProcessor.js`, `src/utils/processImage.ts` (upload-only — confirmed, see §0).

**Tokens:** `api/upload`, `api/crm`, `api/match`, `api/openwa`, `bffFetch` *(keep `bffFetch` if a surviving route uses it — check)*

**Commit:** `chore(cleanup): remove non-public API routes`

### Batch 3.4 — Delete remaining LenaAI modules and legacy public pages

**Delete:** `src/app/allProberties/`, `src/app/match/`, `src/components/social-media/`, `src/components/project-details/`, `src/components/chat/`, `src/components/notifications/`, `src/components/services/`, `src/lib/market-index/`, `src/lib/projects/`, `src/lib/developers/`, `src/lib/tools/`, `src/lib/social-media/`, and all of `src/lib/match/` and `src/lib/matching/` **except** `requirement-to-units-filter.js` and `pricing-range.js`.

**SEO — mandatory, same commit.** Add to `next.config.mjs` a `redirects()` block *before* deleting:
```
/allProberties        → /opportunities        308
/allProberties/:code  → /opportunities/:code  308
```
Then drop `/allProberties` from `PRIVATE_PATHS` in `src/app/robots.ts`.

**Tokens:** `allProberties`, `match/share`, `market-index`

**Commit:** `chore(cleanup): retire legacy listing pages and remaining LenaAI modules`

### Batch 3.5 — Iterative orphan sweep

Re-run orphan-scan against the **final** `scripts/entrypoints.txt`. Expect a long list across `src/components/ui/`, `src/hooks/`, `src/utils/`, `src/lib/`, `src/constants/`, `src/context/`, `src/types/`, and the `__tests__` directories.

Delete in passes; verify each file with the §2 check; gate after each pass; repeat until the orphan list is empty or contains only files you can justify in writing.

**Expected end state:** `src/components/ui/` reduced from 111 files to the 12 listed in §0.

**Also update `package.json`:** remove `test:*` scripts whose test files no longer exist.

**Commit:** `chore(cleanup): remove code orphaned by the CRM removal`

---

## Phase 4 — Build `/how-it-works` (the one sanctioned addition)

**Why it exists:** the public nav needs a page that answers *what happens after I click*, for all three flows. Today only a seller-focused 4-step block exists, buried on the home page.

### Task 4.1 — Extract the existing steps into a reusable component

1. Create `src/components/lenaqar/how-it-works-steps.jsx` (client component, matching the style of the sibling `*-block.jsx` files).
2. Move the existing `<section>` from `src/components/lenaqar/home-content.jsx` — the one rendering `lenaqar.home.howTitle` and the `howStep1…4` grid — into it **verbatim**, keeping the same locale keys and the same `howStep4TitleBefore` / `howStep4TitleHighlight` split.
3. Give it a `variant` prop: `"compact"` (home — current 4-card grid) and `"full"` (the new page — same steps, vertical, room for the per-flow detail added in 4.2).
4. Render `<HowItWorksSteps variant="compact" />` from `home-content.jsx`. The home page must look **identical** after this task.
5. Gate (§3) + visual diff of `/` against the baseline screenshot.

**Commit:** `refactor(lenaqar): extract how-it-works steps into a shared component`

### Task 4.2 — The page

Create `src/app/(lenaqar)/how-it-works/page.jsx` (server component) + `how-it-works-content.jsx` (client, only if interactivity is needed — prefer none).

**Content — three sections, in this order.** Each reuses the existing copy where it exists; new copy goes in the locale files, never inline.

| Section | Source of truth |
|---|---|
| 1. **بيع وحدتك** (sell) | `<HowItWorksSteps variant="full" />` — the existing 4 steps, which are already the seller flow. Ends with a link to `/sell`. |
| 2. **اشتري فرصة** (buy an opportunity) | New copy. 3 steps: browse `/opportunities` → check the deal with `/calculator` → contact on WhatsApp. Ends with a link to `/opportunities`. |
| 3. **قول لنا عايز إيه** (buy request) | New copy. 3 steps: describe your requirement → we shortlist matching opportunities → we contact you. Ends with the existing `BuyRequestCta` component. |

**Requirements — all mandatory:**
- Every string via `translate('lenaqar.howItWorks.…')`. Add the keys to **both** `public/locales/lenaqar-ar.js` and `public/locales/lenaqar-en.js`. Arabic is the source of truth; match the existing voice (second person, colloquial Egyptian, short sentences).
- Reuse only existing components: `CoreActions`, `WhatsAppCta`, `BuyRequestCta`, `PublicSellCta`, `BreadcrumbSchema`. Do not build new primitives.
- RTL-safe: logical properties only.
- Mobile-first. One primary CTA per section — no CTA stacking.
- **No new dependency, no new provider, no client-side data fetching.** The page is static.

**SEO — mandatory, same commit:**
- `export const metadata` with an Arabic title/description, `alternates.canonical = ${SITE_URL}/how-it-works`, and OpenGraph mirroring `src/app/(lenaqar)/sell/page.jsx`.
- Add to `staticPages` in `src/app/sitemap.ts`: `${SITE_URL}/how-it-works`, `changeFrequency: 'monthly'`, `priority: 0.7`.
- Add `/how-it-works` to the `allow` array in `src/app/robots.ts`.
- Add `<BreadcrumbSchema />` (Home → كيف نعمل).
- Add **one** `FAQPage` JSON-LD block covering the 3–5 questions the page answers. Put it in a new `src/components/schema/FaqSchema.jsx` following the exact shape of the existing schema components. One JSON-LD block only — do not also add `HowTo`.
- `npm run lint:seo` must pass with the new page included.

**Commit:** `feat(lenaqar): add how-it-works page`

### Task 4.3 — Wire it into navigation

Add to the header nav in `src/components/lenaqar/lenaqar-header.jsx` (desktop + mobile menu) and to the footer, using `translate("lenaqar.header.howItWorks")`.

**Commit:** `feat(lenaqar): link how-it-works from header and footer`

---

## Phase 5 — Navigation & UX

### Task 5.1 — Public navigation is the only navigation

File: `src/components/lenaqar/lenaqar-header.jsx`, `lenaqar-footer.jsx`, `sticky-whatsapp-bar.jsx`.

Final nav — exactly these five, in this order, all via `translate('…')`:
```
الرئيسية        /
الفرص العقارية  /opportunities
بيع وحدتك       /sell
اشتري وحدة      → buy-request dialog (not a route)
كيف نعمل        /how-it-works
```
`/calculator` moves to a secondary position (footer + inline links from the opportunity detail page) — it is a tool, not a destination.

Rules:
- One primary CTA in the header. Sticky bar: at most two actions.
- Every footer link must resolve. Remove every link to a Phase 3 casualty, including any "login" or "dashboard" entry.
- Verify: `grep -ohn 'href="/[^"#?]*"' src/components/lenaqar/*.jsx | sort -u` — check each against the build's route table.

**Commit:** `feat(ux): finalize public navigation`

### Task 5.2 — Strip CRM residue from the public shell

- `src/app/layout.jsx`: remove any provider that only served the admin. **Keep** `I18nProvider`, `TanStackQueryProvider` (verified in use — the sell form's location search and the buy-request dialog both use React Query), `Toaster`, the schema components, GA and Meta Pixel.
- Remove the `lang=en` switcher from public chrome if `LenaqarLocale` already forces `ar` — it is dead UI.
- Sweep kept screens for buttons whose handler targeted a deleted feature, and for empty states naming removed modules.
- Primary action top-right, cancel/back top-left, delete keeps its confirmation dialog.

**Commit:** `fix(ux): remove CRM residue from the public shell`

---

## Phase 6 — Shrink what survives

Removal is done; these are the measurable wins left.

### Task 6.1 — Slim `buy-request-dialog.jsx` (1104 lines)

It was a CRM lead-requirement editor. The public buy request needs only the fields `src/lib/lenaqar/buy-request-payload.js` actually sends.

1. Read `buildPublicBuyRequirement` in `src/lib/lenaqar/buy-request-payload.js`. That function's inputs are the **complete** field list.
2. Delete every field, tab, permission gate, assignment control, and CRM-only branch not in that list.
3. `src/lib/lenaqar/__tests__/buy-request-payload.test.js` must still pass unchanged — the payload contract does not move.
4. Manually submit a buy request end-to-end before committing.

**Commit:** `refactor(lenaqar): reduce buy-request dialog to the public field set`

### Task 6.2 — Slim `src/utils/api.js` (2964 lines)

Only five kept files import it. Find which exports they use:
```bash
grep -rn "from ['\"]@/utils/api" src
```
Delete every other export. Re-run the gate after each block of deletions — this file is large and `lint` will catch dangling helpers.

**Commit:** `refactor(cleanup): reduce shared API layer to public-site surface`

### Task 6.3 — Locale dictionaries (largest client-side win)

`src/context/translate-api.js` synchronously imports `public/locales/ar.js` (**181 KB**) into every page. Only the ~18 KB `lenaqar-ar.js` slice is needed now.

1. `public/locales/ar.js` currently does `import lenaqar from "./lenaqar-ar.js"` and merges it. After Phase 3, **invert this**: make `lenaqar-ar.js` / `lenaqar-en.js` the whole dictionary and delete the CRM namespaces from `ar.js`/`en.js`, or point `translate-api.js` and `src/lib/i18n/load-locale-messages.js` directly at the lenaqar files.
2. Verify a namespace is dead before deleting: `grep -rn "translate(\"lenaqar\?\.\?NAMESPACE" src`.
3. Measure: `npm run build`, compare First Load JS on `/` against `docs/cleanup/baseline.txt`. Record the delta.

**Commit:** `perf(i18n): ship only the public dictionary`

---

## Phase 7 — Dependencies, env, config, assets

### Task 7.1 — Dependencies

Owners verified by grep at audit time. Under the pure-public scope, **most of these lose their only consumer.**

| Package | Only consumer(s) | Verdict |
|---|---|---|
| `follow-redirects` | none (0 refs) | **REMOVE now** |
| `exceljs`, `fuse.js`, `@tanstack/react-virtual` | Excel import/export in the CRM | **REMOVE** |
| `recharts` | `(admin)/analytics` | **REMOVE** |
| `leaflet`, `react-leaflet` | `(admin)/map` | **REMOVE** |
| `react-markdown`, `remark-gfm` | dashboard AI chat transcript | **REMOVE** |
| `framer-motion` | dashboard `LeadsListPane` | **REMOVE** |
| `browser-image-compression` | `utils/processImage.ts` (upload only) | **REMOVE** — public sell sends `images: []` |
| `date-fns` | none in the keep-set | **REMOVE** |
| `swiper` | only the CSS import in `src/app/globals.css` — no kept component uses it | **REMOVE**, and delete the swiper CSS import from `globals.css` |
| `uuid` | only `src/utils/api.js` | **REMOVE** after Task 6.2 slims that file |
| `@tanstack/react-query` | `providers/query-client-provider.jsx`, `utils/query-utils.js`, `hooks/use-admin-shared-data.js`, `ui/unit-forms/unit-location-search.jsx` (sell form), the buy-request dialog | **KEEP** |
| `js-cookie` | `lib/CookieConfig.js`, `lib/LenaCookiesManager.js` (the `lang` cookie) | **KEEP** |
| `libphonenumber-js`, `react-phone-number-input` | public phone input | **KEEP** |
| `axios`, `lucide-react`, `react-hot-toast`, `sharp`, `next`, `react` | core | **KEEP** |

Procedure per package: `grep -rn "from ['\"]PKG" src` → zero hits → `npm uninstall PKG`. Gate after each group. **Never remove a package with any remaining hit.**

**Commit:** `chore(deps): drop dependencies orphaned by the CRM removal`

### Task 7.2 — Environment variables

| Var | Verdict |
|---|---|
| `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_LENAQAR_TENANT_ID`, `NEXT_PUBLIC_LENAQAR_FEED_ENABLED` | KEEP |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_META_PIXEL_ID` | KEEP |
| `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_IMAGE_BASE_URL`, `API_BASE_URL`, `X_API_KEY` | KEEP |
| `BFF_SECRET` | KEEP only if a surviving API route signs with it — verify |
| `MATCH_SHARE_SECRET` | **REMOVE** (Batch 3.4) |
| `OPENWA_SESSION_API_KEY` | **REMOVE** (Batch 3.2) |

Edit **only** `.env.example` and docs. **Do not edit `.env` or `.env.local`.** List the vars to remove from the hosting platform in the final report.

Also review `Dockerfile`, `.deploy/`, `.github/` for build args referencing removed vars.

**Commit:** `chore(config): drop env vars for removed modules`

### Task 7.3 — Assets, docs, stale instructions

- `public/images/` is **12 MB**. `find public/images -type f`, grep each basename across `src` and `public/locales`. Delete only zero-hit files. Be conservative: OG/social images may be referenced only inside metadata strings.
- Delete `public/tools/` (80 KB, CRM tools only).
- **Update `CLAUDE.md`** — it currently describes the CRM architecture that no longer exists: the `(admin)/` group, `useModuleActions`/`useBrokerPermission`, the sidebar rules, the `client_id` route prefix, and `NEXT_PUBLIC_NEW_UNIT_DESIGN` (which never existed in code). Rewrite it to describe the public marketplace. **This is required** — a stale `CLAUDE.md` will misdirect every future agent.
- Root planning docs superseded by this work: `MARKET_INDEX_UI_PLAN.md`, `MEMORY_AUDIT_AND_IMPLEMENTATION_PLAN.md`, `SERVER_SIDE_API_MIGRATION_FINDINGS.md`, `ADD_UNIT_FLOW_SUMMARY.md`, `STORAGE_AND_CACHING_INVENTORY.md`, `header_design.md`, `I18N_IMPLEMENTATION_SUMMARY.md` — **ask the user before deleting**; they may be intentional records.

**Commit:** `chore(cleanup): remove orphaned assets and refresh project instructions`

---

## Phase 8 — SEO verification (blocking)

Run after everything. Every check must pass.

1. **Route diff.** Compare the `next build` route table against `docs/cleanup/baseline.txt`. Every removed route that was *not* `Disallow`ed in the old `robots.txt` needs a `redirects()` entry. Removed routes that were already `Disallow`ed need none — state that explicitly in the report.
2. **Sitemap.** `npm run build && npm start`, then `curl -s localhost:3000/sitemap.xml`. Must contain `/`, `/sell`, `/calculator`, `/privacy`, **`/how-it-works`**, `/opportunities` (when `SITE.feed.enabled`) and the opportunity URLs. Verify **every** URL returns 200:
   ```bash
   curl -s localhost:3000/sitemap.xml | grep -oE '<loc>[^<]+' | cut -c6- | while read u; do curl -o /dev/null -s -w "%{http_code} $u\n" "$u"; done | grep -v '^200' 
   ```
   Output must be empty.
3. **robots.txt.** `curl -s localhost:3000/robots.txt`. `Allow` includes `/how-it-works`; no public path newly `Disallow`ed; AI-crawler block intact; sitemap URL present.
4. **No accidental noindex.** `grep -rn "noindex\|index: false" src/app` — every hit intentional and pre-existing.
5. **Metadata + canonicals.** Every public route still exports title, description, canonical, OG. `npm run lint:seo` — zero new errors vs baseline.
6. **Structured data.** `curl -s localhost:3000/ | grep -c application/ld+json` ≥ 3 (Organization, LocalBusiness, WebSite). `/how-it-works` must emit Breadcrumb + FAQPage. Validate the JSON parses.
7. **Legacy redirects alive.** Each must be 3xx to a 200 target, never 404/500:
   `/properties/123`, `/property/123`, `/unit/some-slug`, `/allProberties`, `/allProberties/ABC`, `/lenaqar`
8. **No broken internal links.** `grep -rhno 'href="/[^"#?]*"' src/app src/components | sort -u` → every path in the route table.

Write results to `docs/cleanup/seo-verification.md`.
**Commit:** `docs(cleanup): SEO verification results`

---

## Phase 9 — Final verification

1. Full gate (§3) green.
2. `node scripts/orphan-scan.mjs $(tr '\n' ' ' < scripts/entrypoints.txt) 2>&1 >/dev/null | tail -40` — empty, or only files you can justify in writing.
3. These must all return **empty**:
   ```bash
   grep -rn "from ['\"]@/app/(admin)\|from ['\"]@/app/(auth)\|from ['\"]@/components/dashbord\|from ['\"]@/app/allProberties" src
   ```
   ```bash
   grep -rn "COOKIE_KEYS.ACCESS_TOKEN\|COOKIE_KEYS.REFRESH_TOKEN\|useModuleActions\|useBrokerPermission" src
   ```
4. **Manual smoke — Arabic/RTL, desktop + mobile viewport:**
   - `/` loads; hero, core actions, comparison, why-us, commission, how-it-works-compact, opportunity preview all render
   - `/opportunities` lists units; filters work
   - `/opportunities/[slug]` renders; WhatsApp CTA opens with the right prefilled message
   - `/sell` submits successfully (rate limit is 8/hr per IP)
   - buy-request dialog opens, validates, and submits
   - `/calculator` computes
   - `/how-it-works` renders all three sections; every CTA lands correctly
   - `/anything-random` returns a real 404
   - zero console errors, zero 404 network requests
5. Record `du -sh .next/static`, First Load JS on `/`, and the source-file count vs baseline.

---

## 10. Deviations log (append as you go)

| Task | Planned | What actually happened | Why |
|---|---|---|---|
| | | | |

---

## 11. Final report template

```markdown
## Removed
- The entire LenaAI CRM admin (`src/app/(admin)/`, N files) — operated on lenaai.net instead
- Authentication, permissions and token refresh — no login in this repo
- <module> — <N files> — <reason>

## Kept
- Public marketplace: /, /opportunities, /opportunities/[slug], /sell, /calculator, /privacy, /how-it-works
- 3 API routes (sell-form catalogs + location search), 2 anonymous server actions
- Legacy SEO redirects: /properties/[id], /property/[id], /unit/[slug]

## Added
- /how-it-works — three flows (sell / buy an opportunity / buy request), FAQ structured data, in nav + sitemap

## Changed (UX/navigation)
- Public nav: <before> → الرئيسية · الفرص · بيع وحدتك · اشتري وحدة · كيف نعمل
- Admin sidebar: removed entirely (20 items → 0)

## Performance
- Source files: 733 → <N>
- Dependencies removed: <list>
- Public dictionary: 181 KB → <N> KB
- First Load JS on `/`: <baseline> → <after>
- .next/static: <baseline> → <after>

## SEO
- Public routes preserved: <list>
- Redirects added: <from → to, status>
- Sitemap: <N> URLs, all 200
- robots.txt: <diff summary>
- No accidental noindex: confirmed
- Broken internal links: 0

## Verification
- tsc / lint / build / lint:seo / tests: <status each>
- Orphaned files remaining: <N> (<justification>)
- Core flows smoke-tested: <list>

## Action required from you (not doable in-repo)
- Remove from the hosting platform: MATCH_SHARE_SECRET, OPENWA_SESSION_API_KEY, <others>
- Backend endpoints no longer called by this frontend (verify on lenaai.net before retiring): <list>
- Confirm before deleting: <root planning docs>
```

---

## 12. Stop conditions — escalate instead of guessing

- A file you were told to delete is still reachable from a keep entry point.
- The build breaks and the fix requires writing new business logic.
- A deletion would remove a public URL with no obvious redirect target.
- A public flow (sell, buy request, opportunity detail) needs a `/public/v1/*` change.
- Phase 4 copy: if the Arabic voice for the buy/buy-request sections is unclear, draft it and **ask the user to approve** before committing.
