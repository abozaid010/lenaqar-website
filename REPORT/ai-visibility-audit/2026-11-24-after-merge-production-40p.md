# LLM Visibility Report: https://www.lenaqar.com

Audited 2026-11-24 14:12 UTC, tool v1.0

## Score: 40.0 / 100 (D - Weak, provisional)

_Technical readiness only. It does not measure whether assistants actually cite this site; confirm with real test prompts._

- On-site (automated): 53.4 / 70 (76.3%)
- Off-site (manual): not evaluated, run with --offsite

**Provisional:** the score is scaled to the evidence available; unchecked items are not counted as failures.

**Critical issues (score capped at 40):** A major search bot is blocked in robots.txt

## Checks

| Pillar | Check | Points | Detail |
| --- | --- | --- | --- |
| A | A1 robots.txt reachable | 1 / 1 | HTTP 200 |
| A | A2 AI search bots allowed (OAI-SearchBot, Claude-SearchBot, Googlebot, Bingbot, PerplexityBot) | 0.0 / 10 | blocked: OAI-SearchBot (7/41 pages), Claude-SearchBot (7/41 pages), Googlebot (7/41 pages), Bingbot (7/41 pages), PerplexityBot (7/41 pages) |
| A | A3 User-request fetchers allowed (ChatGPT-User, Claude-User) | 0.0 / 2 | blocked: ChatGPT-User (7/41 pages), Claude-User (7/41 pages) |
| A | A4 Training bots allowed (GPTBot, ClaudeBot, Google-Extended, CCBot) | 0.0 / 2 | blocked: GPTBot (7/41 pages), ClaudeBot (7/41 pages), Google-Extended (7/41 pages), CCBot (7/41 pages) |
| A | A5 XML sitemap declared and readable | 2 / 2 | 1370 URLs; declared in robots.txt: True |
| A | A6 Server/CDN does not refuse AI user agents | 3 / 3 | user-agent probe only (cannot reproduce vendor IP ranges); refused: none; inconclusive: none |
| B | B1 Homepage returns 200 over HTTPS | 2 / 2 | HTTP 200, https=True, 0.3s |
| B | B2 Homepage has real text in raw HTML (>=300 words) | 5 / 5 | 625 words without JavaScript |
| B | B3 Inner pages have >=200 words in raw HTML | 6.0 / 6 | 40/40 sampled pages |
| B | B4 No noindex / nosnippet / max-snippet:0 (meta or X-Robots-Tag) on sampled pages | 2 / 2 | 0 page(s) restricted |
| C | C1 Unique descriptive <title> (10-70 chars) | 1.95 / 2 | 97% of pages |
| C | C2 Unique meta description (50-170 chars) | 1.66 / 2 | 82% of pages |
| C | C3 Exactly one H1 per page | 2.0 / 2 | 100% of pages |
| C | C4 Sectioned with >=3 H2/H3 headings | 1.95 / 2 | 97% of pages |
| C | C5 Canonical URL on this site | 1.0 / 1 | 100% of pages |
| C | C6 <html lang> declared | 1 / 1 | lang='ar-EG' |
| C | C7 Concrete facts: >=15 numbers per page on average (prices, sizes, dates) | 3.0 / 3 | 25.1 numbers per page |
| C | C8 Open Graph title + description | 2.0 / 2 | 100% of pages |
| D | D1 Valid JSON-LD present | 2 / 2 | 41/41 pages |
| D | D2 Organization / LocalBusiness / RealEstateAgent entity | 3 / 3 | types: accommodation, aggregateoffer, answer, article, breadcrumblist, contactpoint, country, faqpage, howto, howtostep, imageobject, listitem, localbusiness, offer, organization, place, postaladdress, propertyvalue, quantitativevalue, question, realestatelisting, webpage, website |
| D | D3 Content schema on inner pages (Offer, Residence, Article, FAQPage, ItemList ...) | 3 / 3 | types: accommodation, aggregateoffer, answer, article, breadcrumblist, contactpoint, country, faqpage, howto, howtostep, imageobject, listitem, localbusiness, offer, organization, place, postaladdress, propertyvalue, quantitativevalue, question, realestatelisting, webpage, website |
| D | D4 BreadcrumbList | 2 / 2 |  |
| E | E1 Sitemap URLs carry a valid <lastmod> | 3.0 / 3 | 100% of URLs |
| E | E2 Site updated in the last 30 days (newest lastmod) | 3 / 3 | newest lastmod: 2026-11-24 |
| E | E3 Pages expose valid dates (dateModified/datePublished, <time datetime>, article:modified_time) | 1.85 / 4 | 46% of pages |

## What is missing (biggest gains first)

