# Lenaqar SEO continuation — tonight’s P0/P1 execution plan

> **Execution override (2026-11-03):** latest owner instruction requires one PR, commit/push after verification, **never merge**. Merge/deployment steps below remain future release gates, not authorized actions in this execution. All 17 tasks are assessed; owner-data, release and elapsed-time dependencies must remain explicit.

**Plan date:** 3 November 2026 · **Timezone:** Africa/Cairo  
**Target:** production verification by 23:30, with 30 minutes of contingency.  
**Status:** planned, not implemented. This turn creates the plan and tracking files only.  
**Authorization:** owner approved proceeding to the next step and merging scoped, verified PRs. That approval carries into execution; it does not supply missing commission terms, property facts, account access or legal approval.

## 1. Outcome and release boundary

Tonight’s objective is a trustworthy, crawlable release: contain confirmed public financial contradictions, restore catalog completeness, remove unsupported provenance claims, repair conversion intent, and verify the deployed result. Preserve valid prices, photos, payment plans and indexable guides.

The target is to finish repository-controlled P0/P1 work tonight. It is a target, not a claim that all SEO, all CRM repairs, every unpublished guide, or search-index changes can finish in one evening. Expect approximately **12–18 active engineering hours across parallel lanes**, roughly **6–9 elapsed hours** including integration and deployment. Account/data/owner dependencies can extend that. Do not mark unfinished or blocked work complete to meet the date.

Tonight excludes a full price-index product, delivery tracker, broad geographic expansion, English mirrors, redesign, CRM database correction, social posting, paid campaigns, external outreach and real customer messaging. Existing original Phase 3 deliverables follow the trust release; they are not silently discarded.

**Release rule:** ship only reviewed work with passing gates. If a P0 remains, the release is not a completed P0/P1 release. A safe independently tested fix may still ship with the remaining P0 explicitly open. Do not deploy a rushed or broadly suppressive workaround.

## 2. Verified starting point

| Item | Evidence-based state |
|---|---|
| Main | `ab0deed6a0193bad216215470c2e4b386f478ceb` |
| PRs #20–#23 | Already merged; do not merge old branches again |
| Open PRs | None at this planning check |
| Documentation branch | `codex/takeover-verification-2026-11-03`, HEAD before this plan `bab40927` |
| Production baseline | Prior same-day verification: `dpl_ADrQoQV3GV6kAm9t76PYFh4bsZp2`, READY, exact main SHA, www alias |
| Tests | Prior takeover: 87 passing; build pass; lint 0 errors/8 warnings; SEO lint 0 errors/4 warnings |
| Focused live QA | Prior takeover: 326 passing assertions; not a complete performance/accessibility/schema certification |
| Guides | 53 total: 41 indexable, 12 intentionally excluded |
| Inventory | Complete read-only snapshot: 613 unique records/39 pages; current unfiltered site fetch reaches first 480 |
| Payment counts | First 480: 65 raw arithmetic failures / 77 public hidden splits. Full 613: 87 / 102. Different definitions, not interchangeable totals |
| Git safety | All 12 stashes preserved; no old branches deleted |

Refresh HEAD, open PRs, production SHA and live counts at execution start. These are dated baselines, not constants to hardcode into production.

### Additional-document reconciliation

Read sources include the original visibility master prompt; all five `REPORT/00-*.md` reports; artifact summary and baseline data; `ai-visibility/prompts.json`, run/crawl implementations and result records; `todos.json` WEB items; and relevant entries in `marketing/engage_history.md`.

The supplied `seo-phase-1` branch is `cf176610`; it is historical work already incorporated into main. Its Git tree does not contain the referenced research report directories. Those are present in the sibling **broker-market-research** workspace. Do not switch to that old branch for new development.

