# Off-site checklist and drafts (2026-11-24)

Nothing here has been sent, posted or created. Abozaid does every external action. This file builds on `docs/ai-visibility/corroboration-plan.md` (audit, C1–C6) and does not replace it. No ranking, citation or inclusion is promised.

Name rule from the corroboration audit: always write «لينا عقار — منصة عقارية» or "LenAqar (lenaqar.com)", never the bare Arabic name (it collides with the Leena Springs compound).

## 1. Indexing checks

| Engine | Why | Exact check | Status today |
| --- | --- | --- | --- |
| Google | Feeds Gemini and Google AI | Search Console → property `https://www.lenaqar.com/` → Sitemaps: `sitemap.xml` shows "Success" and 898 discovered URLs. Pages → note "Indexed" and "Not indexed" counts. Then search `site:lenaqar.com` and `site:lenaqar.com/opportunities` | Home, `/how-it-works`: "Submitted and indexed" (API, 2026-11-18). Indexed count: unknown. The API login expired on 2026-11-24 (401) |
| Bing | Feeds ChatGPT search and Copilot | bing.com/webmasters → add `https://www.lenaqar.com/` (import from Search Console is the fastest) → Sitemaps → submit `https://www.lenaqar.com/sitemap.xml`. Then search `site:lenaqar.com` on bing.com | Not checked (tracker B13) |
| IndexNow | Faster Bing recrawl | In Bing Webmaster → IndexNow → generate key. Send the key file name to the assistant; the key file and a ping on publish are a small code change, not done yet | Not set up |
| Brave | Feeds Claude web search | search.brave.com → `site:lenaqar.com`, then `"lenaqar"` and `"لينا عقار" منصة عقارية`. Note how many results are lenaqar.com pages | Not checked |

To refresh the API login: `CLOUDSDK_CONFIG=$HOME/.config/gcloud-lenaqar gcloud auth application-default login --scopes=https://www.googleapis.com/auth/analytics.readonly,https://www.googleapis.com/auth/webmasters.readonly,https://www.googleapis.com/auth/cloud-platform`

## 2. Entity profiles (same name, address and phone everywhere)

