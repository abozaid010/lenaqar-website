import fs from "fs";
import path from "path";
import { MIN_PROJECT_UNITS, PUBLIC_PROJECT_KEYS } from "./project-summary.js";
import { catalogPlaceAr, getArabicLabelMaps } from "./arabic-labels.server";
import { lookupArabicName } from "./arabic-labels";

/**
 * Developer projects for the public /projects pages, read from the snapshot
 * that `scripts/build-project-snapshot.mjs` writes. The pages never call the
 * units API themselves: the developer inventory is about 25k units at 16 per
 * API page, far too many calls for a build or a request.
 */
const SNAPSHOT_FILE = path.join(
  process.cwd(),
  "content",
  "projects",
  "projects-snapshot.json",
);

const EMPTY = { generatedAt: null, complete: false, projects: [] };

let cached = null;

/** Keep only allowlisted keys, whatever the file contains. */
function sanitizeProject(row) {
  const project = {};
  for (const key of PUBLIC_PROJECT_KEYS) {
    if (row?.[key] !== undefined) project[key] = row[key];
  }
  return project;
}

function readSnapshot() {
  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(SNAPSHOT_FILE, "utf8"));
  } catch {
    return EMPTY;
  }
  // An interrupted run would under-count units; never publish it.
  if (raw?.complete !== true || !Array.isArray(raw?.projects)) return EMPTY;
  const projects = raw.projects
    .map(sanitizeProject)
    .filter(
      (project) =>
        project.slug &&
        project.soldOut !== true &&
        Number(project.summary?.units) >= MIN_PROJECT_UNITS,
    );
  return { generatedAt: raw.generatedAt || null, complete: true, projects };
}

export function loadProjectSnapshot() {
  if (!cached) cached = readSnapshot();
  return cached;
}

export function getPublicProjects() {
  return loadProjectSnapshot().projects;
}

export function getPublicProject(slug) {
  const needle = String(slug || "").trim().toLowerCase();
  if (!needle) return null;
  return getPublicProjects().find((project) => project.slug === needle) || null;
}

/** Other projects in the same city, largest first. */
export function relatedProjects(project, limit = 6) {
  if (!project?.city) return [];
  return getPublicProjects()
    .filter((other) => other.city === project.city && other.slug !== project.slug)
    .sort(
      (a, b) =>
        Number(b.district === project.district) - Number(a.district === project.district) ||
        b.summary.units - a.summary.units,
    )
    .slice(0, limit);
}

/** Projects grouped by city, cities and projects largest first. */
export function projectsByCity() {
  const groups = new Map();
  for (const project of getPublicProjects()) {
    const city = project.city || "";
    if (!groups.has(city)) groups.set(city, []);
    groups.get(city).push(project);
  }
  return [...groups]
    .map(([city, projects]) => ({
      city,
      units: projects.reduce((sum, project) => sum + project.summary.units, 0),
      projects: projects.sort((a, b) => b.summary.units - a.summary.units),
    }))
    .sort((a, b) => b.units - a.units);
}

/** Arabic display names for a project, falling back to the catalogue's own. */
export async function projectLabels(project) {
  const maps = await getArabicLabelMaps().catch(() => null);
  return {
    name: project.nameAr || project.nameEn,
    developer:
      lookupArabicName(maps?.developers, project.developer) ||
      project.developer ||
      "",
    city: catalogPlaceAr(project.city) || project.city || "",
    district: catalogPlaceAr(project.district) || project.district || "",
  };
}
