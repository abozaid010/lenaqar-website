# AI-visibility panel, round 1 (2026-11-15)

Raw records: `2026-11-15-round1.jsonl` (84 lines, one per run). Panel: `../panel-v1.json`.
Runs used the owner's own consumer accounts in Chrome on 2026-11-15, roughly 10:40–15:00 Cairo time, from his Cairo connection. API results are not mixed in. No inclusion, ranking or citation outcome is implied for the future.

## Settings actually used
| Product | Mode | Personalization | What could be observed |
|---|---|---|---|
| ChatGPT Search | Plus account, model `gpt-6-thinking` (High), Temporary chat, Web search on | **Unpersonalized** (ignores memory, plugins, custom instructions), verified on every run | answer, cited URLs, and every URL in the search results (`search_result_groups`) |
| Claude web search | Opus 5.5 (High), Incognito | Incognito excludes history and memory, **but account skills and preferences still loaded** (2 branded runs leaked; see below) | answer and cited links; search results not exposed |
| Gemini app | Default model, Temporary chat | Temporary chat (no activity history) | answer and source chips by site name; no URLs, no search results |

## Scorecard (completed runs only; branded and non-branded never mixed)
| Product | Non-branded: mentioned | Non-branded: lenaqar.com cited | Non-branded: lenaqar.com in search results | Branded: mentioned / cited |
|---|---|---|---|---|
| ChatGPT Search | 0 / 24 | **2 / 24** | **9 / 24** | 4 / 4 · 4 / 4 |
| Claude web search | 0 / 24 | 0 / 24 | unknown (not observable) | 2 / 2 · 2 / 2 (2 runs excluded) |
| Gemini app | 0 / 24 | 0 / 24 | unknown (not observable) | 4 / 4 · 4 / 4 |

Recommendation rate (LenAqar recommended as a place to search, ask or verify): **0 / 72** non-branded completed runs.
Failed or excluded: 2 / 84 (Claude BR3, BR4: personalization leak).

### Where LenAqar was cited in non-branded answers (ChatGPT only)
- N08 run 2 (New Cairo investment): `lenaqar.com/guides/new-cairo/prices-2026` as a source; brand not named in the text.
- N11 run 2 (English, Madinaty price per m²): `lenaqar.com/guides/madinaty/prices-2026`, described as "a November 2, 2026 market guide" corroborating Aqarmap's EGP 58,050/m².

### lenaqar.com in ChatGPT's search results but not cited (9 runs)
The Madinaty, El Shorouk and New Cairo price guides, `/guides/el-shorouk/pros-cons`, `/guides/madinaty/budget-4m` and `/before-you-pay` were retrieved for N01, N03, N06, N08 and N11. ChatGPT cited other sources instead. For price questions it cited **Aqarmap**, whose figure the LenAqar guide itself quotes. The LenAqar-only inventory table (PR #40) went live the same day, so this round could not reflect it.

### Most-cited domains across the 72 non-branded runs
aqarmap.com.eg 21 · masrawy.com 16 · propertyfinder.eg 13 · elbalad.news 13 · bayut.eg 12 · blogs.realestate.gov.eg 12 · dubizzle.com.eg 7 · egypiana.com 6 · mrc-is.net 6.
For the "where do I find listings" prompt (N10), all three products recommended Bayut, Dubizzle, Property Finder or Aqarmap.

## Branded accuracy (facts checked against the live site)
| Fact | ChatGPT | Claude | Gemini |
|---|---|---|---|
| Buyer-first request, WhatsApp, no sales calls | correct | correct | correct |
| Office 505 ARCHPLAN Square, New Capital | correct | correct (BR2) | correct |
| Part of LenaAI (lenaai.net) | cited lenaai.net | correct | cited lenaai.net |
| Searches "resale and primary" | stated | stated (quotes site steps) | stated |
| Lawyer reviews resale paperwork | repeats site claim | repeats site claim | repeats site claim |
| How it makes money | quotes site terms: **buyer 1.25%, seller 0%**, terms "draft pending legal approval" | "site never says how it gets paid" | generic guess ("usually paid by the seller") |
| Legitimacy verdict | "Not independently verified" | "real, operating business … no independent reviews or press" | "legitimate prop-tech" |
| "Verified units" | — | — | stated (**overstated**) |
BR3 (commission) is unscoreable until SEO-07 is decided. The three products gave three different answers.

## What this tells us (signals, not causes)
1. ChatGPT finds LenAqar guides (9/24) but rarely cites them (2/24). The cited cases were the two pages that add something specific: a dated price figure with a source.
2. Claude and Gemini cited only established classifieds, news and government sites for non-branded questions. Whether they retrieved LenAqar is unknown.
3. Branded answers rest only on lenaqar.com and lenaai.net. Answers about legitimacy and commission conflict, because the site's own pages conflict (published terms vs. other pages) and nothing independent exists. This is the biggest accuracy risk.
4. "Resale and primary" appears in the site copy and all three products repeated it. Whether that matches the resale-only inventory is an owner decision.

## Method limits
- One round, one day, 2 runs per non-branded prompt: the variance between runs is visible (e.g. N08 and N11 were cited in run 2 only).
- Search-result visibility is observable for ChatGPT only. Gemini sources are site names, not URLs.
- Claude incognito still loaded account-level skills and preferences. Branded runs need a clean account or skills turned off.
- ChatGPT N01 cited lists come from the first collector version (first final message only).
- Location is the owner's Cairo connection; IP not separately verified.