Master record (from `public/llms.txt`, the site's own source):

| Field | Value |
| --- | --- |
| Name (Arabic) | لينا عقار |
| Name (Latin) | LenAqar |
| Website | https://www.lenaqar.com |
| Parent company | Propteches |
| Address | 505 ARCHPLAN Square، العاصمة الإدارية، القاهرة، مصر |
| Phone / WhatsApp (buyers and sellers) | +201002891933 |
| Category | Real estate agency / property marketplace (resale and developer units, Egypt) |
| Service area | As set on the Google Business Profile (2026-11-16): New Cairo, Madinaty, El Shorouk, New Administrative Capital, 6th of October, Sheikh Zayed |
| Founding date | unknown |
| Legal entity name and registration number | unknown |
| Founder name to publish | unknown (needs owner approval) |
| Opening hours | unknown |
| Logo file | `public/images/default_logo.jpg` |

Draft description, Arabic (use on all profiles):

> لينا عقار — منصة عقارية في مصر لشراء وبيع الوحدات الريسيل ووحدات المطورين. المشتري بيكتب طلبه (المنطقة، الميزانية، عدد الغرف) وبنرشّح له وحدات مناسبة، مع أسعار طلب معروضة بتاريخها ومراجعة قانونية لورق وحدة الريسيل قبل الدفع. التواصل على واتساب، ومش بنتصل إلا لو العميل طلب. العمولة 2.5% على المشتري و2.5% على البائع من سعر البيع النهائي.

Draft description, English:

> LenAqar (lenaqar.com) is an Egyptian property marketplace for resale and developer units. Buyers write a request (area, budget, rooms) and get matching units, dated asking prices and a legal review of a resale unit's papers before paying. Contact is by WhatsApp; no cold calls. Commission is 2.5% from the buyer and 2.5% from the seller on the final sale price.

| Profile | State | What to do |
| --- | --- | --- |
| Google Business Profile | Created 2026-11-16, video verification pending (tracker B25) | Finish verification. Name, address and phone exactly as above |
| LinkedIn company page | Exists (`linkedin.com/company/142683910`) | Paste the descriptions; add website, address, phone |
| Facebook, Instagram, TikTok | Exist (listed in `sameAs`) | Same name, link and phone; add the Arabic description |
| YouTube channel | unknown | Create only if section 4 videos go ahead |
| Crunchbase | unknown | Free organisation profile under the parent or the brand; needs founding date and founder |
| Wikidata | Not recommended yet | Wikidata needs independent sources. Create an item only after 2–3 independent articles exist |

## 3. Third-party mentions: 10 targets

"Reachable" = the site answered on 2026-11-24. It does not mean they accept submissions. No contact names are listed because none were verified.

| # | Site | Type | Reachable | Fit |
| --- | --- | --- | --- | --- |
| 1 | invest-gate.me | Egyptian real-estate news and research | yes (200) | Data pitch |
| 2 | almalnews.com | Business daily with a real-estate section | yes (200) | Data pitch |
| 3 | amwalalghad.com | Business news | yes (200) | Data pitch |
| 4 | dailynewsegypt.com | English business daily | yes (200) | Data pitch (English) |
| 5 | hapijournal.com | Business news | yes (200) | Data pitch |
| 6 | enterpriseam.com/egypt (Enterprise) | Business newsletter | yes (200) | Short data note |
| 7 | wamda.com | MENA startup media | yes (200) | Startup story |
| 8 | menabytes.com | MENA startup media | yes (200) | Startup story |
| 9 | f6s.com / crunchbase.com | Startup directories | yes (200) | Free profile (section 2) |
| 10 | reddit.com/r/Egypt | Community | yes (200) | Answer real questions only; no promotion posts |

Unverified, check by hand before use: alborsaanews.com (no response), yellowpages.com.eg (403 to scripts), magnitt.com (403 to scripts). Portals such as Aqarmap, Property Finder and Bayut are competitors, not mention targets.

**Pitch A — data note for property and business press (Arabic email):**

> الموضوع: وسيط سعر متر الشقق الريسيل في مدينتي والتجمع والقاهرة الجديدة والشروق — [الشهر والسنة]
>
> أهلًا [الاسم]،
> لينا عقار (lenaqar.com) منصة عقارية بتنشر شهريًا وسيط سعر المتر وعدد الإعلانات لشقق الريسيل في أربع مناطق، محسوبة من إعلانات منشورة على المنصة، مع طريقة الحساب وتاريخ الرصد. الأرقام أسعار طلب من البائعين، مش أسعار بيع نهائية.
> أرقام [التاريخ]: مدينتي [الرقم] ج.م/م² من [العدد] إعلان، التجمع الخامس [الرقم] من [العدد]، القاهرة الجديدة [الرقم] من [العدد]، الشروق [الرقم] من [العدد].
> الجداول الكاملة: https://www.lenaqar.com/guides
> لو الأرقام تفيدك في تقرير، نبعت لك الملف وطريقة الحساب، ونرد على أي سؤال.
> [الاسم] — لينا عقار — واتساب +201002891933

**Pitch B — startup media (Arabic or English, short):**

> الموضوع: لينا عقار — المشتري بيكتب طلبه بدل ما يلف على الإعلانات
>
> أهلًا [الاسم]،
> لينا عقار منصة مصرية بتبدأ من طلب المشتري: يكتب المنطقة والميزانية وعدد الغرف، والمنصة ترشّح وحدات ريسيل ووحدات مطورين مناسبة، مع أسعار طلب بتاريخها ومراجعة قانونية لورق وحدة الريسيل. [رقم حقيقي واحد يختاره المالك: عدد الطلبات أو الوحدات، بتاريخه].
> نحب نحكي لكم إزاي بنشتغل وإيه اللي اتعلمناه من طلبات المشترين. الموقع: https://www.lenaqar.com
> [الاسم] — [الصفة]

**Pitch C — communities and forums (rule, not a template):** answer a real question with a useful, complete answer; add one relevant LenAqar link only when it answers the question (for example the contract checklist); say you work at LenAqar. No copy-paste posts.

## 4. YouTube: 5 video outlines

Numbers below were read from the live guide pages on 2026-11-24. They change when listings change, so read the page again on recording day and say the date on camera. All are asking prices from listings on LenAqar, not sale prices.

| # | Arabic title | Numbers to show (2026-11-24) | Source page |
| --- | --- | --- | --- |
| 1 | سعر متر الشقق الريسيل في مدينتي — أرقام لينا عقار | Median 71,636 EGP/m² from 140 listings; median apartment 8,027,500 EGP; 2 rooms 69,810 (52 listings); 3 rooms 73,335 (84) | `/guides/madinaty/prices-2026` |
| 2 | التجمع الخامس: سعر المتر الريسيل وليه بيختلف من شقة لشقة | Median 36,866 EGP/m² from 139 listings; median apartment 6,500,000 EGP; usual range 2,750,000–15,000,000 | `/guides/fifth-settlement/prices-2026` |
| 3 | القاهرة الجديدة كلها: الشقة الريسيل بكام؟ | Median 54,741 EGP/m² from 343 listings; median apartment 7,165,000 EGP; 3 rooms 54,167 (215) | `/guides/new-cairo/prices-2026` |
| 4 | الشروق: شقة ريسيل ٣ غرف بكام؟ | Median 23,077 EGP/m² from 35 listings; median apartment 4,400,000 EGP; 3 rooms 23,333 (31) | `/guides/el-shorouk/prices-2026` |
| 5 | قبل ما تدفع عربون في شقة ريسيل: الورق اللي لازم تشوفه | No prices. Follow the checklist page step by step | `/guides/buying/contract-registration-checklist`, `/before-you-pay` |

Shape of each video (3–5 minutes): the question in one sentence → the number with its sample size and date → what moves the price up or down (from the guide text only) → what the number does not tell you (asking, not sold) → where to see the table.

Description template:

> [عنوان الفيديو] — أرقام لينا عقار بتاريخ [التاريخ].
> الأرقام أسعار طلب من إعلانات ريسيل منشورة على لينا عقار (وسيط، عدد الإعلانات، التاريخ) — مش أسعار بيع نهائية.
> الجدول الكامل وطريقة الحساب: [رابط الصفحة]
> اكتب طلبك: https://www.lenaqar.com — واتساب +201002891933
> لينا عقار — منصة عقارية في مصر (LenAqar, lenaqar.com)

## 5. Citation benchmark (monthly)

- Template: `docs/ai-visibility/citation-benchmark-template.csv` (45 rows: 15 prompts × ChatGPT, Claude, Gemini).
- Prompts 1–12 are the frozen panel `docs/ai-visibility/panel-v1.json` (N01–N12), unchanged, so months stay comparable with round 1 (2026-11-15: mention 0/72, citation 2/72, recommendation 0/72).
- Prompts 13–15 are extra (one buyer area × budget, two seller). Report them separately; they are not part of the frozen panel.
- Settings as in round 1: ChatGPT temporary chat, Claude incognito with a clean account, Gemini temporary chat. One fresh chat per prompt.
- Fill: date, model name shown in the app, mentioned y/n, lenaqar.com link cited y/n, competitors cited, accuracy of what is said about LenAqar (y/n/n.a.), notes.

## 6. After the checks

1. Edit `docs/ai-visibility/offsite.json`: `true`, `false`, or `null` for not checked.
2. Run: `make -C /Users/abozaid/workspace/ai_visibity_judge audit URL=https://www.lenaqar.com PAGES=40 OFFSITE=/Users/abozaid/workspace/lenaqar/docs/ai-visibility/offsite.json`
3. Record the result in `ai-visibility-feature-progress.json`.

Values set today, each with dated evidence; everything else is `null`:

| Key | Value | Evidence |
| --- | --- | --- |
| `indexed_google` | `true` | Search Console URL inspection, 2026-11-18: home and `/how-it-works` "Submitted and indexed" |
| `brand_mentions_5plus_sites` | `false` | Corroboration audit 2026-11-15: no independent mentions found |
| `cited_in_test_prompts` | `true` | Panel round 1, 2026-11-15: ChatGPT cited lenaqar.com in 2 of 72 answers |
