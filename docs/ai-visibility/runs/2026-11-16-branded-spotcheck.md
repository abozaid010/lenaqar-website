# Branded spot check (2026-11-16)

Not a panel round: one prompt, two products, to see whether the #47 commission fix reached the answers. Owner's accounts, clean modes.

| Product | Mode | Prompt | Answer (summary) | LenAqar cited | Verdict |
|---|---|---|---|---|---|
| ChatGPT (`gpt-6-thinking`) | Temporary chat, Unpersonalized, Web search | هل لينا عقار بتاخد عمولة من المشتري؟ | "Not clearly stated whether LenAqar charges buyers; no specific rate found; site advises agreeing on commission in writing" | `/how-it-works`, `/before-you-pay` | **Outdated** — the 2.5% / 2.5% policy is on `/`, `/how-it-works` (FAQ) and `/privacy` but ChatGPT read `/how-it-works` from before the deploy (Google last crawl 2026-10-07) and `/before-you-pay`, which had no commission text |
| Gemini (default) | Temporary chat | same | "LenAqar does **not** take any commission from the buyer" (no sources shown; spelled "Leena Aqar") | none | **Wrong** (ungrounded) |

## Actions taken the same day
- PR #50: commission + free partner-lawyer review stated visibly on `/how-it-works` and in the `/before-you-pay` FAQ (+ FAQPage schema).
- Search Console "Request indexing": `/privacy`, `/`, `/how-it-works`, `/guides/madinaty/prices-2026`, `/guides/el-shorouk/prices-2026`, `/guides/buying/contract-registration-checklist`. `/before-you-pay` to request after PR #50 deploys.
- Google index state via URL Inspection API (2026-11-16): all checked pages "Submitted and indexed"; re-crawled after the #47 deploy: `/` (2026-11-15 15:56 UTC), `/guides/fifth-settlement/prices-2026`, `/guides/new-cairo/prices-2026`, `/privacy` (2026-11-16 11:32 UTC, after the request). Stale at check time: `/how-it-works` (10-07), `/before-you-pay` (11-03), Madinaty (11-02), El Shorouk (11-03), checklist (11-02). `/llms.txt`: unknown to Google.
- First Search Console data (2026-08-01..11-16): `/guides/el-shorouk/prices-2026` 102 impressions, 1 click; `/guides/madinaty/prices-2026` 11 impressions.

Re-check the same prompt after re-crawls (≈ 2026-11-19) and in panel round 2 (≥ 2026-11-21). One spot check is not a trend.