| Historical record | Reconciliation / remaining action |
|---|---|
| WEB2 / WEB3 | Bot additions and draft protections implemented; retain release regression coverage |
| WEB4 / WEB14 | www host migration already verified; do not reopen host selection or force 301 instead of the working 308 |
| WEB16 | Deployment already happened; repeat the original 30×9 crawl matrix after this release, with a separately labelled extension for newer routes |
| WEB11 / WEB13 / WEB15 | 40 actual prompts; all 160 historical engine runs skipped. No measured citation baseline exists. Keys/app spot-checks remain dependencies |
| WEB7 | Search Console/Bing/IndexNow account state not verified; do not claim submission or indexing |
| WEB8 | Commission, lawyer identity and service scope need actual owner facts |
| WEB9 | Business profiles/external listings are owner work, outside tonight’s code release |
| WEB10 | Mixes Lenaqar assets and sibling LenaAI work; only Lenaqar scope belongs here |
| WEB1 / WEB5 / WEB6 | Sibling-site/Cloudflare tasks; not authorized by this website release plan |
| Engagement history | Historical marketing actions, not deployment evidence. It reports a November 1 social contact fix; do not repeat the older “still wrong” claim without checking |
| Competitor anatomy | Search-snippet observations, with several unverified fields/403s; not authoritative price-source validation or measured assistant citations |
| Crawl baseline | 270 **URL×bot observations**, not 270 unique URLs. Naive robots parsing and offline schema extraction are limitations |

Keep the sibling files intact during this planning turn. During execution, reconcile only related WEB records and append a factual engagement-history entry after reading that workspace’s instructions and obtaining any filesystem permission required. Preserve unrelated marketing work. If writing there is blocked, record the exact pending synchronization; do not claim it happened.

## 3. Durable memory and task ownership

| File | Single responsibility |
|---|---|
| `feature-progress.json` | Historical phases, release summaries, owner approval and links to the active SEO plan |
| `seo-feature-req.json` | Stable task IDs, requirements, dependencies, acceptance criteria, estimated effort |
| `seo-feature-progress.json` | Sole authority for each SEO task’s live execution state, branch/PR/SHA, evidence and blockers |
| `SEO-PLAN.md` | Human-readable scope, sequence, decisions, QA and rollback |
| `REPORT/takeover-verification-2026-11-03.json` | Immutable dated baseline evidence |
| `REPORT/seo-release-2026-11-03/` | Execution evidence directory to create during implementation, with sanitized summaries and commands |
| `docs/buyer-first-implementation-log.md` | Append one release/handover summary; do not duplicate a separate task-status system |

The requested progress filename is normalized to **`seo-feature-progress.json`** rather than creating misspelled competing trackers.

Task lifecycle: `planned → in_progress → implemented → reviewed → merged → production_verified`; use `blocked_owner`, `blocked_access`, `blocked_evidence`, or `deferred` explicitly. A merge is not production verification.

For each task record: owner, start/update time, branch, PR, tested SHA, live SHA, evidence paths, blocker and next action. Update at task completion, blocker discovery, integration, merge and production verification. The lead owns tracker edits during parallel work; agents return evidence without racing to rewrite shared JSON.

## 4. Tonight’s ordered task backlog

### SEO-00 — Baseline, preservation and release preparation · P0

- Read current instructions and all four planning/tracking files; inspect worktree, stashes, remotes and any newly opened PRs.
- Refresh GitHub/Vercel state; record exact production baseline and rollback candidate.
- Prepare a documentation PR containing the existing takeover memory and this plan. Review and merge under the owner’s approval during execution; no new permission loop for this already authorized step.
- Branch implementation from current main using `codex/seo-*`; use isolated worktrees/branches for parallel agents. Never apply/pop/drop the historical stash.
- Done: source baselines and task IDs are consistent; no unrelated work overwritten. Estimate: 30 minutes.

### SEO-01 — Payment-document media containment · P0

**Problem:** MguPxCF0’s first image shows an installment table even when payment fields are hidden.

- Review the exact image and its public references; identify it by stable asset identity, not an unreliable image-position assumption.
- Prefer an existing authoritative asset-type/review field. If absent, a narrowly documented reviewed-image quarantine can contain confirmed financial-document images; do not infer all listing images are financial documents.
- Apply exclusion before public serialization, gallery rendering, schema and social-image selection. Do not merely hide with CSS while leaving URLs in RSC/JSON-LD.
- Audit other hidden-split listings for financial documents within available evidence; record unreviewed coverage. No claim of full-image clearance without reviewing it.
- Preserve ordinary property photos and legitimate total prices. Never alter the photographed numbers or invent replacement documents.
- Test known document exclusion, normal-photo preservation, fallback/no-image behavior, multiple images and hidden/valid listings. Check HTML/RSC/schema and browser gallery.
- Acceptance: the confirmed schedule no longer appears through site-managed public surfaces; valid photos remain. If source storage remains public, state that limitation—website redaction is not deletion or revocation at the source.
- Estimate: 1–2 hours; lead reviews privacy and policy decisions.

