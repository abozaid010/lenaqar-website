## Buyer Guide (دليل المشتري)

Markdown articles live in `content/guides/`. Status workflow: `draft` → `needs_numbers` → `in_review` → `approved` → `scheduled` → `published`.

- Public hub: `/guides/`
- Preview (noindex): `/internal/guides/...?token=` and `/internal/content-status?token=` — set `GUIDES_PREVIEW_TOKEN`, or open without a token in development only.
- Editorial table: `CONTENT_STATUS.md` — refresh with `npm run guides:sync-status` (also writes `website` fields into `broker-market-research/content-progress.json`).

### How to approve and publish an article

1. Open the draft via `/internal/guides/<path>?token=…` and fix any `[[VERIFY: …]]` markers.
2. Set front matter `status` to `approved` (or `scheduled`) and confirm `date_planned` matches the social post day.
3. On/after `date_planned`, the article becomes publicly visible automatically (sitemap + indexable). Optionally set `status: published` and `date_published`.
4. Run `npm run guides:sync-status` and update social captions to link the live URL.
5. Do **not** deploy drafts as `published` without owner approval.

### How to add a new city from cities.json

1. Add the city to `broker-market-research/marketing/cities.json` (order, code, `web_hub`, districts, dates).
2. Copy the updated file to `content/guides/_cities.json` (vendored for the website build).
3. Add Markdown under `content/guides/<city-id>/` (`index.md`, `prices-2026.md`, `pros-cons.md`, `red-file.md`, `real-units.md`, plus a `budget-*m.md` insight) with front matter matching existing articles.
4. Run `npm run guides:sync-status`. Keep status `draft` / `needs_numbers` until numbers are verified.

Contact: buyers WhatsApp `01002891933`; network signup only `01016080323`.

## Getting Started

First, run the development server:


```bash
npm run dev
# or
yarn dev
# or
pnpm dev

# or
bun dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## SEO & Quality Assurance

### Running SEO Checks

Before committing, ensure all pages meet SEO requirements:

```bash
npm run lint:seo
```

This validates:
- All pages have required metadata (title, description, openGraph, canonical)
- No duplicate titles
- Images have alt text
- Descriptions are optimal length

### Combined Linting

Run both ESLint and SEO checks:

```bash
npm run lint:all
```

### SEO Rules

See [SEO_RULES.md](./SEO_RULES.md) for complete SEO guidelines and requirements.

**Core Value Proposition**: LenaAI is like ChatGPT for real estate — an autonomous AI sales agent that talks to customers, recommends properties, shows master plans, explains payment plans, qualifies leads, scores clients, and closes sales.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


