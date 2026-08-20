#!/usr/bin/env node
// Usage: node scripts/orphan-scan.mjs <entry> [<entry>...]
// Entries may be files or directories. Prints reachable files to stdout,
// and the unreachable src/ remainder to stderr under "ORPHANS".
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');
const exts = ['.ts', '.tsx', '.js', '.jsx', '.mjs'];

function resolve(spec, fromFile) {
  let base;
  if (spec.startsWith('@/')) base = path.join(SRC, spec.slice(2));
  else if (spec.startsWith('.')) base = path.resolve(path.dirname(fromFile), spec);
  else return null;
  for (const e of exts) { const p = base + e; if (fs.existsSync(p) && fs.statSync(p).isFile()) return p; }
  for (const e of exts) { const p = path.join(base, 'index' + e); if (fs.existsSync(p)) return p; }
  if (fs.existsSync(base) && fs.statSync(base).isFile()) return base;
  return null;
}

const importRe = /(?:from\s+|import\s+|require\(\s*|import\(\s*)['"]([^'"]+)['"]/g;

function walk(dir, out = []) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p, out);
    else if (exts.includes(path.extname(p))) out.push(path.resolve(p));
  }
  return out;
}

const queue = [];
for (const e of process.argv.slice(2)) {
  if (!fs.existsSync(e)) { console.error('MISSING ENTRY:', e); continue; }
  if (fs.statSync(e).isDirectory()) queue.push(...walk(e));
  else queue.push(path.resolve(e));
}

const seen = new Set();
while (queue.length) {
  const f = queue.pop();
  if (seen.has(f)) continue;
  seen.add(f);
  let src;
  try { src = fs.readFileSync(f, 'utf8'); } catch { continue; }
  importRe.lastIndex = 0;
  let m;
  while ((m = importRe.exec(src))) {
    const r = resolve(m[1], f);
    if (r && !seen.has(r)) queue.push(r);
  }
}

const reachable = new Set([...seen].map((p) => path.relative(ROOT, p)));
console.log([...reachable].sort().join('\n'));

const all = walk(SRC).map((p) => path.relative(ROOT, p)).sort();
const orphans = all.filter((p) => !reachable.has(p));
console.error(`\nREACHABLE: ${reachable.size}\nORPHANS (${orphans.length}):\n` + orphans.join('\n'));
