# SEO progress log — 2026-10-26

Companion to [`seo-audit.md`](seo-audit.md).

## Completed this session

### Audit
- Live crawl of robots, sitemap (496 locs), `/`, `/guides`, city guide URLs (404), landings, opportunities, how-it-works, ready-to-move.
- Documented wrong live contacts, undeployed guides, www vs apex canonical split, location gaps, VERIFY risk, analytics gaps, AI benchmark protocol (not run).
- Wrote full inventory + keyword map + 30-day plan in `seo-audit.md`.

### Code changes (repo — **not yet on production**)

| Change | Files |
|---|---|
| Default site URL → `https://www.lenaqar.com` | `src/config/site.js` |
| 6 new request landings (TG5, Madinaty, Shorouk, Mostakbal, Noor, NAC) | `src/lib/lenaqar/buyer-landings.js`, `src/app/(lenaqar)/apartments-for-sale/*/page.jsx`, `public/locales/lenaqar-ar.js` |
| Related links → `/guides/buying/…` + city hubs | `buyer-landings.js` |
| Guide WhatsApp → GA `click_whatsapp` + `lead_code` | `GuideWhatsAppCta.jsx`, `GuideStickyWhatsApp.jsx`, `analytics.js` |
| Visible VERIFY disclaimer on guide articles | `GuideArticleLayout.jsx` |
| Landing tests updated | `buyer-landings.test.js` |
| llms key pages note (www + new landings) | `public/llms.txt` |

**Already in repo from prior Buyer Guide work (still needs deploy):** contact `+201002891933`, `/guides` city architecture (53 MD), robots `/internal/`, Organization schema sameAs, CONTENT_STATUS sync.

## Tests executed

| Test | Result |
|---|---|
| `node --test src/lib/lenaqar/__tests__/buyer-landings.test.js` | Pass (3) |
| `npm run lint:seo` | 0 errors; 4 pre-existing warnings (network/opportunities) |
| `npm run build` | Success; new apartment landings + guide SSG routes present |
| Live production re-check after code change | **Not applicable** — no deploy this session |

## Remaining / blocked

| Item | Owner |
|---|---|
| **Production deploy** (contact + guides + landings + www default) | Owner / CI |
| Ensure `NEXT_PUBLIC_SITE_URL=https://www.lenaqar.com` in Vercel | Owner |
| Price audits → remove `[[VERIFY]]` city-by-city | Owner + research |
| Facebook Page WhatsApp button still wrong number | Owner (Meta) |
| GSC / GA baseline snapshots | Owner access |
| AI citation benchmark (ChatGPT / Gemini / Perplexity) | Manual protocol in audit §6 |
| Optional: `noindex` thin VERIFY price maps until audited | Product decision |

## Next steps (deployment checklist)

1. Deploy current `main`/branch to production.
2. Verify live:
   - Footer WhatsApp `wa.me/201002891933`
   - `/guides/el-shorouk/` → 200
   - `/apartments-for-sale/madinaty` → 200
   - Sitemap locs use `www` (or consistent with `NEXT_PUBLIC_SITE_URL`)
   - `robots.txt` contains `Disallow: /internal/`
3. Submit sitemap in Search Console; request indexing for hub + El Shorouk P1 + new landings.
4. After audits: patch MD numbers, bump `date_updated`, re-sync `llms.txt`.

## KPI reminder

Do **not** claim ranking improvements until GSC shows post-deploy impressions/clicks. Track `click_whatsapp` with `lead_code` in GA4 after deploy.
