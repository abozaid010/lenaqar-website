#!/usr/bin/env node
/**
 * I18n Migration Script
 * Transforms direct t.access patterns to translate("access", t.access)
 *
 * Usage:
 *   node scripts/migrate-i18n.js src/components/ui/add-developer-dialog.jsx
 *   node scripts/migrate-i18n.js --dry-run src/components/ui/*.jsx
 *   node scripts/migrate-i18n.js --all (transforms all 77 files)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Parse arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const transformAll = args.includes('--all');
const files = args.filter(arg => !arg.startsWith('--'));

// Colors for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m'
};

// Find all files with direct t. access
function findFilesWithTAccess() {
  try {
    const output = execSync(
      `grep -r "\\bt\\.[a-zA-Z_]" src --include="*.jsx" --include="*.js" -l`,
      { encoding: 'utf-8', cwd: path.resolve(__dirname, '..') }
    );
    return output.trim().split('\n').filter(Boolean);
  } catch (e) {
    return [];
  }
}

// Check if pattern is already inside a translate call
function isInsideTranslate(content, matchIndex) {
  // Look back for translate(
  const before = content.slice(0, matchIndex);
  const lastTranslate = before.lastIndexOf('translate(');
  if (lastTranslate === -1) return false;

  // Simple check: if there's a closing paren between translate( and our match, we're not inside
  const between = content.slice(lastTranslate + 10, matchIndex);
  // Count parens - if more ) than (, we're outside
  let depth = 1;
  for (let i = 0; i < between.length && i < 1000; i++) { // Limit iterations
    if (between[i] === '(') depth++;
    if (between[i] === ')') depth--;
    if (depth <= 0) return false;
  }
  return depth > 0;
}

// Check if it's a destructuring pattern
function isDestructuring(content, matchIndex) {
  const before = content.slice(0, matchIndex);
  // Look for patterns like "const { t }" or "{ t }"
  const recentContext = before.slice(-100);
  return /const\s*\{\s*[^}]*\bt\s*[},]/.test(recentContext) ||
         /\{\s*[^}]*\bt\s*[},]/.test(recentContext);
}

// Check if it's inside JSX spread
function isInsideSpread(content, matchIndex) {
  const before = content.slice(0, matchIndex);
  const recentContext = before.slice(-50);
  return /\.\.\./.test(recentContext);
}

// Transform a single file
function transformFile(filePath) {
  const fullPath = path.resolve(__dirname, '..', filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`${colors.red}❌ File not found: ${filePath}${colors.reset}`);
    return { transformed: false, error: 'File not found' };
  }

  let content = fs.readFileSync(fullPath, 'utf-8');
  const originalContent = content;

  // Track if file imports useI18n
  const hasI18nImport = /useI18n/.test(content);

  // Pattern to match t.x or t.x.y etc (handles optional chaining ?.)
  // Matches: t.key, t.nested.key, t.key?.subkey, t.nested?.key.subkey, etc
  const tAccessPattern = /\bt(?:\?)?\.[a-zA-Z_][a-zA-Z0-9_]*(?:(?:\?)?\.[a-zA-Z_][a-zA-Z0-9_]*)*/g;

  const matches = [];
  let match;
  while ((match = tAccessPattern.exec(content)) !== null) {
    const matchText = match[0];
    const matchIndex = match.index;

    // Skip if already inside translate()
    if (isInsideTranslate(content, matchIndex)) continue;

    // Skip destructuring patterns
    if (isDestructuring(content, matchIndex)) continue;

    // Skip spread operators
    if (isInsideSpread(content, matchIndex)) continue;

    // Skip if followed by ( (method call)
    const afterMatch = content.slice(matchIndex + matchText.length).trimStart();
    if (afterMatch.startsWith('(')) continue;

    // Skip if it's part of a larger expression we can't handle
    // e.g., t.key?.subkey, t.key![0], etc
    if (matchText.includes('?') || matchText.includes('!')) continue;

    matches.push({
      text: matchText,
      index: matchIndex,
      line: content.slice(0, matchIndex).split('\n').length
    });
  }

  if (matches.length === 0) {
    return { transformed: false, changes: 0, reason: 'No transformable patterns found' };
  }

  // Sort matches by index in reverse order (to replace from end to start)
  matches.sort((a, b) => b.index - a.index);

  let changes = 0;
  const transformedParts = [];

  for (const { text, index, line } of matches) {
    // Remove leading "t" or "t?" to get the key path
    const keyPath = text.replace(/^t\??\./, '');
    // Convert optional chaining in key path to dot notation for translate key
    const translateKey = keyPath.replace(/\?\./g, '.');
    const replacement = `translate("${translateKey}", ${text})`;

    content = content.slice(0, index) + replacement + content.slice(index + text.length);
    changes++;
    transformedParts.push({ original: text, replacement, line });
  }

  // Ensure translate is imported from useI18n
  if (changes > 0 && hasI18nImport) {
    // Check if translate is already destructured
    const destructuringMatch = content.match(/const\s*\{\s*([^}]*?)\}\s*=\s*useI18n\(\)/);
    if (destructuringMatch) {
      const currentDestructuring = destructuringMatch[1];
      if (!currentDestructuring.includes('translate')) {
        // Add translate to destructuring
        const newDestructuring = currentDestructuring.trim()
          ? `${currentDestructuring.trim()}, translate`
          : 'translate';
        content = content.replace(
          /const\s*\{\s*[^}]*?\}\s*=\s*useI18n\(\)/,
          `const { ${newDestructuring} } = useI18n()`
        );
      }
    }
  }

  // Write file
  if (!dryRun && changes > 0) {
    fs.writeFileSync(fullPath, content, 'utf-8');
  }

  return {
    transformed: changes > 0,
    changes,
    transformedParts: dryRun ? transformedParts : undefined,
    dryRun
  };
}