### SEO-02 — Contradictory buyer-request amounts · P0

**Problem:** `REQ-61240565AA04` shows monthly 85,000 against 8,500 in its note; other records conflict too.

- Trace `requirements.server.js → to-public-requirement.js → requirement-card.jsx` and the mapping/normalization path.
- Distinguish a proven mapping/scale bug from conflicting source data. Fix a mapping bug only when source meaning is established.
- Where neither value is authoritative, suppress the confirmed conflicting claims with a neutral review notice; preserve unaffected demand attributes. Do not choose the “more plausible” value, silently multiply/divide amounts, or deploy broad free-text inference.
- If safe generic conflict detection is not possible tonight, contain reviewed affected records narrowly and log the remaining audit coverage.
- Check free-text money and personal details as well as structured fields; avoid a visual fix that leaves contradictions in RSC.
- Acceptance: reviewed requests no longer assert conflicting amounts; valid requests and public privacy remain intact. Fixtures cover Arabic/Latin amounts, missing values and confirmed conflicts.
- Estimate: 1.5–2.5 hours; no CRM writes.

### SEO-03 — Catalog completeness · P1

**Problem:** API page_size=50 actually returns 16 rows; 30 pages cover 480, not all 613.

- Verify the current cursor contract and actual final page. Enumerate to exhaustion with explicit page/record/time ceilings, unique-code deduplication and repeated-cursor detection.
- A bounded fetch is still required. Increasing a magic limit alone is insufficient: reaching the limit must be observable as incomplete, not silently “complete.”
- Choose failure/cache behavior deliberately so a transient API failure cannot quietly publish an empty/partial sitemap as a successful complete refresh.
- Keep resale/primary product filters unchanged. Compare all fetched records with listable/indexable decisions; not every raw record must enter the sitemap.
- Acceptance: frozen 39-page fixture accounts for 613 distinct records before eligibility filtering; fresh live totals reconcile without hardcoded counts. Test duplicate pages, repeated cursor, timeout, failed intermediate page, empty/final page and resource ceiling.
- Estimate: 1–2 hours plus live/build verification; monitor request/build cost.

### SEO-04 — Payment arithmetic and public allowlist · P1

- Retain paid-amount evidence for internal validation before stripping it from the public contract.
- Validate each displayed money field. A valid `paid + remaining = total` identity does **not** automatically validate a conflicting down payment; do not simply restore all 15 additionally hidden full-catalog records.
- Keep unknown/unproven values hidden; preserve supported asking prices and valid plans. No invented CRM repairs.
- Save before/after code lists and classification reasons, not private source payloads. Refresh `REPORT/missing.json` through a reviewed reconciliation preserving dated history and open exceptions.
- Acceptance: audit definitions reconcile; legitimate plans stay visible; unsupported splits stay redacted; no internal paid/owner/author fields leak. Retain MguPxCF0/LNk7qZIF/kBqU7H1A coverage plus alternate-identity counterexamples.
- Estimate: 1.5–2.5 hours; lead owns validation design and review.

### SEO-05 — Honest source and freshness labels · P1

- Remove the `new Date()` price-freshness fallback in `network-strip.jsx`.
- Stop treating generic `updatedAt` as a verified developer-price date in property detail/metadata.
- Distinguish asking price, developer quote and verified sale only when explicit evidence supports the label. Otherwise use neutral wording and show a record update date only if clearly labelled as such.
- Update visible Arabic text, existing English dictionary equivalents, metadata and JSON-LD consistently. No public `/en` routes are introduced.
- Acceptance: no “verified today” inference; no automatic developer-price attribution; genuine source dates preserved. Test dated/undated/unknown-source cases.
- Estimate: 45–75 minutes.

### SEO-06 — WhatsApp buyer/seller intent · P1

- Replace shared buyer-page footer seller-prefill behavior with route/intent-appropriate text and stable page codes through existing helpers.
- Preserve buyer number `201002891933`, unit `OPP-*` attribution, seller intent on seller pages and the separate network contact.
- Review rendered links, encoding, mobile tap targets and existing event wiring. Do not create duplicate event hooks or send messages.
- Acceptance: buyer/seller/property/guide links express the correct intent and contain no personal data. Estimate: 30–60 minutes.

### SEO-07 — Commission policy · P1, owner-dependent

