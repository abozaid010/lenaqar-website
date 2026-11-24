# LLM Visibility Report: https://www.lenaqar.com

Audited 2026-11-24 11:48 UTC, tool v1.0

## Score: 94.3 / 100 (A - Excellent, provisional)

_Technical readiness only. It does not measure whether assistants actually cite this site; confirm with real test prompts._

- On-site (automated): 66.0 / 70 (94.3%)
- Off-site (manual): not evaluated, run with --offsite

**Provisional:** the score is scaled to the evidence available; unchecked items are not counted as failures.

## Checks

| Pillar | Check | Points | Detail |
| --- | --- | --- | --- |
| A | A1 robots.txt reachable | 1 / 1 | HTTP 200 |
| A | A2 AI search bots allowed (OAI-SearchBot, Claude-SearchBot, Googlebot, Bingbot, PerplexityBot) | 10 / 10 | blocked: none |
| A | A3 User-request fetchers allowed (ChatGPT-User, Claude-User) | 2 / 2 | blocked: none |
| A | A4 Training bots allowed (GPTBot, ClaudeBot, Google-Extended, CCBot) | 2.0 / 2 | blocked: none |
| A | A5 XML sitemap declared and readable | 2 / 2 | 898 URLs; declared in robots.txt: True |
| A | A6 Server/CDN does not refuse AI user agents | 3 / 3 | user-agent probe only (cannot reproduce vendor IP ranges); refused: none; inconclusive: none |
| B | B1 Homepage returns 200 over HTTPS | 2 / 2 | HTTP 200, https=True, 0.3s |
| B | B2 Homepage has real text in raw HTML (>=300 words) | 5 / 5 | 623 words without JavaScript |
| B | B3 Inner pages have >=200 words in raw HTML | 6.0 / 6 | 15/15 sampled pages |
| B | B4 No noindex / nosnippet / max-snippet:0 (meta or X-Robots-Tag) on sampled pages | 2 / 2 | 0 page(s) restricted |
| C | C1 Unique descriptive <title> (10-70 chars) | 2.0 / 2 | 100% of pages |
| C | C2 Unique meta description (50-170 chars) | 2.0 / 2 | 100% of pages |
| C | C3 Exactly one H1 per page | 2.0 / 2 | 100% of pages |
| C | C4 Sectioned with >=3 H2/H3 headings | 1.75 / 2 | 87% of pages |
| C | C5 Canonical URL on this site | 1.0 / 1 | 100% of pages |
| C | C6 <html lang> declared | 1 / 1 | lang='ar-EG' |
| C | C7 Concrete facts: >=15 numbers per page on average (prices, sizes, dates) | 3.0 / 3 | 18.1 numbers per page |
| C | C8 Open Graph title + description | 2.0 / 2 | 100% of pages |
| D | D1 Valid JSON-LD present | 2 / 2 | 16/16 pages |
| D | D2 Organization / LocalBusiness / RealEstateAgent entity | 3 / 3 | types: accommodation, answer, article, breadcrumblist, contactpoint, country, faqpage, howto, howtostep, imageobject, listitem, localbusiness, offer, organization, place, postaladdress, propertyvalue, quantitativevalue, question, realestatelisting, website |
| D | D3 Content schema on inner pages (Offer, Residence, Article, FAQPage, ItemList ...) | 3 / 3 | types: accommodation, answer, article, breadcrumblist, contactpoint, country, faqpage, howto, howtostep, imageobject, listitem, localbusiness, offer, organization, place, postaladdress, propertyvalue, quantitativevalue, question, realestatelisting, website |
| D | D4 BreadcrumbList | 2 / 2 |  |
| E | E1 Sitemap URLs carry a valid <lastmod> | 3.0 / 3 | 100% of URLs |
| E | E2 Site updated in the last 30 days (newest lastmod) | 3 / 3 | newest lastmod: 2026-11-19 |
| E | E3 Pages expose valid dates (dateModified/datePublished, <time datetime>, article:modified_time) | 0.25 / 4 | 6% of pages |

## What is missing (biggest gains first)

- [ ] **+3.8 pts** Pages expose valid dates (dateModified/datePublished, <time datetime>, article:modified_time): Show 'Last updated <date>' in a <time datetime> tag and dateModified in JSON-LD on price/listing pages.
- [ ] **+0.2 pts** Sectioned with >=3 H2/H3 headings: Use headings that mirror buyer questions (e.g. 'Apartment prices in Madinaty 2026').

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
- https://www.lenaqar.com/opportunities/ljRe18sT (HTTP 200)
- https://www.lenaqar.com/guides/madinaty/prices-2026 (HTTP 200)
- https://www.lenaqar.com/sell (HTTP 200)
- https://www.lenaqar.com/calculator (HTTP 200)
- https://www.lenaqar.com/privacy (HTTP 200)
- https://www.lenaqar.com/network (HTTP 200)
- https://www.lenaqar.com/apartments-for-sale/noor-city (HTTP 200)
- https://www.lenaqar.com/chalets-for-sale/north-coast (HTTP 200)
- https://www.lenaqar.com/ready-to-move-properties (HTTP 200)
- https://www.lenaqar.com/villas-for-sale/egypt (HTTP 200)
