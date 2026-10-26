import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { isPubliclyVisible, isPreviewOnly } from "./status";
import { getCities } from "./cities";

const CONTENT_ROOT = path.join(process.cwd(), "content", "guides");

function readMarkdownFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  const slug = data.slug || deriveSlugFromPath(filePath);
  return {
    ...data,
    slug,
    body: content.trim(),
    filePath,
  };
}

function deriveSlugFromPath(filePath) {
  const rel = path.relative(CONTENT_ROOT, filePath).replace(/\\/g, "/");
  const withoutExt = rel.replace(/\.md$/, "");
  if (withoutExt.endsWith("/index")) {
    return `/guides/${withoutExt.replace(/\/index$/, "")}/`;
  }
  return `/guides/${withoutExt}/`;
}

function walkMarkdown(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith("_")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkMarkdown(full, files);
    else if (entry.name.endsWith(".md")) files.push(full);
  }
  return files;
}

let _cache = null;

export function loadAllGuides({ includePreview = false } = {}) {
  const files = walkMarkdown(CONTENT_ROOT);
  const guides = files.map(readMarkdownFile);
  if (includePreview) return guides;
  return guides.filter((g) => isPubliclyVisible(g));
}

export function loadAllGuidesIncludingDrafts() {
  return loadAllGuides({ includePreview: true });
}

export function getGuideBySlug(slug, { allowPreview = false } = {}) {
  const normalized = normalizeSlug(slug);
  const all = loadAllGuidesIncludingDrafts();
  const match = all.find((g) => normalizeSlug(g.slug) === normalized);
  if (!match) return null;
  if (!allowPreview && isPreviewOnly(match)) return null;
  return match;
}

export function normalizeSlug(slug) {
  if (!slug) return "";
  let s = String(slug).trim();
  if (!s.startsWith("/")) s = `/${s}`;
  if (!s.endsWith("/")) s = `${s}/`;
  return s;
}

export function getCityHub(cityId, opts) {
  return getGuideBySlug(`/guides/${cityId}/`, opts);
}

export function getCityArticles(cityId, opts = {}) {
  const prefix = `/guides/${cityId}/`;
  const list = opts.allowPreview
    ? loadAllGuidesIncludingDrafts()
    : loadAllGuides();
  return list.filter(
    (g) =>
      normalizeSlug(g.slug).startsWith(prefix) &&
      normalizeSlug(g.slug) !== normalizeSlug(prefix),
  );
}

export function getBuyingGuides(opts = {}) {
  const list = opts.allowPreview
    ? loadAllGuidesIncludingDrafts()
    : loadAllGuides();
  return list.filter((g) => normalizeSlug(g.slug).startsWith("/guides/buying/"));
}

export function getCompareGuides(opts = {}) {
  const list = opts.allowPreview
    ? loadAllGuidesIncludingDrafts()
    : loadAllGuides();
  return list.filter((g) =>
    normalizeSlug(g.slug).startsWith("/guides/compare/"),
  );
}

export function getGuidesForSitemap() {
  return loadAllGuides().map((g) => ({
    slug: normalizeSlug(g.slug),
    lastModified: g.date_updated || g.date_published || g.date_planned,
  }));
}

export function getPublishedSummariesForLlms() {
  return loadAllGuides().map((g) => ({
    title: g.title,
    slug: normalizeSlug(g.slug),
    description: g.description,
    city_code: g.city_code || null,
    pillar: g.pillar || null,
  }));
}

export function getEditorialRows() {
  const guides = loadAllGuidesIncludingDrafts();
  const cities = getCities();
  const cityName = (code) =>
    cities.find((c) => c.code === code)?.name_ar || code || "—";

  return guides
    .map((g) => ({
      title: g.title,
      slug: normalizeSlug(g.slug),
      city: cityName(g.city_code),
      city_code: g.city_code || "",
      pillar: g.pillar || "",
      lead_code: g.lead_code || "",
      date_planned: g.date_planned || "",
      status: g.status || "draft",
      missing: Array.isArray(g.missing) ? g.missing : g.missing ? [g.missing] : [],
    }))
    .sort((a, b) => String(a.date_planned).localeCompare(String(b.date_planned)));
}