- Inventory all 0.75%-each-side and 1.25%-buyer-only claims, including `/classic`, privacy and locale strings.
- Prepare exact affected-copy diff. Apply the actual owner-confirmed fee basis, payer, trigger and exceptions across every surface.
- No arbitrary choice, invented legal language or deletion of meaningful terms to make tests pass.
- Acceptance: one approved policy everywhere. Without the answer, mark `blocked_owner` and explicitly exclude policy resolution from completion claims. Estimate: 30–45 minutes after the answer.

### SEO-08 — Crawl, discoverability and schema verification · P1

- Preserve the original 30 URLs × 9 bot-token matrix. Extend coverage separately for doors, three payment fixtures and newly discovered eligible listings.
- Inspect all 53 guide paths, target-city hubs/landings, indexability, sitemap membership, canonical/OG hosts, redirect chains, headers and internal links. Keep noindex paths crawlable when needed for discovery of the directive.
- Verify robots behavior with a reliable parser and fixtures; do not base release proof on the old naive parser. Synthetic user-agent responses do not prove access from genuine search-engine IPs.
- Ensure Madinaty, New Cairo and El Shorouk content has useful reachable links without mass repetitive anchor additions. Report duplicate/thin/orphan candidates; change only confirmed issues in tonight’s scope.
- Parse JSON-LD and validate applicable types/properties against current official documentation/tools during implementation; visible content must match schema. Do not equate valid JSON with valid Schema.org or guaranteed rich results.
- Acceptance: every intended indexable page in the checked set has correct canonical/directives; intentional exclusions remain excluded; valid content discoverable; new schema errors zero. Estimate: 1–2 hours.

### SEO-09 — Price-source register and excluded-guide triage · P1

- Reconcile six-city snapshot and current priority-city guides. Record source URL, source type, source date, retrieval date, property category, geography, sample size and methodology; unknown values stay unknown.
- Historical search snippets are insufficient to prove a statistical index. Never convert asking averages into sale prices or fabricate sample counts.
- List all 12 exclusions with exact reason, missing evidence, owner and next action. Mostakbal real-units requires at least three genuine matched inventory records; city-token zero is not proof there are no alternative labels.
- Make supported factual/link corrections only. Unverified guides stay noindex; publishing all 12 is not tonight’s acceptance target.
- Acceptance: priority price claims are traceable or appropriately qualified/excluded, and every excluded guide has a concrete remediation task. Estimate: 1–2 hours; research dependencies may remain open.

### SEO-10 — Measurement readiness and usable baseline · P1

- Inspect analytics already implemented before adding tracking. Map buyer open → successful save → qualified request, and WhatsApp clicks separately; do not treat a tap as a qualified lead.
- Audit the harness before spending: it currently mixes retrieved/search-result URLs with generated-answer citation evidence. Separate citations, mentions, retrieved sources and search presence; avoid substring domain matches and classify empty/error/skipped responses explicitly.
- Preserve the 40 prompt IDs and original 160 skipped rows. Use unique dated run directories; never overwrite the only baseline. Pin engine/model/config per comparable run and recheck provider APIs against current official docs.
- Read authorized Search Console/Bing/analytics data if available: coverage, submitted sitemap state, queries, impressions/clicks, top landing pages and funnel events. No account access means `blocked_access`, not zero traffic.
- Paid AI runs require working keys and an agreed spend cap; start with a small smoke set, then the unchanged matrix if authorized. API results and consumer-app observations remain separate.
- Acceptance tonight: trustworthy measurement setup and any available actual baseline; unavailable accounts/keys/budget explicitly blocked. No ranking/citation-gain promise. Estimate: about 1 hour for readiness; data collection is conditional.

### SEO-11 — Regression checks in CI · P1

- Add relevant Node tests to existing ESLint/SEO workflow. Keep build evidence explicit locally and through Vercel; do not introduce a build that requires inaccessible production credentials into GitHub CI.
- No unrelated dependency upgrade or branch-protection change.
- Acceptance: new trust/pagination regressions fail CI; existing checks stay enabled; secret handling safe. Estimate: 30–60 minutes.

## 5. Parallel execution and agent cost control

The lead prepares the plan and makes data-contract, privacy, architecture, release and rollback decisions. Later, use lower-cost implementation agents for bounded tasks with precise acceptance criteria. Select their actual available model at execution time; no unverified price/capability claim is needed here.

Maximum concurrent arrangement: **one lead + three implementation agents**. No subagents are started by this planning turn.

