# AI spot check + analytics pull (2026-11-18)

Not a panel round: 2 prompts × 2 products, owner accounts in temporary-chat modes. Claude skipped (needs a clean account; account skills leak into answers).

| Product | Prompt | Answer (summary) | LenAqar cited | Verdict | vs 2026-11-16 |
|---|---|---|---|---|---|
| ChatGPT (temporary, Thinking high, web) | هل لينا عقار بتاخد عمولة من المشتري؟ | Buyer 2.5%, seller 2.5%, due at sale-contract signing, same for primary and resale, legal review free for the buyer; source: LenAqar FAQ | yes (lenaqar.com FAQ) | **Correct** | was "not clearly stated" → fixed |
| Gemini (temporary, default) | same | "LenAqar does not take commission from the buyer in most cases" (no sources) | no | **Wrong** (ungrounded) | unchanged |
| ChatGPT | سعر متر الشقق الريسيل في مدينتي دلوقتي كام؟ | Range 60–75k EGP/m²; lists Aqarmap 58,050, **LenAqar 71,620 based on 125 resale apartments**, Egypiana 76,437; phase table attributed to Aqarmap via the LenAqar guide | yes (Madinaty price guide) | **Cited with LenAqar's own data** | first check of this prompt since the B5 table |
| Gemini | same | 50–75k range by phase, no sources, no LenAqar mention | no | Not cited (ungrounded) | — |

Reading: ChatGPT reads the live pages (its LenAqar figure matches today's table, not the 2026-11-15 numbers 70,085 / 120). Gemini answers these from model knowledge without search grounding, so page changes do not reach it yet; Google Business Profile (pending video verification) and independent mentions are the remaining levers.

## GA4 (property 562541313), 2026-11-05..11-17 — `REPORT/ga4/2026-11-18-pull.json`
- AI Assistant channel: 24 sessions, 18 engaged (75%, highest of all channels; Paid Social 50%, Direct 54%, Organic Search 57%). All from chatgpt.com.
- Key events in AI-referred sessions: whatsapp_click 10 (interactions, not leads), buy_request_submitted 1.
- AI landing pages: `/` 5, `/guides/el-shorouk/prices-2026` 5, `/apartments-for-sale/new-cairo` 4, Madinaty guide 2, Madinaty/Fifth listings 2 each.
- Daily: 0 AI sessions on 11-15 and 11-16, 5 on 11-17 (highest day). 11-17 may still be incomplete (GA lag 24–48 h). No trend claim from 13 days.

## Search Console — `REPORT/gsc/2026-11-18-pull.json`
- Data available 11-14..11-16: 364 impressions, 1 click; El Shorouk guide 253 impressions (avg pos 7.3), Madinaty guide 64, Sheikh Zayed guide 19.
- Re-crawled after the #50 deploy: `/how-it-works`, `/before-you-pay` (2026-11-16 12:13 UTC), `/` (11-17). Not re-crawled since early Nov: Madinaty, El Shorouk guides, contract checklist.
