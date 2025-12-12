# SEO Rules & Best Practices for LenaAI

## Core Value Proposition

**LenaAI provides AI tools for real estate brokers and developers:**

### Primary Value (Priority 1): Real Estate Chatbot
**Sell real estate by AI - Best tool to sell real estate by AI agent**
- AI-powered chatbot that talks to customers in natural language
- Understands customer needs and preferences
- Recommends properties based on requirements
- Shows master plans and project details
- Explains payment plans and installments
- Closes sales by guiding customers through the process
- Like ChatGPT for real estate - autonomous AI sales agent

### Secondary Value (Priority 2): Lead Generation & Marketing Automation
**Help marketers generate qualified leads and improve marketing campaigns**
- Generate qualified leads for real estate
- Improve marketing campaign performance
- Marketing automation for real estate
- Get rid of non-qualified leads
- Every lead matters - increase conversion rate to sales
- Lead filtration and qualification
- Marketing analytics and insights

### Tertiary Value (Priority 3): CRM for Properties
**CRM for properties with AI features, automation, and lead management**
- AI-powered CRM for real estate
- Automation features
- Lead filtration
- Lead generation
- Client scoring and qualification
- Sales pipeline management
- Team management

### Fourth Value (Priority 4): Free Listings
**Free listing service for real estate properties**
- Property listings
- Unit management
- Developer directories
- Project listings

## Required SEO Structure for All Pages

### 1. Metadata Export (Required)

Every page (`page.jsx` or `page.tsx`) **MUST** export metadata:

```javascript
export const metadata = {
  title: "Page Title | LENAAI",
  description: "Page description (120-160 characters)",
  keywords: ["relevant", "keywords"],
  openGraph: {
    title: "Page Title | LENAAI",
    description: "OG description",
    url: "https://www.lenaai.net/page-path",
    images: [{ url: "https://www.lenaai.net/images/og-image.png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Page Title",
    description: "Twitter description",
  },
  alternates: {
    canonical: "https://www.lenaai.net/page-path",
  },
};
```

For dynamic pages, use `generateMetadata()`:

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

### 2. Title Requirements

- **MUST** be unique across all pages
- **SHOULD** include AI-related keywords when relevant:
  - "ChatGPT for real estate"
  - "AI Sales Agent"
  - "AI Agent"
  - "Chatbot"
  - "Conversational AI"
- Format: `"Specific Page Title | LENAAI"`
- Length: 50-60 characters recommended

### 3. Description Requirements

- **MUST** be present on every page
- **SHOULD** mention AI value proposition when relevant
- Length: 120-160 characters (optimal for search results)
- **MUST** be unique per page
- **SHOULD** include call-to-action or value statement

### 4. Open Graph Tags (Required)

Every page **MUST** include:
- `openGraph.title`
- `openGraph.description`
- `openGraph.url`
- `openGraph.images` (at least one image)

### 5. Canonical URLs (Required)

Every page **MUST** include:
```javascript
alternates: {
  canonical: "https://www.lenaai.net/page-path",
}
```

### 6. Image Alt Text (Required)

All images **MUST** have descriptive alt text:
- **SHOULD** describe AI-related value when relevant
- **MUST** be meaningful (not empty)
- Examples:
  - ✅ `alt="AI Sales Agent chatbot interface showing property recommendations"`
  - ✅ `alt="LenaAI ChatGPT for real estate - AI-powered property assistant"`
  - ❌ `alt=""`
  - ❌ `alt="image"`

### 7. Semantic HTML (Recommended)

Use semantic HTML elements:
- `<header>` for page headers
- `<nav>` for navigation
- `<main>` for main content
- `<article>` for property listings
- `<section>` for content sections
- `<footer>` for page footers

## Page-Specific Requirements

### Home Page (`/`)
- **Title**: Must emphasize "ChatGPT for real estate" or "AI Sales Agent"
- **Description**: Must explain the AI-driven property assistant value
- **Keywords**: Include "ChatGPT for real estate", "AI Sales Agent", "AI Agent", "Chatbot"

### Property Listing Pages (`/allProberties`)
- **Title**: "All Properties - Browse Real Estate Listings | LENAAI"
- **Description**: Mention AI-powered property recommendations
- **Keywords**: Include property-related terms + AI keywords

### Property Detail Pages (`/allProberties/[id]`)
- **Title**: Dynamic based on property name
- **Description**: Property details + mention AI assistant can help
- **Keywords**: Property-specific + location + AI terms

