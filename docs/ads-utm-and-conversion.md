# Ads, UTM & conversion readiness (buyer-first)

**Last updated:** 2026-10-14  
**Primary conversion:** successful buyer request submit (`buy_request_submitted` + Meta `Lead`)  
**Do not optimize solely for clicks or WhatsApp taps.**

## Event map

| Event | Where | Ads use |
|---|---|---|
| `buy_request_opened` | Buy request CTA / `#buy-request` | Funnel start |
| `buy_request_submitted` | After successful save | **Primary** GA conversion |
| Meta `Lead` | Same success path (no PII) | **Primary** Meta conversion |
| Meta `ViewContent` | `/`, `/how-it-works`, `/opportunities`, landings, `/guides` | Consideration |
| Meta `Contact` | WhatsApp link clicks | Secondary only |
| `buyer_whatsapp_clicked` | Opportunity unit WhatsApp | Secondary |
| `marketplace_whatsapp_clicked` / `seller_whatsapp_clicked` | Supply-side | Do not treat as buyer acquisition |

## UTM convention

Lowercase, no personal data:

```
utm_source=google|meta|newsletter
utm_medium=cpc|paid_social|organic_social|email
utm_campaign=eg_<area>_<property>_buyer
utm_content=<creative_or_headline_id>
utm_term={keyword}   # Search only, when appropriate
```

Examples:

- `?utm_source=google&utm_medium=cpc&utm_campaign=eg_new_cairo_apartments&utm_content=buyer_first_a`
- `?utm_source=meta&utm_medium=paid_social&utm_campaign=eg_buyer_first_concept&utm_content=problem_solution_v1`

## Suggested first experiments (limited budget)

1. **Google Search — New Cairo apartments** → land on `/apartments-for-sale/new-cairo`
2. **Google Search — North Coast chalets** → land on `/chalets-for-sale/north-coast`
3. **Meta — buyer-first concept** → land on `/` or `/how-it-works`

Measure: cost per `buy_request_submitted` / Meta Lead, then qualified-request rate in CRM when defined.

## Landing-page rules

- Ad location/type must match the page.
- Primary CTA = write buyer request (above the fold).
- No guaranteed match, fake availability, or unverified “no cold calls” claims.
- Prefer strategy copy in `docs/lenaqar_marketing_seo_ads_strategy.md` §9.