// Main execution
async function main() {
  console.log(`${colors.blue}🔧 I18n Migration Script${colors.reset}\n`);

  let targetFiles = [];

  if (transformAll) {
    targetFiles = findFilesWithTAccess();
    console.log(`${colors.yellow}📁 Found ${targetFiles.length} files with t. access patterns${colors.reset}\n`);
  } else if (files.length > 0) {
    targetFiles = files;
  } else {
    console.log(`Usage:
  node scripts/migrate-i18n.js <file.jsx>          # Transform single file
  node scripts/migrate-i18n.js --dry-run <file>  # Preview changes
  node scripts/migrate-i18n.js --all               # Transform all files

Examples:
  node scripts/migrate-i18n.js src/components/ui/add-developer-dialog.jsx
  node scripts/migrate-i18n.js --dry-run src/components/ui/*.jsx
`);
    return;
  }

  let totalFiles = 0;
  let totalChanges = 0;
  let errorFiles = [];

  for (const file of targetFiles) {
    try {
      const result = transformFile(file);
      totalFiles++;

      if (result.error) {
        errorFiles.push({ file, error: result.error });
        console.log(`${colors.red}❌ ${file}: ${result.error}${colors.reset}`);
        continue;
      }

      if (result.changes > 0) {
        totalChanges += result.changes;
        if (dryRun) {
          console.log(`${colors.yellow}📋 ${file} (${result.changes} changes):${colors.reset}`);
          for (const part of result.transformedParts.slice(0, 5)) {
            console.log(`   Line ${part.line}: ${colors.gray}${part.original} → ${colors.green}${part.replacement}${colors.reset}`);
          }
          if (result.transformedParts.length > 5) {
            console.log(`   ... and ${result.transformedParts.length - 5} more`);
          }
        } else {
          console.log(`${colors.green}✅ ${file}: ${result.changes} changes applied${colors.reset}`);
        }
      } else {
        console.log(`${colors.gray}⏭️  ${file}: ${result.reason || 'No changes needed'}${colors.reset}`);
      }
    } catch (error) {
      errorFiles.push({ file, error: error.message });
      console.log(`${colors.red}❌ ${file}: ${error.message}${colors.reset}`);
    }
  }

  console.log(`\n${colors.blue}📊 Summary:${colors.reset}`);
  console.log(`   Files processed: ${totalFiles}`);
  console.log(`   Total changes: ${totalChanges}`);
  console.log(`   Errors: ${errorFiles.length}`);

  if (dryRun && totalChanges > 0) {
    console.log(`\n${colors.yellow}⚠️  Dry run mode - no files were modified${colors.reset}`);
    console.log(`   Run without --dry-run to apply changes`);
  }
}

main().catch(console.error);
