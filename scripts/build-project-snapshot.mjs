#!/usr/bin/env node
/**
 * Builds content/projects/projects-snapshot.json: developer projects with a
 * unit-price summary, for the public /projects pages.
 *
 * Usage: node --env-file=.env scripts/build-project-snapshot.mjs [--max-pages N] [--out FILE]
 * Env:   API_BASE_URL, X_API_KEY, optional BFF_SECRET (names only; never printed).
 *
 * Read-only: GET /public/projects once, then GET /public/v1/units page by page
 * (the API returns at most 16 units per page). Only aggregates are written —
 * no unit id, code, author, client or contact (see project-summary.js).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  MIN_PROJECT_UNITS,
  summarizeProjectUnits,
  toPublicProject,
  toSummaryUnit,
} from "../src/lib/lenaqar/project-summary.js";

const TENANT = "public";
const PAUSE_MS = 400;
const args = process.argv.slice(2);
const argValue = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const MAX_PAGES = Number(argValue("--max-pages", "4000"));
const OUT = resolve(argValue("--out", "content/projects/projects-snapshot.json"));

const BASE = (process.env.API_BASE_URL || "").replace(/\/$/, "");
const KEY = process.env.X_API_KEY || "";
if (!BASE || !KEY) {
  console.error("API_BASE_URL and X_API_KEY are required (node --env-file=.env …)");
  process.exit(1);
}
const headers = {
  accept: "application/json",
  "X-API-Key": KEY,
  "User-Agent": "Mozilla/5.0 (compatible; LenaQarServer/1.0)",
  ...(process.env.BFF_SECRET ? { "X-BFF-Secret": process.env.BFF_SECRET } : {}),
};
const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

async function getJson(path, { tries = 6 } = {}) {
  for (let attempt = 1; ; attempt += 1) {
    try {
      const response = await fetch(`${BASE}${path}`, { headers, signal: AbortSignal.timeout(120_000) });
      if (response.ok) return await response.json();
      if (attempt >= tries || ![429, 500, 502, 503, 504].includes(response.status)) {
        throw new Error(`HTTP ${response.status} for ${path.split("?")[0]}`);
      }
    } catch (error) {
      if (attempt >= tries) throw error;
    }
    await sleep(Math.min(60_000, 2_000 * 2 ** (attempt - 1)));
  }
}

const now = new Date();
const projectRows = (await getJson("/public/projects"))?.data || [];
const projects = new Map();
const slugCount = new Map();
for (const row of projectRows) {
  if (row?.client_id !== TENANT || !row?.id) continue;
  const project = toPublicProject(row);
  if (!project) continue;
  slugCount.set(project.slug, (slugCount.get(project.slug) || 0) + 1);
  projects.set(String(row.id), { project, units: [] });
}
// Two projects with the same English name: neither gets a page (ambiguous).
for (const [id, entry] of projects) {
  if (slugCount.get(entry.project.slug) > 1) projects.delete(id);
}
console.log(`projects: ${projects.size} of tenant ${TENANT}`);

const seenCodes = new Set();
let cursor = null;
let pages = 0;
let read = 0;
let usable = 0;
let unmatched = 0;
let complete = false;
while (pages < MAX_PAGES) {
  const qs = new URLSearchParams({ client_id: TENANT, purpose: "sell", is_primary: "true", page_size: "16" });
  if (cursor) qs.set("cursor", cursor);
  const body = await getJson(`/public/v1/units?${qs}`);
  const data = body?.data ?? body;
  const units = data?.units;
  const pagination = data?.pagination;
  if (!Array.isArray(units) || typeof pagination?.has_more_next !== "boolean") {
    throw new Error(`page ${pages + 1}: response did not match the pagination contract`);
  }
  pages += 1;
  for (const row of units) {
    const code = String(row?.code || "");
    if (!code || seenCodes.has(code)) continue;
    seenCodes.add(code);
    read += 1;
    const entry = projects.get(String(row?.project_id || ""));
    if (!entry) {
      unmatched += 1;
      continue;
    }
    const unit = toSummaryUnit(row, now);
    if (!unit) continue;
    usable += 1;
    entry.units.push(unit);
  }
  if (pages % 50 === 0) console.log(`pages ${pages}, units ${read}, usable ${usable}`);
  if (!pagination.has_more_next) {
    complete = true;
    break;
  }
  cursor = pagination.next_cursor;
  if (!cursor) throw new Error(`page ${pages}: more results reported without a cursor`);
  await sleep(PAUSE_MS);
}

const out = [];
for (const { project, units } of projects.values()) {
  if (project.soldOut) continue;
  const summary = summarizeProjectUnits(units);
  if (!summary) continue;
  out.push({ ...project, summary });
}
out.sort((a, b) => b.summary.units - a.summary.units || a.slug.localeCompare(b.slug));

const snapshot = {
  generatedAt: now.toISOString(),
  source: "Developer price lists in the LenaAI catalogue, read through the public API (primary units for sale)",
  complete,
  minProjectUnits: MIN_PROJECT_UNITS,
  counts: { apiPages: pages, unitsRead: read, unitsUsable: usable, unitsWithoutProject: unmatched, projects: out.length },
  projects: out,
};
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(snapshot, null, 1)}\n`);
console.log(`complete=${complete} pages=${pages} units=${read} usable=${usable} unmatched=${unmatched} projects=${out.length} → ${OUT}`);
if (!complete) process.exitCode = 2;