### Privacy Page (`/privacy`)
- **Title**: "Privacy Policy | LENAAI"
- **Description**: Standard privacy policy description
- **Keywords**: Privacy, data protection, terms

## AI Value Positioning in Metadata

### How to Describe LenaAI's Value Proposition

When writing metadata, emphasize in this order:

1. **Real Estate Chatbot (Primary)**: 
   - "Sell real estate by AI"
   - "Best tool to sell real estate by AI agent"
   - "Real estate chatbot - AI agent that sells properties"
   - "Like ChatGPT for real estate"

2. **Lead Generation & Marketing (Secondary)**:
   - "Generate qualified leads for real estate"
   - "Improve marketing campaigns with AI"
   - "Marketing automation for real estate"
   - "Increase conversion rate to sales"
   - "Lead filtration and qualification"

3. **CRM with AI Features (Tertiary)**:
   - "AI-powered CRM for real estate"
   - "CRM with automation and lead management"
   - "Lead generation and filtration CRM"

4. **Free Listings (Fourth)**:
   - "Free real estate listings"
   - "Property listings platform"

### Example Descriptions

**Good Examples (Primary Value - Chatbot):**
- "LenaAI - Best tool to sell real estate by AI agent. Real estate chatbot that talks to customers, understands their needs, and recommends properties. Like ChatGPT for real estate."
- "Sell real estate by AI - AI-powered chatbot that recommends properties, shows master plans, explains payment plans, and helps close sales."
- "Real estate chatbot - AI agent that sells properties, qualifies leads, scores clients, and closes deals in minutes."

**Good Examples (Secondary Value - Lead Generation):**
- "Generate qualified leads for real estate with AI. Improve marketing campaigns, automate lead filtration, and increase conversion rate to sales."
- "AI-powered lead generation for real estate. Marketing automation that filters non-qualified leads and improves campaign performance."

**Good Examples (Tertiary Value - CRM):**
- "AI-powered CRM for real estate with automation, lead filtration, and lead generation. Manage properties, clients, and sales pipeline."
- "Real estate CRM with AI features - automation, lead management, and client scoring."

**Bad Examples:**
- "Real estate platform" (too generic, no AI mention)
- "Property listings" (doesn't explain AI value, listings are 4th priority)
- "CRM system" (doesn't emphasize AI agent capabilities or lead generation)

## Robots Meta Tags

### Public Pages
```javascript
robots: {
  index: true,
  follow: true,
}
```

### Admin/Private Pages
```javascript
robots: {
  index: false,
  follow: false,
}
```

## JSON-LD Structured Data

All pages should include relevant JSON-LD schemas:
- **Organization** (global, in root layout)
- **LocalBusiness** (global, in root layout)
- **WebSite** (global, in root layout)
- **BreadcrumbList** (on all pages with navigation)
- **RealEstateListing** (on property pages)
- **Residence** (on unit/property detail pages)

## Validation

### Automated Checks

Run SEO validation:
```bash
npm run lint:seo
```

This checks:
- ✅ All pages have metadata export
- ✅ All pages have title, description, openGraph
- ✅ All pages have canonical URLs
- ✅ No duplicate titles
- ✅ Images have alt text
- ✅ Descriptions are optimal length

### CI/CD Integration

SEO checks run automatically on:
- Pull requests
- Pushes to main/master/develop branches

**Commits will be rejected if:**
- Missing metadata export
- Missing required metadata fields (title, description, openGraph, canonical)
- Duplicate titles detected

## Common Mistakes to Avoid

1. ❌ **Missing metadata export** - Every page must export metadata
2. ❌ **Generic titles** - Use specific, descriptive titles
3. ❌ **Duplicate titles** - Each page needs a unique title
4. ❌ **Missing AI keywords** - Include AI value proposition when relevant
5. ❌ **Empty alt text** - All images need descriptive alt text
6. ❌ **Missing canonical URLs** - Every page needs a canonical URL
7. ❌ **Too short/long descriptions** - Keep between 120-160 characters

## Resources

- [Next.js Metadata API](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)
- [Open Graph Protocol](https://ogp.me/)
- [Schema.org Structured Data](https://schema.org/)
- [Google Search Central](https://developers.google.com/search/docs)

## Questions?

If you're unsure about SEO requirements for a new page:
1. Check existing pages for examples
2. Run `npm run lint:seo` to validate
3. Refer to this document
4. Ensure AI value proposition is clear in metadata

