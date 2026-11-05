# Ads, UTM & conversion readiness (buyer-first)

**Last updated:** 2026-11-05  
**Primary conversion:** WhatsApp click (`whatsapp_click` / Meta `Contact`). **Quality conversion:** `buy_request_submitted` / Meta `Lead`.

## Event map

The full event taxonomy (names, params, `cta_location` vocabulary, GA4 and Meta setup) lives in [`analytics-event-tracking-plan.md`](./analytics-event-tracking-plan.md) §3 and §9 — do not duplicate it here.

In short: judge ads by cost per `Contact` **and** cost per `Lead`, not by link clicks. Share links (`wa.me/?text=…`) are never conversions. Supply-side WhatsApp clicks carry `cta_intent=sell` and must not be treated as buyer acquisition.

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

## Meta Ads Manager URL parameters

On every ad, in the **URL parameters** field (names lowercase, no spaces):

```
utm_source=meta&utm_medium=paid_social&utm_campaign={{campaign.name}}&utm_content={{ad.name}}&utm_term={{adset.name}}
```

## Suggested first experiments (limited budget)

1. **Google Search — New Cairo apartments** → land on `/apartments-for-sale/new-cairo`
2. **Google Search — North Coast chalets** → land on `/chalets-for-sale/north-coast`
3. **Meta — buyer-first concept** → land on `/` or `/how-it-works`

Measure: cost per `whatsapp_click` / Meta Contact and cost per `buy_request_submitted` / Meta Lead, then qualified-request rate in CRM when defined.

## Landing-page rules

- Ad location/type must match the page.
- Primary CTA = write buyer request (above the fold).
- No guaranteed match, fake availability, or unverified “no cold calls” claims.
- Prefer strategy copy in `docs/lenaqar_marketing_seo_ads_strategy.md` §9.
