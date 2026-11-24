# LLM Visibility Report: http://localhost:3000

Audited 2026-11-24 12:40 UTC, tool v1.0

## Score: 95.1 / 100 (A - Excellent, provisional)

_Technical readiness only. It does not measure whether assistants actually cite this site; confirm with real test prompts._

- On-site (automated): 66.6 / 70 (95.1%)
- Off-site (manual): not evaluated, run with --offsite

**Provisional:** the score is scaled to the evidence available; unchecked items are not counted as failures.

## Checks

| Pillar | Check | Points | Detail |
| --- | --- | --- | --- |
| A | A1 robots.txt reachable | 1 / 1 | HTTP 200 |
| A | A2 AI search bots allowed (OAI-SearchBot, Claude-SearchBot, Googlebot, Bingbot, PerplexityBot) | 10 / 10 | blocked: none |
| A | A3 User-request fetchers allowed (ChatGPT-User, Claude-User) | 2 / 2 | blocked: none |
| A | A4 Training bots allowed (GPTBot, ClaudeBot, Google-Extended, CCBot) | 2.0 / 2 | blocked: none |
| A | A5 XML sitemap declared and readable | 2 / 2 | 935 URLs; declared in robots.txt: True |
| A | A6 Server/CDN does not refuse AI user agents | 3 / 3 | user-agent probe only (cannot reproduce vendor IP ranges); refused: none; inconclusive: none |
| B | B1 Homepage returns 200 over HTTPS | 1 / 2 | HTTP 200, https=False, 0.0s |
| B | B2 Homepage has real text in raw HTML (>=300 words) | 5 / 5 | 608 words without JavaScript |
| B | B3 Inner pages have >=200 words in raw HTML | 6.0 / 6 | 40/40 sampled pages |
| B | B4 No noindex / nosnippet / max-snippet:0 (meta or X-Robots-Tag) on sampled pages | 2 / 2 | 0 page(s) restricted |
| C | C1 Unique descriptive <title> (10-70 chars) | 1.95 / 2 | 97% of pages |
| C | C2 Unique meta description (50-170 chars) | 2.0 / 2 | 100% of pages |
| C | C3 Exactly one H1 per page | 2.0 / 2 | 100% of pages |
| C | C4 Sectioned with >=3 H2/H3 headings | 1.95 / 2 | 97% of pages |
| C | C5 Canonical URL on this site | 1.0 / 1 | 100% of pages |
| C | C6 <html lang> declared | 1 / 1 | lang='ar-EG' |
| C | C7 Concrete facts: >=15 numbers per page on average (prices, sizes, dates) | 3.0 / 3 | 23.8 numbers per page |
| C | C8 Open Graph title + description | 2.0 / 2 | 100% of pages |
| D | D1 Valid JSON-LD present | 2 / 2 | 41/41 pages |
| D | D2 Organization / LocalBusiness / RealEstateAgent entity | 3 / 3 | types: accommodation, answer, article, breadcrumblist, contactpoint, country, faqpage, howto, howtostep, imageobject, listitem, localbusiness, offer, organization, place, postaladdress, propertyvalue, quantitativevalue, question, realestatelisting, website |
| D | D3 Content schema on inner pages (Offer, Residence, Article, FAQPage, ItemList ...) | 3 / 3 | types: accommodation, answer, article, breadcrumblist, contactpoint, country, faqpage, howto, howtostep, imageobject, listitem, localbusiness, offer, organization, place, postaladdress, propertyvalue, quantitativevalue, question, realestatelisting, website |
| D | D4 BreadcrumbList | 2 / 2 |  |
| E | E1 Sitemap URLs carry a valid <lastmod> | 3.0 / 3 | 100% of URLs |
| E | E2 Site updated in the last 30 days (newest lastmod) | 3 / 3 | newest lastmod: 2026-11-24 |
| E | E3 Pages expose valid dates (dateModified/datePublished, <time datetime>, article:modified_time) | 1.66 / 4 | 41% of pages |

## What is missing (biggest gains first)

- [ ] **+2.3 pts** Pages expose valid dates (dateModified/datePublished, <time datetime>, article:modified_time): Show 'Last updated <date>' in a <time datetime> tag and dateModified in JSON-LD on price/listing pages.
- [ ] **+1 pts** Homepage returns 200 over HTTPS: Serve the homepage with HTTP 200 over HTTPS.
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

- http://localhost:3000 (HTTP 200)
- http://localhost:3000/how-it-works (HTTP 200)
- http://localhost:3000/no-calls (HTTP 200)
- http://localhost:3000/verified-prices (HTTP 200)
- http://localhost:3000/before-you-pay (HTTP 200)
- http://localhost:3000/delivery-delays (HTTP 200)
- http://localhost:3000/opportunities/tUU2mR87 (HTTP 200)
- http://localhost:3000/guides/madinaty/prices-2026 (HTTP 200)
- http://localhost:3000/sell (HTTP 200)
- http://localhost:3000/calculator (HTTP 200)
- http://localhost:3000/privacy (HTTP 200)
- http://localhost:3000/network (HTTP 200)
- http://localhost:3000/apartments-for-sale/noor-city (HTTP 200)
- http://localhost:3000/chalets-for-sale/north-coast (HTTP 200)
- http://localhost:3000/ready-to-move-properties (HTTP 200)
- http://localhost:3000/villas-for-sale/egypt (HTTP 200)
- http://localhost:3000/opportunities/Qbdba1hh (HTTP 200)
- http://localhost:3000/guides/buying/how-to-write-property-request (HTTP 200)
- http://localhost:3000/apartments-for-sale/fifth-settlement (HTTP 200)
- http://localhost:3000/opportunities/vrbDVP1C (HTTP 200)
- http://localhost:3000/guides/new-cairo/red-file (HTTP 200)
- http://localhost:3000/apartments-for-sale/sheikh-zayed (HTTP 200)
- http://localhost:3000/opportunities/8QC9Bdrc (HTTP 200)
- http://localhost:3000/guides/fifth-settlement (HTTP 200)
- http://localhost:3000/apartments-for-sale/el-shorouk (HTTP 200)
- http://localhost:3000/opportunities/5HRMWBNX (HTTP 200)
- http://localhost:3000/guides/6th-of-october/prices-2026 (HTTP 200)
- http://localhost:3000/apartments-for-sale/new-cairo (HTTP 200)
- http://localhost:3000/opportunities/ILF4IjzC (HTTP 200)
- http://localhost:3000/guides/mostakbal-city/prices-2026 (HTTP 200)
- http://localhost:3000/apartments-for-sale/new-administrative-capital (HTTP 200)
- http://localhost:3000/opportunities/c1IDxeRM (HTTP 200)
- http://localhost:3000/guides/el-shorouk (HTTP 200)
- http://localhost:3000/apartments-for-sale/madinaty (HTTP 200)
- http://localhost:3000/opportunities/it7bveFq (HTTP 200)
- http://localhost:3000/guides/sheikh-zayed/real-units (HTTP 200)
- http://localhost:3000/apartments-for-sale/6th-of-october (HTTP 200)
- http://localhost:3000/opportunities/EfALCbHk (HTTP 200)
- http://localhost:3000/guides/madinaty/budget-4m (HTTP 200)
- http://localhost:3000/apartments-for-sale/mostakbal-city (HTTP 200)
- http://localhost:3000/opportunities/iHWV5Ifr (HTTP 200)
