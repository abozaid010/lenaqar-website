# Changelog — Buyer Guide section (2026-10-26)

## Summary

Built Markdown-driven «دليل المشتري» under `/guides` with status gating, SEO/GEO schemas, contact cleanup, and **53 draft articles** for 26 Oct – 20 Dec 2026. **Nothing published** (all `draft` / `needs_numbers` / `in_review`). No production deploy.

## Contact

- Unified buyer phone + WhatsApp to `+201002891933` in `src/config/lenaqar-contact.js`.
- Network signup remains `+201016080323`.
- Organization schema: WhatsApp contactPoint + sameAs (Facebook / Instagram / TikTok / LinkedIn lenaqar.eg).
- Grep: old `+201036364340` / `+491745661918` removed from live config (historical example in launch plan updated).

## Infrastructure

- `content/guides/**` + vendored `_cities.json`
- `src/lib/guides/*` loader, status, WhatsApp lead links, JSON-LD helpers
- Routes: hub, `[city]`, `[city]/[article]`, `buying/[slug]`, `compare/[slug]`
- Preview: `/internal/guides`, `/internal/content-status`
- Redirects: old buying guides → `/guides/buying/...`
- `sitemap.ts` / `robots.ts` / `public/llms.txt` + `llms-full.txt` (published only)
- `CONTENT_STATUS.md` + `npm run guides:sync-status`
- Deps: `gray-matter`, `react-markdown`, `remark-gfm`

## Content counts (by status)

See `CONTENT_STATUS.md` — refreshed by sync script. Approximate: ~53 files; El Shorouk P1 numbers imported from research article (not rewritten).

## Validation notes

- `npm run build` — success; routes include `/guides`, `/guides/[city]`, `/guides/[city]/[article]`, `/guides/buying/[slug]`, `/guides/compare/[slug]`, `/internal/*`.
- Smoke: `/guides` → 200 with «دليل المشتري في مصر»; draft pillar URL soft-404 (`NEXT_HTTP_ERROR_FALLBACK;404`, `noindex`); robots Allow `/guides/*` + Disallow `/internal/`; sitemap lists hub only until publish; `llms.txt` has WhatsApp +201002891933.
- Organization JSON-LD includes contactPoint + four sameAs profiles.
- `npm run lint:seo` — 0 errors (pre-existing warnings on network/opportunities only).
- Lighthouse CLI not installed in this environment — re-run locally: `lighthouse http://localhost:3000/guides --only-categories=seo,performance`.

## Out of scope (waiting on owner)

- Approving / publishing any article
- Production deploy
- Six real unit cards (P4) — marked `needs_numbers`
- Facebook Page WhatsApp button (research todo)
