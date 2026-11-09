# Lenaqar public marketplace architecture

Verified 2026-11-03 against production source `ab0deed6`. This replaces obsolete CRM architecture notes; their history remains in Git.

- Egyptian buyer-first Arabic marketplace: “مش بنبيعلك اللي عندنا.. بنلاقي لك اللي إنت عايزه.” Initial business focus: Madinaty, New Cairo, El Shorouk. Buyer WhatsApp: `201002891933`; network contact is separate.
- Next.js **16.2.7**, React **19.2.7** (installed/lockfile), App Router, Tailwind 4. Node 20 in CI. ESLint config still 15.2.4; compatibility upgrade is not part of this takeover.
- Public routes: `src/app/(lenaqar)`; guides from Markdown in `content/guides`; internal preview routes are protected/noindex. `/network/login` exists; the CRM/admin application lives separately on lenaai.net.
- Data path: `opportunities.server.js` → read-only backend via `bffFetch` → slim mapper → `toPublicOpportunity` explicit allowlist → `applyPublicMoneyTrust` → cards/detail/metadata/JSON-LD. Catalog/detail fetch revalidation is 900 seconds. Server credentials stay out of public serialization.
- Unit video: `toPublicOpportunity` never passes the raw `video` string; `parseUnitVideo` allowlists YouTube/Facebook embeds and MP4/WebM files on the host of `NEXT_PUBLIC_VIDEO_BASE_URL` (default `https://video.lenaai.net`), rendered by `unit-video.jsx`.
- Money rule: compare down + remaining to total + over (1% tolerance). Raw helper supports paid + remaining fallback, but public allowlist currently drops paidAmount before validation. Hidden splits null cash/down/remaining/over/yearly/**years**, retaining total asking price. `paymentSplitHidden` gates UI/schema.
- Catalog is bounded at 30 pages/1,500 units; actual API returned 16/page on Nov 3, so the unfiltered website reaches only 480 of 613 records. Investigate pagination contract before changing caps.
- Guide indexability combines publication status/date and `seo-trust.js`; 53 total, 41 eligible, 12 intentionally noindex. Sitemap uses the same guards. Canonical host is `https://www.lenaqar.com`; apex responds 308.
- Deployment: linked Vercel project `lenaqar-website-279r`, scope `website-9c0c`; merging main triggers production automatically. Verify deployment API `meta.githubCommitSha`, READY, and canonical alias independently. CLI deployment is a fallback, not necessary for PR #23.
- CI: `.github/workflows/seo-check.yml` runs npm ci, ESLint and SEO lint. It does **not** run Node tests or a build. GitHub main has no protection/rulesets as observed Nov 3. Do not change security policy without an owner decision.

## Durable context

Read `CLAUDE.md`, `feature-progress.json`, then the latest dated section of `docs/buyer-first-implementation-log.md`. Structured evidence is in `REPORT/takeover-verification-2026-11-03.json`. Historical reports are not live-state proof. The existing master plan is linked in `feature-progress.json`; Phase 3 remains gated.

Preserve unrelated work and stashes. Never force-push/reset/drop stashes or delete unmerged branches. Read complete execution paths; make minimal fixes; run focused regression tests, lint and build; verify deployed SHA and actual public surfaces. Never invent property data or infer price verification from generic update timestamps. Do not submit production leads or send customer messages during QA.
