# SEO-10 measurement readiness — 2026-11-03

## Evidence normalizer

Added `scripts/ai-visibility-evidence.py`, an offline normalizer for saved provider-response JSONL. It makes no network calls and does not read credentials. The expected input is one JSON object per provider attempt with `engine`, `prompt_id`, optional `model` / `measurement_type` / `status`, and the saved provider payload in `response`.

The normalizer preserves the canonical prompt universe from the supplied prompt file, validates every result against those IDs, and records language and intent without copying prompt text. Outputs are committed as unique timestamp/UUID run directories with input and prompt-file SHA-256 values; a completed directory is not overwritten. Raw answer text and provider payloads are omitted. URL query strings, fragments, and userinfo are stripped from the normalized evidence.

Evidence classes are separated by provider shape:

- OpenAI Responses: message text URL annotations are answer citations; `web_search_call` sources are retrieved sources.
- Anthropic Messages: text-block citations are answer citations; `web_search_tool_result` URLs are retrieved sources.
- Gemini: grounding chunks are retrieved sources; they count as answer citations only when `groundingSupports` attaches the chunk to generated text.
- Perplexity Search API: result URLs are search/retrieval evidence only. This endpoint does not return a generated answer and never contributes to generated-answer citation denominators.

Target-domain matching parses the URL host and accepts `lenaqar.com` or a dot-delimited subdomain. Names such as `lenaqar.com.evil.test` and `notlenaqar.com` do not match. Top-level provider error objects normalize to `error` without retaining their message. Gemini citations require a grounding support whose non-empty segment text occurs in the generated answer; a grounding chunk alone is only retrieved-source evidence. Summaries report attempted rows and status counts separately from answer-success and retrieval-observed denominators. A successful search response with an empty result array is recorded as `search_empty` and included in the retrieval denominator as a zero-presence result. `skipped`, `error`, and unsuccessful `empty` rows stay visible but are excluded from successful answer/retrieval denominators.

Example invocation:

```sh
python3 scripts/ai-visibility-evidence.py \
  --input-jsonl /path/to/saved-responses.jsonl \
  --prompts-json /Users/abozaid/workspace/broker-market-research/ai-visibility/prompts.json \
  --output-root REPORT/ai-visibility-runs
```

## Historical prompt and run evidence

The source remains `/Users/abozaid/workspace/broker-market-research/ai-visibility/prompts.json`; it contains 40 prompts with IDs `P01–P08`, `B01–B06`, `F01–F06`, `N01–N04`, `D01–D06`, `S01–S05`, and `BR01–BR05`. The original saved result is `/Users/abozaid/workspace/broker-market-research/ai-visibility/results/2026-11-02.csv` and was left untouched.

That CSV has 160 rows: 40 each for OpenAI, Anthropic, Gemini, and Perplexity. All 160 have skipped status because the respective usable API keys were absent (Gemini also rejected the available non-AI-Studio `GOOGLE_API_KEY`). Therefore these are preserved skip records, not citation observations and not evidence of zero citations. There is no measured API citation or mention baseline yet. Provider APIs and consumer apps are distinct measurement types; the script records that distinction and does not treat search-result retrieval as a consumer-app citation.

## Existing site analytics wiring

- GA4 is configured in `src/app/layout.jsx` through `NEXT_PUBLIC_GA_MEASUREMENT_ID` with a code default. The layout loads `gtag.js` and configures the measurement ID. `useGoogleAnalytics` sends named GA events with page location and a client timestamp.
- Buyer funnel start is `buy_request_opened`, sent by the CTA click and by the `#buy-request` entry path in `src/components/lenaqar/buy-request-cta.jsx`. Successful save is `buy_request_submitted`, fired in the dialog `onSuccess` callback after the save function succeeds; that same callback sends Meta `Lead` with only `content_name` and `content_category`, no form fields. This establishes a submitted-request event, not a CRM-qualified-lead event. Qualification criteria and a qualified-request event are not present in the inspected public-site code.
- WhatsApp interactions have route-specific GA event names in the CTA components and Meta `Contact`. `MetaPixelProvider` also captures WhatsApp clicks at the document level while `WhatsAppCta` sends `Contact` directly. The integrated fix deduplicates those paths by native click identity (including React wrappers), while preserving separate clicks and automatic fallback tracking. Two focused regression tests pass. This is code-level verification, not observed analytics receipt.
- PageView and selected-route ViewContent are emitted by the Meta provider. No analytics event has been treated here as proof of delivery, attribution, or conversion quality.

## Account access and limits

The repository takeover evidence records that no Search Console or analytics account was inspected. No authorized GSC, Bing Webmaster Tools, IndexNow, GA4, or Meta Events Manager account data was supplied for this task. Current verification of property ownership, sitemap submission/indexing, impressions, clicks, landing-page reports, or event receipt is therefore **unavailable**; unavailable is not zero. No API keys, paid provider requests, production submissions, or customer messaging were used.

Next evidence needed: authorized read access to Search Console/Bing/GA4/Meta reporting; a reviewed small provider smoke set after keys and a spend cap are supplied; and a business definition for “qualified request” before adding or interpreting that event. No ranking, citation-gain, or delivery claim is made.

## Validation

`python3 -m unittest scripts.tests.test_ai_visibility_evidence -v` — 9 tests passed. Fixtures cover OpenAI / Anthropic / Gemini citation separation, Gemini text-segment support, provider error objects, Perplexity search-only and successful-empty results, hostile substring domains, skip/error/empty denominators, raw-answer/query redaction, 40-ID preservation, and unique run output. These are synthetic provider-shaped fixtures: no live provider adapter responses were available or validated. All processing is local and offline.
