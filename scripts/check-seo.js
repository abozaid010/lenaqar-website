#!/usr/bin/env node

/**
 * SEO Metadata Checker
 * Validates that all pages have required SEO metadata
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.lenaai.net';
const AI_KEYWORDS = [
  // English Keywords
  'AI',
  'ChatGPT',
  'AI Agent',
  'AI Sales Agent',
  'Real Estate AI Sales Agent',
  'Realstate AI Sales agent',
  'AI Salesman',
  'Chatbot',
  'conversational AI',
  'AI Chatbot',
  'GPT for real estate',
  'GPT for real estate agent',
  'Real Estate ChatGPT',
  'Real Estate AI Agent',
  'Real Estate AI Chatbot',
  'sell real estate by AI',
  'AI real estate agent',
  'real estate AI tool',
  'AI broker tool',
  'qualified leads',
  'lead generation',
  'marketing automation',
  'lead filtration',
  'conversion rate',
  // Arabic Keywords (transliterated and Arabic script)
  'ذكاء اصطناعي',
  'شات جي بي تي',
  'روبوت محادثة',
  'مساعد ذكي',
  'وكيل مبيعات ذكي',
  'ذكاء اصطناعي للعقارات',
  'روبوت عقاري',
  'أداة ذكاء اصطناعي للعقارات',
  'بيع العقارات بالذكاء الاصطناعي',
  'توليد العملاء المحتملين',
  'أتمتة التسويق',
  'تصفية العملاء',
  'معدل التحويل',
  // Arabic transliterated
  'zaki\' iqtira\'i',
  'chatbot',
  'musa\'id zaki',
  'wakeel mabee\'at zaki',
];

const errors = [];
const warnings = [];
const pageTitles = new Map();

function findPageFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules, .next, and other build directories
      if (
        !file.startsWith('.') &&
        file !== 'node_modules' &&
        file !== '.next' &&
        file !== 'dist'
      ) {
        findPageFiles(filePath, fileList);
      }
    } else if (file === 'page.jsx' || file === 'page.tsx' || file === 'layout.jsx' || file === 'layout.tsx') {
      fileList.push(filePath);
    }
  });

  return fileList;
}

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relativePath = path.relative(process.cwd(), filePath);

  // Skip API routes, error pages, and loading pages
  if (
    filePath.includes('/api/') ||
    filePath.includes('/error.') ||
    filePath.includes('/loading.')
  ) {
    return;
  }

  // Admin pages have different requirements (not indexed, but should still have basic metadata)
  const isAdminPage = filePath.includes('/(admin)/');

  // Skip client components - they can't export metadata
  if (content.includes('"use client"') || content.includes("'use client'")) {
    // Client components should have metadata in their layout
    return;
  }

  // Check for metadata export
  const hasMetadataExport =
    content.includes('export const metadata') ||
    content.includes('export async function generateMetadata');

  if (!hasMetadataExport && !filePath.includes('layout.')) {
    errors.push(`❌ ${relativePath}: Missing metadata export`);
    return;
  }

  // Extract metadata
  if (hasMetadataExport) {
    // Check for title - handle both direct metadata and generateMetadata return
    const titlePatterns = [
      /title:\s*['"`]([^'"`]+)['"`]/,  // Direct: title: "Title"
      /title:\s*([a-zA-Z_$][a-zA-Z0-9_$]*)/,  // Variable: title: titleVar
      /title\s*:\s*['"`]([^'"`]+)['"`]/,  // With spaces
      /['"]title['"]\s*:\s*['"`]([^'"`]+)['"`]/,  // String key
    ];
    
    let titleMatch = null;
    for (const pattern of titlePatterns) {
      titleMatch = content.match(pattern);
      if (titleMatch) break;
    }
    
    // Also check for title in return statement of generateMetadata
    if (!titleMatch && content.includes('generateMetadata')) {
      // Match title in return object (multiline)
      const returnMatch = content.match(/return\s*\{[\s\S]{0,2000}?title\s*:\s*['"`]([^'"`]+)['"`]/);
      if (returnMatch) {
        titleMatch = returnMatch;
      }
      // Check for title variable assignment before return (handles template literals too)
      const titleVarMatch = content.match(/const\s+title\s*=\s*[^;]+/);
      if (titleVarMatch) {
        // Try to extract actual title from template literal or string
        const templateTitleMatch = titleVarMatch[0].match(/`([^`]+)`/);
        const stringTitleMatch = titleVarMatch[0].match(/['"]([^'"]+)['"]/);
        if (templateTitleMatch) {
          // Extract a portion of the template literal for uniqueness check
          const titlePart = templateTitleMatch[1].substring(0, 50).replace(/\$\{[^}]+\}/g, 'VAR');
          titleMatch = { 1: titlePart || 'Template Title' };
        } else if (stringTitleMatch) {
          titleMatch = stringTitleMatch;
        } else if (titleVarMatch[0].includes('?') || titleVarMatch[0].includes('||')) {
          // Conditional title - mark as dynamic but unique per file
          titleMatch = { 1: `Dynamic Title ${relativePath}` };
        }
      }
      // Check for title in return object with variable
      const returnTitleVar = content.match(/return\s*\{[\s\S]{0,2000}?title\s*:\s*title/);
      if (returnTitleVar) {
        titleMatch = { 1: 'Dynamic Title' }; // Mark as having title
      }
      // Check for template literal title in return
      const templateMatch = content.match(/title\s*:\s*[`'"]\$\{([^}]+)\}[^`'"]*[`'"]/);
      if (templateMatch) {
        titleMatch = { 1: 'Dynamic Title' }; // Mark as having title
      }
    }
    
    if (!titleMatch && !filePath.includes('layout.')) {
      errors.push(`❌ ${relativePath}: Missing title in metadata`);
    } else if (titleMatch) {
      const title = titleMatch[1];
      if (pageTitles.has(title)) {
        warnings.push(
          `⚠️  ${relativePath}: Duplicate title "${title}" (also used in ${pageTitles.get(title)})`
        );
      } else {
        pageTitles.set(title, relativePath);
      }

      // Check if title mentions AI value (supports both English and Arabic)
      const titleLower = title.toLowerCase();
      const hasAIKeyword = AI_KEYWORDS.some((keyword) => {
        const keywordLower = keyword.toLowerCase();
        // Check English keywords
        if (titleLower.includes(keywordLower)) return true;
        // Check Arabic keywords (direct match)
        if (title.includes(keyword)) return true;
        return false;
      });
      if (!hasAIKeyword && !filePath.includes('layout.')) {
        warnings.push(
          `⚠️  ${relativePath}: Title should mention AI/ChatGPT value proposition (real estate chatbot, AI agent, lead generation, or AI Sales Agent dashboard)`
        );
      }
    }

    // Check for description - handle both direct metadata and generateMetadata return
    // Prioritize main description over openGraph.description
    // First, try to find description outside of openGraph block
    // Match description: "..." (can span multiple lines, need to handle properly)
    // JavaScript strings can span multiple lines, so we need to match across newlines
    // Handle both single and double quotes, and escaped quotes
    const descPatterns = [
      // Match description: "long string" (double quotes, can span multiple lines, 50+ chars)
      // This regex matches from opening " to closing ", handling escaped quotes
      /description\s*:\s*"((?:[^"\\]|\\.){50,})"/s,
      // Match description: 'long string' (single quotes, can span multiple lines, 50+ chars)
      /description\s*:\s*'((?:[^'\\]|\\.){50,})'/s,
      // Match description: "string" (any length, but prefer longer)
      /description\s*:\s*"((?:[^"\\]|\\.)+)"/s,
      // Match description: 'string' (any length)
      /description\s*:\s*'((?:[^'\\]|\\.)+)'/s,
    ];
    
    let descriptionMatch = null;
    for (const pattern of descPatterns) {
      const allMatches = [...content.matchAll(new RegExp(pattern.source, pattern.flags + 'g'))];
      for (const matches of allMatches) {
        if (matches && matches[1] && matches[1].length > 40) {
          // Check if this is inside openGraph block
          const matchIndex = content.indexOf(matches[0]);
          const beforeMatch = content.substring(Math.max(0, matchIndex - 500), matchIndex);
          const afterMatch = content.substring(matchIndex, Math.min(content.length, matchIndex + 500));
          
          // Find the nearest openGraph before this match
          const openGraphBefore = beforeMatch.lastIndexOf('openGraph');
          const openGraphAfter = afterMatch.indexOf('openGraph');
          const openGraphEndBefore = beforeMatch.lastIndexOf('}');
          
          // If openGraph is before this and hasn't ended, skip it
          if (openGraphBefore > -1 && (openGraphEndBefore < openGraphBefore || openGraphAfter > -1)) {
            continue; // This is inside openGraph, skip
          }
          
          descriptionMatch = matches;
          break;
        }
      }
      if (descriptionMatch) break;
    }
    
    // Also check for description in return statement of generateMetadata
    if (!descriptionMatch && content.includes('generateMetadata')) {
      // First, try to find description variable assignment (before return) - handle multi-line
      const descVarMatch = content.match(/const\s+description\s*=\s*[^;]+(?:;[^;]*)*/s);
      if (descVarMatch) {
        const descVarContent = descVarMatch[0];
        // Try to extract actual description from template literal or string
        // Handle template literals with backticks (can span multiple lines)
        const templateDescMatches = [...descVarContent.matchAll(/`([^`]+)`/gs)];
        const stringDescMatches = [...descVarContent.matchAll(/['"]([^'"]{40,})['"]/gs)];
        
        if (templateDescMatches && templateDescMatches.length > 0) {
          // If multiple template literals (ternary), use the longest one
          let longestTemplate = '';
          templateDescMatches.forEach(match => {
            const text = match[1].replace(/\$\{[^}]+\}/g, '').trim();
            if (text.length > longestTemplate.length) {
              longestTemplate = text;
            }
          });
          if (longestTemplate && longestTemplate.length > 40) {
            descriptionMatch = { 1: longestTemplate };
          }
        } else if (stringDescMatches && stringDescMatches.length > 0) {
          // Use the longest string match
          let longestString = '';
          stringDescMatches.forEach(match => {
            if (match[1].length > longestString.length) {
              longestString = match[1];
            }
          });
          if (longestString && longestString.length > 40) {
            descriptionMatch = { 1: longestString };
          }
        }
        
        // If still no match and it's a ternary, try to extract both branches
        if (!descriptionMatch && (descVarContent.includes('?') || descVarContent.includes('||'))) {
          // Match the true branch (before :)
          const trueBranchMatches = [...descVarContent.matchAll(/\?\s*`([^`]+)`/gs)];
          const trueBranchStringMatches = [...descVarContent.matchAll(/\?\s*['"]([^'"]{40,})['"]/gs)];
          // Match the false branch (after :)
          const falseBranchMatches = [...descVarContent.matchAll(/:\s*`([^`]+)`/gs)];
          const falseBranchStringMatches = [...descVarContent.matchAll(/:\s*['"]([^'"]{40,})['"]/gs)];
          
          // Prefer the longer branch
          let bestMatch = null;
          let bestLength = 0;
          
          [...trueBranchMatches, ...trueBranchStringMatches, ...falseBranchMatches, ...falseBranchStringMatches].forEach(match => {
            if (match && match[1]) {
              const text = match[1].replace(/\$\{[^}]+\}/g, '').trim();
              if (text.length > bestLength) {
                bestLength = text.length;
                bestMatch = { 1: text };
              }
            }
          });
          
          if (bestMatch && bestLength > 40) {
            descriptionMatch = bestMatch;
          } else {
            // Mark as having description even if we can't extract exact text
            descriptionMatch = { 1: 'Dynamic Description' };
          }
        }
      }
      
      // If still no match, check for description in return object (but exclude openGraph.description)
      if (!descriptionMatch) {
        // Match description in return object, but not inside openGraph
        const returnMatch = content.match(/return\s*\{[\s\S]{0,3000}?(?<!openGraph\.)description\s*:\s*['"`]([^'"`]+)['"`]/);
        if (returnMatch && returnMatch[1] && returnMatch[1].length > 40) {
          descriptionMatch = returnMatch;
        }
      }
      
      // Last resort: check for description variable in return
      if (!descriptionMatch) {
        const returnDescVar = content.match(/return\s*\{[\s\S]{0,2000}?description\s*:\s*description/);
        if (returnDescVar) {
          descriptionMatch = { 1: 'Dynamic Description' }; // Mark as having description
        }
      }
      
      // If still no match, try to find description in return object (but exclude openGraph.description)
      if (!descriptionMatch) {
        // Match description in return object, but not inside openGraph
        const returnMatch = content.match(/return\s*\{[\s\S]{0,3000}?(?<!openGraph\.)description\s*:\s*['"`]([^'"`]+)['"`]/);
        if (returnMatch && returnMatch[1] && returnMatch[1].length > 40) {
          descriptionMatch = returnMatch;
        }
      }
      // Check for description in return object with variable
      const returnDescVar = content.match(/return\s*\{[\s\S]{0,2000}?description\s*:\s*description/);
      if (returnDescVar) {
        descriptionMatch = { 1: 'Dynamic Description' }; // Mark as having description
      }
      // Check for template literal description in return
      const templateMatch = content.match(/description\s*:\s*[`'"]\$\{([^}]+)\}[^`'"]*[`'"]/);
      if (templateMatch) {
        descriptionMatch = { 1: 'Dynamic Description' }; // Mark as having description
      }
    }
    
    if (!descriptionMatch && !filePath.includes('layout.')) {
      errors.push(`❌ ${relativePath}: Missing description in metadata`);
    } else if (descriptionMatch) {
      const description = descriptionMatch[1];
      if (description.length < 50) {
        warnings.push(
          `⚠️  ${relativePath}: Description is too short (${description.length} chars, recommended: 120-160)`
        );
      }
      if (description.length > 160) {
        warnings.push(
          `⚠️  ${relativePath}: Description is too long (${description.length} chars, recommended: 120-160)`
        );
      }
    }

    // Check for openGraph (optional for admin pages, but recommended)
    if (!content.includes('openGraph:') && !filePath.includes('layout.')) {
      if (isAdminPage) {
        warnings.push(`⚠️  ${relativePath}: Missing openGraph in metadata (recommended even for non-indexed pages)`);
      } else {
        errors.push(`❌ ${relativePath}: Missing openGraph in metadata`);
      }
    }

    // Check for canonical URL (optional for admin pages)
    if (
      !content.includes('alternates:') &&
      !content.includes('canonical:') &&
      !filePath.includes('layout.')
    ) {
      if (isAdminPage) {
        warnings.push(`⚠️  ${relativePath}: Missing canonical URL in metadata (recommended)`);
      } else {
        errors.push(`❌ ${relativePath}: Missing canonical URL in metadata`);
      }
    }
  }

  // Check for images without alt text
  const imageRegex = /<img[^>]*(?!alt=)[^>]*>/g;
  const imagesWithoutAlt = content.match(imageRegex);
  if (imagesWithoutAlt) {
    imagesWithoutAlt.forEach((img) => {
      if (!img.includes('alt=')) {
        warnings.push(`⚠️  ${relativePath}: Image missing alt text`);
      }
    });
  }

  // Check for Next.js Image without alt
  const nextImageRegex = /<Image[^>]*(?!alt=)[^>]*>/g;
  const nextImagesWithoutAlt = content.match(nextImageRegex);
  if (nextImagesWithoutAlt) {
    nextImagesWithoutAlt.forEach((img) => {
      if (!img.includes('alt=')) {
        warnings.push(`⚠️  ${relativePath}: Next.js Image missing alt text`);
      }
    });
  }
}

// Main execution
console.log('🔍 Checking SEO metadata across all pages...\n');

const appDir = path.join(process.cwd(), 'src', 'app');
if (!fs.existsSync(appDir)) {
  console.error('❌ src/app directory not found');
  process.exit(1);
}

const pageFiles = findPageFiles(appDir);
console.log(`Found ${pageFiles.length} page files to check\n`);

pageFiles.forEach(checkFile);

// Report results
console.log('\n📊 SEO Audit Results:\n');

if (errors.length > 0) {
  console.log('❌ ERRORS (must be fixed):\n');
  errors.forEach((error) => console.log(`  ${error}`));
  console.log('');
}

if (warnings.length > 0) {
  console.log('⚠️  WARNINGS (should be fixed):\n');
  warnings.forEach((warning) => console.log(`  ${warning}`));
  console.log('');
}

if (errors.length === 0 && warnings.length === 0) {
  console.log('✅ All SEO checks passed!\n');
  process.exit(0);
} else if (errors.length > 0) {
  console.log(`\n❌ Found ${errors.length} error(s) and ${warnings.length} warning(s)`);
  console.log('Please fix the errors before committing.\n');
  process.exit(1);
} else {
  console.log(`\n⚠️  Found ${warnings.length} warning(s)`);
  console.log('Consider fixing warnings for better SEO.\n');
  process.exit(0);
}

