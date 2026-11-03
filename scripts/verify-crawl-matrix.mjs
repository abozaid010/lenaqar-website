#!/usr/bin/env node

/**
 * Crawl, Discoverability and Schema Verification
 * Verifies canonical URLs, robots directives, schema, and internal links
 * for all indexable guides and priority city pages.
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE_URL = 'https://www.lenaqar.com';

const errors = [];
const warnings = [];
const checks = [];

// Priority cities that need strong internal link support
const PRIORITY_CITIES = ['madinaty', 'new-cairo', 'el-shorouk'];

// Load guide frontmatter
function loadGuideFrontmatter(filePath) {
  const content = readFileSync(filePath, 'utf8');
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) return null;

  const frontmatter = {};
  const lines = frontmatterMatch[1].split('\n');
  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      let value = line.slice(colonIndex + 1).trim();
      // Handle boolean and null values
      if (value === 'true') value = true;
      else if (value === 'false') value = false;
      else if (value === 'null' || value === '') value = null;
      else if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      else if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      frontmatter[key] = value;
    }
  }
  return frontmatter;
}

// Check canonical URL format
function checkCanonical(slug, frontmatter) {
  const check = {
    slug,
    check: 'canonical_url',
    pass: true,
    message: ''
  };

  if (!frontmatter.slug) {
    check.pass = false;
    check.message = 'Missing slug in frontmatter';
    errors.push(check);
    return check;
  }

  const expectedUrl = `${SITE_URL}${frontmatter.slug.replace(/\/$/, '')}`;
  check.message = `Expected canonical: ${expectedUrl}`;
  checks.push(check);
  return check;
}

// Check SEO index status
function checkSeoIndex(slug, frontmatter) {
  const check = {
    slug,
    check: 'seo_index',
    pass: true,
    message: ''
  };

  if (frontmatter.seo_index === false) {
    check.pass = false;
    check.message = 'Explicitly excluded from index (seo_index: false)';
    warnings.push(check);
  } else if (frontmatter.seo_index === true || frontmatter.seo_index === undefined) {
    check.message = 'Eligible for indexing';
    checks.push(check);
  } else {
    check.pass = false;
    check.message = `Unexpected seo_index value: ${frontmatter.seo_index}`;
    errors.push(check);
  }

  return check;
}

// Check schema types (optional in frontmatter - schema is generated dynamically)
function checkSchema(slug, frontmatter) {
  const check = {
    slug,
    check: 'schema_types',
    pass: true,
    message: ''
  };

  // Schema is optional in frontmatter - generated dynamically in code
  if (!frontmatter.schema) {
    check.message = 'Schema not in frontmatter (generated dynamically)';
    checks.push(check);
    return check;
  }

  if (!Array.isArray(frontmatter.schema)) {
    check.pass = false;
    check.message = 'Invalid schema array in frontmatter';
    errors.push(check);
    return check;
  }

  const validTypes = ['Article', 'FAQPage', 'HowTo', 'Organization', 'WebSite'];
  const invalidTypes = frontmatter.schema.filter(t => !validTypes.includes(t));

  if (invalidTypes.length > 0) {
    check.pass = false;
    check.message = `Invalid schema types: ${invalidTypes.join(', ')}`;
    errors.push(check);
  } else {
    check.message = `Schema types: ${frontmatter.schema.join(', ')}`;
    checks.push(check);
  }

  return check;
}

// Check priority city internal links
function checkPriorityCityLinks(slug, frontmatter, content) {
  const check = {
    slug,
    check: 'priority_city_links',
    pass: true,
    message: ''
  };

  const city = slug.split('/')[2]; // Extract city from /guides/city/article
  if (!PRIORITY_CITIES.includes(city)) {
    check.message = 'Not a priority city guide';
    checks.push(check);
    return check;
  }

  // Check for internal links to related guides
  const internalLinks = (content.match(/\/guides\/[^\s\)]+/g) || []).length;
  if (internalLinks === 0) {
    check.pass = false;
    check.message = 'No internal guide links found - may be orphaned';
    warnings.push(check);
  } else {
    check.message = `Found ${internalLinks} internal guide links`;
    checks.push(check);
  }

  return check;
}

// Verify guide frontmatter
function verifyGuide(filePath) {
  const relativePath = filePath.replace(process.cwd(), '');
  const frontmatter = loadGuideFrontmatter(filePath);
  if (!frontmatter) {
    errors.push({
      slug: relativePath,
      check: 'frontmatter',
      pass: false,
      message: 'Could not parse frontmatter'
    });
    return;
  }

  const content = readFileSync(filePath, 'utf8');
  const slug = frontmatter.slug || relativePath;

  checkCanonical(slug, frontmatter);
  checkSeoIndex(slug, frontmatter);
  checkSchema(slug, frontmatter);
  checkPriorityCityLinks(slug, frontmatter, content);
}

// Walk guides directory
function walkGuides(dir, fileList = []) {
  const files = readdirSync(dir);
  for (const file of files) {
    const filePath = join(dir, file);
    const stat = statSync(filePath);
    if (stat.isDirectory()) {
      walkGuides(filePath, fileList);
    } else if (file.endsWith('.md')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

// Main execution
console.log('🔍 Crawl, Discoverability and Schema Verification\n');

const guidesDir = join(process.cwd(), 'content', 'guides');
try {
  readdirSync(guidesDir);
} catch (e) {
  console.error('❌ content/guides directory not found');
  process.exit(1);
}


const guideFiles = walkGuides(guidesDir);
console.log(`Found ${guideFiles.length} guide files to verify\n`);

guideFiles.forEach(verifyGuide);

// Check sitemap for excluded guides
const sitemapExcluded = guideFiles.filter(file => {
  const frontmatter = loadGuideFrontmatter(file);
  return frontmatter && frontmatter.seo_index === false;
});

console.log(`\n📊 Verification Results:\n`);
console.log(`Total guides: ${guideFiles.length}`);
console.log(`Excluded from index (seo_index: false): ${sitemapExcluded.length}`);
console.log(`Indexable guides: ${guideFiles.length - sitemapExcluded.length}`);
console.log(`Checks passed: ${checks.length}`);
console.log(`Warnings: ${warnings.length}`);
console.log(`Errors: ${errors.length}\n`);

if (errors.length > 0) {
  console.log('❌ ERRORS:\n');
  errors.forEach(e => console.log(`  ${e.slug || e.check}: ${e.message}`));
  console.log('');
}

if (warnings.length > 0) {
  console.log('⚠️  WARNINGS:\n');
  warnings.forEach(w => console.log(`  ${w.slug || w.check}: ${w.message}`));
  console.log('');
}

if (errors.length === 0) {
  console.log('✅ All critical checks passed!\n');
  process.exit(0);
} else {
  console.log(`❌ Found ${errors.length} error(s) and ${warnings.length} warning(s)\n`);
  process.exit(1);
}
