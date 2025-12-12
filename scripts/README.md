# Scripts

## SEO Checker

`check-seo.js` - Validates SEO metadata across all pages.

### Usage

```bash
npm run lint:seo
```

### What it checks

- ✅ All pages have metadata export
- ✅ All pages have title, description, openGraph
- ✅ All pages have canonical URLs
- ✅ No duplicate titles
- ✅ Images have alt text
- ✅ Descriptions are optimal length (120-160 chars)
- ✅ Titles mention AI value when relevant

### Exit codes

- `0` - All checks passed
- `1` - Errors found (must be fixed)
- `0` with warnings - Warnings found (should be fixed)

