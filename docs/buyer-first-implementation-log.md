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

## Takeover verification — 2026-11-03

This dated section supersedes conflicting status claims above. Canonical tracker: `feature-progress.json`; reproducible structured findings: `REPORT/takeover-verification-2026-11-03.json`. No Phase 3 implementation occurred.

### Release closed

PR #23 was OPEN at `79613067ed422307c786883160fa4a35596ef655`; remote diff exactly matched the reviewed local diff: one runtime assignment, explanatory comment, two regression cases, one progress line. No reviews; SEO CI and Vercel checks passed; mergeable/CLEAN; no GitHub branch protection or rulesets. Previous merge strategy was merge commits.

Problem → production MguPxCF0 serialized years=10 despite a hidden split. Minimal fix → null `installmentYears` in `applyPublicMoneyTrust`. Validation → 87 tests pass, lint 0 errors/8 warnings, SEO lint 0 errors/4 warnings, production build pass. Result → merged as **ab0deed6a0193bad216215470c2e4b386f478ceb** at 2026-11-03 16:52:11 Cairo; main CI [41657965586](https://github.com/abozaid010/lenaqar-website/actions/runs/41657965586) passed. Existing Vercel Git integration deployed **dpl_ADrQoQV3GV6kAm9t76PYFh4bsZp2**, READY, exact merge SHA, aliases www/apex confirmed by deployment API. No duplicate manual deployment.

Previous production `dpl_CLwC23vUHZRJ8teawgebaAKTZ1uJ` at `26445560` was independently confirmed before merge. PRs #20/#21/#22 are MERGED (`7fd6edb1`, `c3b612a6`, `c8fe815e`). No intervening remote main work was found. #23 was the only open PR and there were no open issues at inspection.

### QA scope and limits

- 326/326 focused HTTP assertions across 70 endpoints, including **all 53 guides**, passed. 545 sitemap URLs use www; apex 308; Claude search/user agents present. All 12 excluded guides are noindex and absent from sitemap; 41 eligible guides remain listed. JSON-LD parses on inspected pages; this is not full external schema vocabulary validation.
- Separate HTML and `RSC: 1` requests: MguPxCF0/LNk7qZIF null down/remaining/over/yearly/years, retain total, and expose the hidden-split marker. kBqU7H1A retains years=9 and payment amounts. Listing JSON-LD removes hidden plan fields and preserves the valid plan. Meta/OG descriptions omit hidden split amounts.
- Browser UI confirms all three examples. At 390×844, homepage and seller page have no horizontal overflow; mobile menu opens and buyer form opens. Property WhatsApp links contain the correct destination and OPP code. Seller link is valid. No form submission, lead creation, or WhatsApp message was performed.
- Initial sitemap test incorrectly rejected the homepage URL without trailing slash; corrected to compare parsed hostname against the same captured artifact. This was a QA harness defect, not a production failure.
- Remaining risk: images can contain payment information outside structured redaction. Full-property crawl, external schema validation, performance/CWV, screen-reader audit, conversion delivery and Search Console remain unverified.

### Git and stash reconciliation

One worktree; started clean on the fix branch. Local main/origin/main now both `ab0deed6`; docs are isolated on `codex/takeover-verification-2026-11-03`. No branches deleted (151 local: 99 merged, 52 unmerged at inspection). All **12 stashes preserved**. Reviewed full `stash@{0}` (`796d32105e1959b3c6bfb97933967dc5a07e3436`), which only changes progress JSON. Its deployment evidence was checked and retained under `historical_stash_evidence`; obsolete status text was replaced using current evidence. No apply/pop/drop, and older unrelated stashes were not changed. Historical QA timestamp claims 22:12 +02 before a 22:03Z deployment; chronology is inconsistent, so the historical 72-pass claim is not used as fresh proof.

### Roadmap reconstructed

Authoritative original plan exists at `../broker-market-research/marketing/prompts/lenaqar-website-visibility-master-prompt.md`, sections 7 and 10; existing tracker retains it. Reports `../broker-market-research/REPORT/00-findings.md` and `01-phase1.md` were read alongside underlying crawl/results artifacts.

| Phase | Goal | Current status | Evidence | Remaining work | Priority |
|---|---|---|---|---|---|
| 0 | Baseline | Audit completed; measurement partially complete/blocked | Findings report, 270 **URL×bot rows**, 40 prompts; 160 API runs skipped | Supply engine access and app spot-checks; no measured citation baseline exists | P1 |
| 1 | Trust/crawl | Implemented and focused production-verified, data contract partial | PR #20/#21 history; current robots/canonicals/guide guards | Trust fields absent from public allowlist; CRM remediation and source labels | P0/P1 |
| Content completion | Eligible guides/price maps | Partial editorial completion; safe exclusions verified | 53 guides, 41 indexable, 12 noindex; 6-city Nov 2 snapshot | 11 placeholder guides + Mostakbal real-units; source refresh ownership | P1 |
| 2 | Buyer-first homepage/doors/conversion | Core complete and production-verified | PR #22/#23, exact READY SHA, HTTP/browser QA | /en deferred; proof strip deliberately absent; separate defects below | P0/P1; EN P2 |
| 3 | Citable data assets | Defined, not started; before-you-pay overlaps Phase 2 | Original plan: price index, delivery tracker, checklist, verification definitions, commission/about, llms updates | Owner GO, source/sample methodology, legal review and owner copy | P1/P2 |
| 4 | Re-test | Not started/measurement blocked | Original plan: 14 days after deploy, then monthly | Establish usable baseline, access and stable prompt set; no SEO gain claimed | P1 |

Phase 3 acceptance in the existing plan: own server-rendered dated pages, methodology, CSV and JSON-LD; price rows distinguish developer/asking/actual sale with source/date/sample size; verified cities only; delivery names hidden by default and lawyer approval required; commission/lawyer details supplied by owner. Existing `/before-you-pay` already provides a door/checklist with HowTo/FAQ; price guides are inputs, **not** a completed Dataset index. No dedicated Dataset/CSV price index, delivery tracker, verification definition, commission or team route was located. llms already links doors; future asset links are pending.

Older plans use different phase numbers: `MARKET_INDEX_UI_PLAN.md` is an admin/CRM plan, and `MEMORY_AUDIT_AND_IMPLEMENTATION_PLAN.md` describes legacy dashboard work; neither defines this program’s Phase 3. Cleanup phases in `docs/LENAQAR-CLEANUP-PLAN.md` are historical migration work, not new SEO commitments. `LENAQAR-LAUNCH-PLAN.md` already documented the 16-row API cap; today’s 613-record inventory now exceeds the current 30-page bound. Its proposed mixed primary/resale feed differs from current `SITE.inventory.isPrimary=false`; expanding primary inventory requires an explicit product decision, not a silent filter change. Old October SEO deploy/contact/canonical blockers are superseded by today’s evidence; Meta account contact configuration remains unverified.

### Confirmed findings and count definitions

1. **P0, media bypass:** MguPxCF0's visible first gallery image is a photographed installment table while structured split fields are hidden. Do not claim all payment information is removed. Requires media classification/review policy; do not hide valid property photos indiscriminately.
2. **P0, contradictory buyer requirements:** homepage request `REQ-61240565AA04` shows monthly 85,000 while its note says 8,500. Another request has different budget/down/monthly values in notes versus fields. Neither value can be selected as truth without evidence. Scope extends to public request data, not PR #23.
3. **P1, catalog truncation:** `opportunities.server.js` bounded loop and `SITE.feed.maxPages=30`; live endpoint returns 16 rows per page despite page_size=50. Full traversal: **39 pages, 613 unique records**, versus site's first 480. 133 later records are outside the unfiltered catalog window (detail lookup can still serve them). Investigate API contract and pagination termination with fixtures.
4. **P1, arithmetic evidence loss:** `to-public-opportunity.js` excludes paidAmount before `applyPublicMoneyTrust`, losing the helper's alternate identity. First 480: **65 raw failures / 77 public hidden**; full 613: **87 / 102**. These are different definitions, not contradictory totals. Additional hidden records need review; do not mechanically restore financial fields. The old 113 count used earlier logic; do not compare as a current metric. `REPORT/missing.json` remains a dated 480/77 snapshot, not overwritten as a live database queue.
5. **P1, price provenance:** `listing-seo.js` appends “السعر من المطور بتاريخه” without verified source evidence; detail uses generic updatedAt as “سعر المطور محدّث”. `network-strip.jsx` falls back to `new Date()` and seller page shows today's “prices updated” label. Date of rendering is not evidence of price verification.
6. **P1, commission decision:** locale has 0.75% each party versus privacy 1.25% buyer/zero seller. `/classic` renders the former (noindex does not make it private); privacy renders the latter. Owner must settle the policy before edits.
7. **P1, buyer WhatsApp intent:** shared footer on buyer pages pre-fills a seller message. Links work, but attribution/intent is wrong for buyers. Primary buyer form opens; backend success and analytics receipt deliberately untested.
8. **P1/P2, editorial debt:** exactly 12 noindex guides, not “52 of 53 indexable.” No Mostakbal city-token matches in the complete catalog; not proof of no inventory under alternative labels. Keep real-units noindex until ≥3 genuine matched units verified. Six-city asking-price snapshot is dated Nov 2; underlying external prices not re-researched here. El Shorouk guide also updated Nov 2. Sample sizes/methodology remain prerequisites for an index.
9. **P2, technical assurance:** CI omits unit tests/build, branch protection absent; performance and error monitoring not measured in this takeover. README/architecture were stale CRM descriptions and are corrected. No measured SEO/conversion improvements can be claimed.

### Recommended milestones — proposals awaiting approval

Effort is engineering time, excluding owner/backend/legal waiting. These are recommended sequencing changes, not new approved phases.

| Milestone | Scope and deliverables | Dependencies / risk | Acceptance and QA | Rollback | Effort / impact |
|---|---|---|---|---|---|
| P0 trust follow-up | Review schedule images and contradictory request fields; preserve genuine photos and supported totals | Owner media policy + authoritative CRM values; risk of over-redaction | No contradictory financial information on affected public surfaces including images; negative/valid fixtures, HTML/RSC/browser checks, no fabricated corrections | Revert targeted rendering patch; retain audit evidence, never restore known leak blindly | 2–4 days; high buyer trust |
| P1 catalog/data contract | Correct bounded pagination and validate paidAmount internally before public omission | Backend pagination contract; build/load cost and privacy | All 613 snapshot records accounted for with explicit eligibility exclusions; cursor-loop/timeout tests; raw vs public audit reconciled; no private fields serialized | Feature-controlled page bound / revert fetch changes; monitor server cost | 2–3 days; material discoverability and inventory coverage |
| P1 truthful messaging + funnel | Owner-approved commission policy; genuine source dates; buyer-specific WhatsApp text; define qualified request and event map | Owner copy, source fields, analytics access; avoid duplicate events/PII | One policy across pages; no inferred freshness; buyer/seller prefills match; staging success events once, no PII, production read-only checks | Revert copy/events independently; keep safe unknown-source labels | 2–4 days; trust and qualified conversion |
| P1 measurement/editorial | GSC/Bing baseline, indexability/internal-link audit; review Madinaty/New Cairo/Shorouk guides first; source freshness owner | Account access, verified research; no rankings guarantee | 41 eligible URLs accounted for, 12 exclusions intentional, priority orphan links resolved, dated source register; baseline report before claims | Keep unverified guides noindex; revert content through Git | 3–5 days plus monitoring; organic quality |
| Phase 3 first slice | El Shorouk price-index pilot with method/type/date/source/sample size, CSV and matching Dataset/Article; expand existing before-you-pay only where needed | Owner GO, defensible samples and legal checklist approval; third-party averages alone may lack sample sizes | Every published row traceable, CSV=HTML, no invented counts, schema validated, mobile and crawl QA; don't publish unsupported rows | Keep incomplete asset unpublished/noindex; revert asset links | 4–7 days after data approval; potential citation value, unmeasured |
| Phase 3 later assets | Verification definitions, commission/about after owner facts; delivery tracker after evidence/legal workflow | Lawyer identity, approved commission, per-row evidence; reputational risk | Visible labels match backend evidence; developer names hidden by default; lawyer-approved workflow and update ownership | Disable tracker/name feature; preserve reviewed records privately | 3–6 days plus legal/data work; trust, higher maintenance |
| P2 technical health | CI regression coverage proposal, CWV/accessibility baseline and measured fixes | Owner CI policy decision, production field metrics | Required targeted tests run in CI; performance budgets set from baseline; keyboard/RTL audit; no unmeasured optimization claims | Revert isolated CI/performance changes | 2–4 days; lower regression risk |
| P2/P3 expansion | /en mirrors + hreflang; additional cities only after demand/data evidence | Accurate translations and maintenance owner | Matching facts across languages, canonical/hreflang validation, no thin duplicate landings | Remove from discovery/noindex until corrected | 3–5 days for initial EN slice; optional until evidence supports it |
| Phase 4 | Re-run unchanged 40 prompts and crawl at 14 days and monthly; select next 5 actions from results | Engine keys, GSC baseline, owner app checks | Skips explicit; comparable engine/model/date records; citation and mention rates reported without causal overclaim | No runtime change; retain raw measurements | 1–2 days per cycle; prioritization evidence |

Necessary next work: trust defects, inventory completeness, provenance and measurement. Optional/deferred: broad geography, EN expansion absent demand, delivery tracker before evidence/legal readiness. No new dependency, refactor, data correction, content publication or security-policy change was made during this takeover.

### Approval gate

PR #23 is closed and production verified. Documentation reconciliation is local on its own branch; all stashes remain available. Review the P0/P1 follow-up scope first, then approve a bounded Phase 3 slice. Existing plan does not constitute authorization to begin it. Owner inputs still needed: commission policy, lawyer/team facts, source-refresh ownership, backend trust fields, Search Console/Bing/analytics access and visibility-engine access. No external party was contacted.
