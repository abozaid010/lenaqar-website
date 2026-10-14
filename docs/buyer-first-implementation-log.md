# Buyer-first SEO/GEO implementation log

**Date:** 2026-10-14  
**Source of truth:** `docs/lenaqar_marketing_seo_ads_strategy.md`  
**Scope:** Public marketplace at `lenaqar.com` (this repo)

## Verdict

Homepage, sitewide defaults, CTAs, FAQ, schema description, high-intent landings, guides, sitemap/robots, `llms.txt`, and Meta Lead tracking are now aligned to the buyer-first tagline:

**مش بنبيعلك اللي عندنا.. بنلاقي لك اللي إنت عايزه.**

No guaranteed rankings or visibility claimed. No invented inventory counts, prices, or search volumes.

## Shipped

### Messaging & conversion
- Homepage H1 + hero + closing CTA hierarchy flipped to buyer request first; seller/broker secondary.
- Header primary CTA = buy request (seller WhatsApp removed from header chrome).
- Sticky `CoreActions` default emphasis = `buy`.
- `/how-it-works` leads with request flow; FAQ rewritten for request, privacy, and realistic matching.
- Buy request intro/CTA labels updated; safer language (no “first platform”, no absolute “no cold calls”).

### Technical SEO / GEO / AEO
- Default + homepage metadata buyer-first.
- Organization schema description updated.
- Homepage FAQPage schema retained (visible FAQ matches).
- New indexable landings: New Cairo, Sheikh Zayed, 6th of October, North Coast, ready-to-move, villas.
- Buyer guides index + 2 guides.
- `sitemap.ts` + `robots.ts` allow/list new URLs.
- `public/llms.txt` for AI/answer engines.
- AI crawlers remain explicitly allowed in robots.

### Analytics / ads readiness
- Meta `Lead` on successful buy-request submit (no PII).
- Meta `ViewContent` paths updated to Lenaqar buyer routes (removed legacy LenaAI paths).
- UTM + experiment notes: `docs/ads-utm-and-conversion.md`.

## Preserved
- Existing routes (`/`, `/opportunities`, `/sell`, `/calculator`, `/how-it-works`, `/network`, `/privacy`) unchanged.
- Public request cards still anonymized; no buyer PII added to HTML/schema.
- Opportunity filter URLs still canonicalize away from facet spam.
- `/classic` remains noindex (legacy).

## Blockers / open items (need human or ops)

1. **Production crawl/auth:** automated `curl` to `lenaqar.com` returned 403 from this environment — verify titles/H1/schema in Search Console URL inspection after deploy.
2. **Search Console + sitemap submit:** confirm property ownership and submit updated sitemap after release.
3. **Opportunities feed in prod:** prior audit noted empty catalogue in production; listing SEO multiplies only when units render.
4. **Commission copy conflict:** UI `0.75%` each side vs privacy `1.25%` buyer / `0` seller — legal must pick one before ads scale.
5. **Qualified-request definition + CRM source fields:** not implemented in this pass; needed for ads CPA quality.
6. **Canonical host:** confirm `lenaqar.com` vs `www` redirects at DNS/CDN (not changeable in app alone).
7. **“Notify when match”:** empty-state copy no longer promises push notification; product still lacks alerts.
8. **EN locale:** marketplace partially synced; site remains Arabic-primary.

## Measurable next steps (post-deploy)

1. Baseline GSC queries/impressions for `/` and new landings (7–14 days).
2. GA: `buy_request_opened` → `buy_request_submitted` rate by landing page.
3. Meta: confirm Lead event in Events Manager; map as conversion.
4. Launch limited Search tests per `docs/ads-utm-and-conversion.md`.
5. Review unmatched demand weekly to prioritize next landings (only if unique content + data exist).
