# SEO Auditing System Implementation

## Overview

Automated SEO auditing system for LenaAI Next.js project that enforces SEO best practices across `www.lenaai.net` and `chat.lenaai.net`.

## Core Value Proposition

**LenaAI is like ChatGPT for real estate — an autonomous AI sales agent that:**
- Talks to customers in natural language
- Understands customer needs and preferences
- Recommends properties based on requirements
- Shows master plans and project details
- Explains payment plans and installments
- Qualifies leads automatically
- Scores clients based on engagement and interest
- Closes sales by guiding customers through the process

## Implementation Components

### 1. SEO Checker Script (`scripts/check-seo.js`)

Automated script that validates SEO metadata across all pages.

**Checks:**
- ✅ All pages have metadata export
- ✅ All pages have title, description, openGraph
- ✅ All pages have canonical URLs
- ✅ No duplicate titles
- ✅ Images have alt text
- ✅ Descriptions are optimal length (120-160 chars)
- ✅ Titles mention AI value when relevant

**Usage:**
```bash
npm run lint:seo
```

**Exit Codes:**
- `0` - All checks passed
- `1` - Errors found (must be fixed)

### 2. ESLint Custom Rules (`eslint-rules/seo-rules.js`)

Custom ESLint rules for SEO enforcement (available for future use).

### 3. GitHub Actions CI (`.github/workflows/seo-check.yml`)

Automated SEO checks on:
- Pull requests to main/master/develop
- Pushes to main/master/develop

**What it does:**
1. Runs ESLint
2. Runs SEO checker
3. Reports results in GitHub Actions summary

### 4. Pre-commit Hook (`.husky/pre-commit`)

Pre-commit hook to run SEO checks before commits (optional, requires husky setup).

### 5. Documentation

- **SEO_RULES.md** - Complete SEO guidelines and requirements
- **scripts/README.md** - Script documentation

## Required SEO Structure

### Every Page Must Have:

```javascript
export const metadata = {
  title: "Page Title | LENAAI",
  description: "Page description (120-160 characters)",
  openGraph: {
    title: "Page Title | LENAAI",
    description: "OG description",
    url: "https://www.lenaai.net/page-path",
    images: [{ url: "https://www.lenaai.net/images/og-image.png" }],
  },
  alternates: {
    canonical: "https://www.lenaai.net/page-path",
  },
};
```

### For Dynamic Pages:

```javascript
export async function generateMetadata({ params }) {
  // Fetch data and generate metadata
  return {
    title: "Dynamic Title | LENAAI",
    description: "Dynamic description",
    // ... other metadata
  };
}
```

## AI Value Positioning

### Required Keywords in Metadata:

- "ChatGPT for real estate"
- "AI Sales Agent"
- "AI Agent"
- "AI Salesman"
- "Chatbot"
- "Conversational AI"
- "Autonomous AI"

### How to Describe AI Value:

1. **Conversational AI**: "AI that talks to customers"
2. **Intelligent Recommendations**: "AI recommends properties based on needs"
3. **Automated Sales**: "AI Sales Agent that closes deals"
4. **Lead Qualification**: "AI qualifies leads and scores clients"
5. **ChatGPT-like Experience**: "Like ChatGPT for real estate"

## Validation Rules

### Public Pages (Strict)
- ✅ Must have metadata export
- ✅ Must have title, description, openGraph, canonical
- ✅ Must have unique titles
- ✅ Must have images with alt text
- ✅ Should mention AI value proposition

### Admin Pages (Lenient)
- ✅ Must have metadata export
- ✅ Must have title, description
- ⚠️ OpenGraph recommended (warnings only)
- ⚠️ Canonical recommended (warnings only)
- ℹ️ Not indexed (robots: { index: false })

## Running Checks

### Local Development

```bash
# Run SEO check only
npm run lint:seo

# Run ESLint + SEO check
npm run lint:all

# Run ESLint only
npm run lint
```

### CI/CD

SEO checks run automatically on:
- Pull requests
- Pushes to main/master/develop

**Commits will be rejected if:**
- Missing metadata export
- Missing required metadata fields
- Duplicate titles detected

## Files Created

1. `scripts/check-seo.js` - SEO validation script
2. `eslint-rules/seo-rules.js` - Custom ESLint rules
3. `.github/workflows/seo-check.yml` - CI workflow
4. `.husky/pre-commit` - Pre-commit hook
5. `SEO_RULES.md` - Complete SEO guidelines
6. `scripts/README.md` - Script documentation
7. `SEO_IMPLEMENTATION.md` - This file

## Next Steps

1. **Fix existing issues**: Run `npm run lint:seo` and fix any errors
2. **Set up Husky** (optional): `npx husky install` to enable pre-commit hooks
3. **Review SEO_RULES.md**: Ensure all team members understand requirements
4. **Monitor CI**: Check GitHub Actions for SEO check results

## Troubleshooting

### Script not found
```bash
chmod +x scripts/check-seo.js
```

### Admin pages showing errors
Admin pages are checked but with lenient rules. Warnings are acceptable for non-indexed pages.

### False positives
Update the script's regex patterns if needed for edge cases.

## Support

For questions or issues:
1. Check `SEO_RULES.md` for guidelines
2. Review existing pages for examples
3. Run `npm run lint:seo` to see specific errors