- [ ] **+10.0 pts** AI search bots allowed (OAI-SearchBot, Claude-SearchBot, Googlebot, Bingbot, PerplexityBot): Remove Disallow rules for: OAI-SearchBot, Claude-SearchBot, Googlebot, Bingbot, PerplexityBot
- [ ] **+2.1 pts** Pages expose valid dates (dateModified/datePublished, <time datetime>, article:modified_time): Show 'Last updated <date>' in a <time datetime> tag and dateModified in JSON-LD on price/listing pages.
- [ ] **+2.0 pts** User-request fetchers allowed (ChatGPT-User, Claude-User): Allow: ChatGPT-User, Claude-User
- [ ] **+2.0 pts** Training bots allowed (GPTBot, ClaudeBot, Google-Extended, CCBot): Optional business choice. Allowing them helps future models know your brand: GPTBot, ClaudeBot, Google-Extended, CCBot
- [ ] **+0.3 pts** Unique meta description (50-170 chars): Add a factual, unique meta description per page; search engines show it as the snippet AI reads first.
- [ ] **+0.1 pts** Unique descriptive <title> (10-70 chars): Give every page a unique title naming the place/product and the brand.
- [ ] **+0.1 pts** Sectioned with >=3 H2/H3 headings: Use headings that mirror buyer questions (e.g. 'Apartment prices in Madinaty 2026').

## Not evaluated (off-site)

- Indexed in Google
- Indexed in Bing (feeds ChatGPT)
- Indexed in Brave (feeds Claude)
- Brand mentioned on 5+ independent sites
- Brand present on YouTube
- Entity profiles (Google Business Profile, LinkedIn, Crunchbase/Wikidata)
- Cited by at least one assistant on test prompts

## Pages audited

- https://www.lenaqar.com (HTTP 200)
- https://www.lenaqar.com/how-it-works (HTTP 200)
- https://www.lenaqar.com/no-calls (HTTP 200)
- https://www.lenaqar.com/verified-prices (HTTP 200)
- https://www.lenaqar.com/before-you-pay (HTTP 200)
- https://www.lenaqar.com/delivery-delays (HTTP 200)
- https://www.lenaqar.com/opportunities/L42vRnfD (HTTP 200)
- https://www.lenaqar.com/guides/madinaty/prices-2026 (HTTP 200)
- https://www.lenaqar.com/sell (HTTP 200)
- https://www.lenaqar.com/calculator (HTTP 200)
- https://www.lenaqar.com/privacy (HTTP 200)
- https://www.lenaqar.com/network (HTTP 200)
- https://www.lenaqar.com/apartments-for-sale/noor-city (HTTP 200)
- https://www.lenaqar.com/chalets-for-sale/north-coast (HTTP 200)
- https://www.lenaqar.com/ready-to-move-properties (HTTP 200)
- https://www.lenaqar.com/villas-for-sale/egypt (HTTP 200)
- https://www.lenaqar.com/projects/carnelia (HTTP 200; robots-blocked: OAI-SearchBot, Claude-SearchBot, Googlebot, Bingbot, PerplexityBot)
- https://www.lenaqar.com/opportunities/xsZOwXgu (HTTP 200)
- https://www.lenaqar.com/guides/buying/how-to-write-property-request (HTTP 200)
- https://www.lenaqar.com/apartments-for-sale/fifth-settlement (HTTP 200)
- https://www.lenaqar.com/projects/sky-ramp (HTTP 200; robots-blocked: OAI-SearchBot, Claude-SearchBot, Googlebot, Bingbot, PerplexityBot)
- https://www.lenaqar.com/opportunities/88EtuMuf (HTTP 200)
- https://www.lenaqar.com/guides/new-cairo/red-file (HTTP 200)
- https://www.lenaqar.com/apartments-for-sale/sheikh-zayed (HTTP 200)
- https://www.lenaqar.com/projects/dr5-medical-center (HTTP 200; robots-blocked: OAI-SearchBot, Claude-SearchBot, Googlebot, Bingbot, PerplexityBot)
- https://www.lenaqar.com/opportunities/8QC9Bdrc (HTTP 200)
- https://www.lenaqar.com/guides/fifth-settlement (HTTP 200)
- https://www.lenaqar.com/apartments-for-sale/el-shorouk (HTTP 200)
- https://www.lenaqar.com/projects/palm-hills-alexandria (HTTP 200; robots-blocked: OAI-SearchBot, Claude-SearchBot, Googlebot, Bingbot, PerplexityBot)
- https://www.lenaqar.com/opportunities/5HRMWBNX (HTTP 200)
- https://www.lenaqar.com/guides/6th-of-october/prices-2026 (HTTP 200)
- https://www.lenaqar.com/apartments-for-sale/new-cairo (HTTP 200)
- https://www.lenaqar.com/projects/saada-boutique (HTTP 200; robots-blocked: OAI-SearchBot, Claude-SearchBot, Googlebot, Bingbot, PerplexityBot)
- https://www.lenaqar.com/opportunities/T3k6oHWY (HTTP 200)
- https://www.lenaqar.com/guides/mostakbal-city/prices-2026 (HTTP 200)
- https://www.lenaqar.com/apartments-for-sale/new-administrative-capital (HTTP 200)
- https://www.lenaqar.com/projects/kukun (HTTP 200; robots-blocked: OAI-SearchBot, Claude-SearchBot, Googlebot, Bingbot, PerplexityBot)
- https://www.lenaqar.com/opportunities/BAEHkb9P (HTTP 200)
- https://www.lenaqar.com/guides/el-shorouk (HTTP 200)
- https://www.lenaqar.com/apartments-for-sale/madinaty (HTTP 200)
- https://www.lenaqar.com/projects/kasakuon (HTTP 200; robots-blocked: OAI-SearchBot, Claude-SearchBot, Googlebot, Bingbot, PerplexityBot)