| Lane | Work packets | Ownership boundary |
|---|---|---|
| A — data/trust | SEO-03, then SEO-11; SEO-04 implementation after lead design; SEO-01 media handling | Catalog/serializer/trust/test files; lead reviews every financial/privacy decision |
| B — buyer trust/conversion | SEO-02, SEO-05, SEO-06; SEO-07 only after policy supplied | Requirement rendering, footer/contact helpers, locale strings; serialize shared-locale edits |
| C — SEO evidence/content | SEO-08, SEO-09; measurement evidence support for SEO-10 | Crawl/report/guide/link work; do not independently change schemas/serializers owned by A |
| Lead | SEO-00, risky design, SEO-10 review, integration, PR merges, SEO-12/13 | Shared progress JSON and final release decisions |

Each assignment contains: task IDs, verified base SHA, exact allowed files, dependencies, non-goals, acceptance cases, validation commands, evidence output path and escalation rules. Agents return **problem → evidence → minimal diff → tests → result → risk**. They cannot mark their own work production-verified or merge their own PRs.

Use separate worktrees or disjoint branches. Do not let agents share a mutable working tree or concurrently edit locale/tracker files. Lead reviews patches and merges sequentially. Escalate uncertain Arabic financial interpretation, unexplained count changes, privacy boundaries and API semantics to the lead; do not let an inexpensive executor guess.

## 6. Target schedule for tonight

Assumes execution starts around 17:30 Cairo on 3 November. If it starts later, rebase the timetable explicitly; no background execution is scheduled by this document.

| Cairo window | Deliverable / gate |
|---|---|
| 17:30–18:00 | SEO-00; refresh baseline; submit documentation PR; allocate isolated work; request missing policy/access inputs without blocking independent tasks |
| 18:00–20:00 | Parallel P0 containment, pagination, provenance/CTA and crawl/source audit; lead settles arithmetic design |
| 20:00–21:00 | P0 review gate; integrate arithmetic/media changes; CI tests; finish bounded SEO fixes; expose remaining blockers |
| 21:00 | Scope checkpoint: remaining risky work must fit review/build/live QA. Do not silently move open P0 to “done” |
| 21:00–22:00 | Combined diff review, full relevant tests, lint/SEO checks and build; preview HTML/RSC/mobile QA |
| 22:00–22:30 | Merge green tested scoped PRs sequentially; wait for deployment and confirm exact SHA |
| 22:30–23:30 | Live production QA, catalog/sitemap reconciliation and final evidence/tracker updates |
| 23:30–00:00 | Contingency for a targeted fix or safe rollback; record unmet scope if necessary |

Commission terms, legal facts, full CRM correction, account provisioning and search-engine indexing are not guaranteed tonight. At the 21:00 checkpoint, either demonstrate that the release gates remain feasible or publish the exact remaining work and revised ETA. Preserve the target without reducing safety or fabricating completion.

## 7. PR and deployment workflow — SEO-12

1. Check for new remote work; branch from current main. Never force-push, reset away work, delete unmerged branches or drop stashes.
2. Integrate documentation first or in the first scoped PR. No open PR currently needs merging; future merge approval applies to reviewed scoped PRs, not arbitrary old branches.
3. Prefer three coherent code changes: trust/data; honest copy/conversion; SEO evidence/CI. Split further only if it reduces review risk; account for Vercel deploying every main merge.
4. Lead reads complete diffs and execution paths, verifies acceptance cases, and checks exact head CI. Any new commit invalidates stale approval/test evidence for affected checks.
5. Run `node --test src/lib/lenaqar/__tests__/*.test.js`, applicable new tests, `npm run lint`, `npm run lint:seo`, and `npm run build`. Capture actual exit codes. Existing warnings remain labelled; new failures cannot be waived silently.
6. Review preview HTML, separate RSC, UI, metadata, JSON-LD, sitemap and robots. Test failure and success paths. Do not rely on unit tests alone.
7. Merge using the established merge-commit strategy and matching tested head. Do not bypass failing checks or rewrite history.
8. Use the existing Vercel Git workflow; avoid duplicate manual deployments. Verify `meta.githubCommitSha`, READY, www alias, and healthy canonical domain before claiming deployment success.

## 8. Production acceptance matrix — SEO-13

| Surface | Required live evidence |
|---|---|
| Payment fixtures | MguPxCF0/LNk7qZIF split and years null; kBqU7H1A years=9 and valid amounts retained, unless actual source data changed—investigate rather than force expectations |
| Media | Known schedule image absent from serialized URLs, gallery, metadata and schema; ordinary photos preserved; source-storage limitations recorded |
| Buyer requests | Confirmed conflicting records no longer assert incompatible amounts; valid requests preserved and no personal information added |
| Catalog | Fresh complete read-only count compared with fetched/listable/indexable counts; exclusions explicit; no silent 480 ceiling |
| HTML/RSC | Direct requests to www; not localhost/preview; checks include redacted fields and residual image references |
| Metadata/schema | Truthful price type/date; valid canonical/OG; supported schema fields and visible-content consistency |
| SEO discovery | All 53 guides checked; exclusions intentional; sitemap dynamically reconciled, www-only host; apex 308; robots/internal previews correct |
| Navigation/conversion | Home, doors, how-it-works, sell, city guides, listing and detail pages; correct buyer/seller WA prefills; mobile menu and form opening |
| Mobile | 390×844 plus a desktop viewport; no horizontal overflow or CTA obstruction on changed routes; keyboard/focus checks on changed controls |
| Failure behavior | Unit fixtures for API failure, incomplete pagination and missing evidence; no destructive production failure injection |
| Measurement | Existing event delivery inspected only where safely possible; no production test leads, real messages, paid campaigns or invented metrics |

Keep raw HTML and images with potential customer data out of commits. Store sanitized summaries, task-specific assertions, timestamps, SHA, deployment ID and commands. An unavailable external validator or account is a named limitation, not a passing check.

## 9. Rollback and containment

- Save the last verified deployment/SHA before each merge. Revert a scoped commit or redeploy a known verified commit using established tooling; never reset/force-push main.
- A previous deployment can contain known payment leaks. Prefer a narrow safe containment patch over blindly restoring those leaks. Record the tradeoff if rollback is necessary.
- Keep suspicious financial evidence out of public output while preserving valid totals and ordinary imagery. Do not wipe all listings or noindex the entire catalog as a shortcut.
- Roll back or stop release on private-data leakage, broken valid payment plans, broad accidental noindex, catalog loss, broken main CTAs or unacceptable deployment failure.
- After rollback, reverify actual alias/SHA and affected production surfaces. Tracker status must reflect the rolled-back state, not a former passing build.

## 10. Continuation after tonight

| Phase | Next scope | Gate |
|---|---|---|
| SEO-14 — Original Phase 3, first slice | El Shorouk sourced price-index pilot; existing guides as inputs; dated methodology, explicit price type, CSV and Dataset/Article matching visible facts | P0/P1 release verified; source/sample quality and update owner established; don't publish unsupported rows |
| SEO-15 — Phase 3 expansion | Madinaty/New Cairo where evidence exists; verification definitions; commission/about; refine existing before-you-pay | Actual owner/legal/backend facts; no invented verification badges |
| Phase 3 delivery tracker | Evidence-linked promised/actual dates, review workflow, names hidden by default | Source quality and legal approval; no accusations from anecdotes |
| Deferred Phase 2 | English mirrors/hreflang for selected pages | Accurate translations, identical verified facts and maintenance ownership |
| SEO-16 — Phase 4 | Repeat stable crawl/prompts 14 days after release and monthly; compare search and funnel measures | Usable baseline and access; results distinguish skips and methodology changes |

If the new release is verified on November 3, the first 14-day comparison target is **November 17, 2026**. Shift it if the actual release date changes. This plan does not create a reminder or automated paid job.

## 11. Owner dependencies and final completion report

Needed during execution: actual commission policy; permissions/access for GSC/Bing/analytics; AI keys plus spend cap if paid runs are wanted; verified source facts and lawyer/team/service details for later assets. A missing input blocks only its dependent work, not independent fixes.

Tonight’s handover must state:

- PRs merged, exact main and deployed SHA, deployment ID/status, and rollback candidate.
- Task IDs production-verified versus implemented-only, blocked or deferred.
- Test/build/CI and actual production checks, including failed checks and limitations.
- Refreshed catalog/guide counts with definitions and observation date.
- Remaining P0/P1 issues, responsible party and next action; no disguised completion.
- Final worktree/branch/stash state and updated durable trackers.

**Current state: plan and tracking prepared only. Implementation and merges have not started in this planning turn.**
