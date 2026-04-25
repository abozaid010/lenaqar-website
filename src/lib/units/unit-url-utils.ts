// Utility functions for robust unit URL handling

interface UnitSlugParts {
  type: string;
  project: string;
  code: string;
  unitId?: string | null;
}

const SLUG_ID_MARKER = "--u-";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function cleanSlugPart(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function cleanCodePart(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function sanitizeUnitId(input: string): string {
  return input.replace(/[^a-zA-Z0-9_-]/g, "");
}

function normalizeSlugInput(slug: string): string {
  return (slug || "").trim().replace(/\/+$/g, "").replace(/-+$/g, "");
}

function isDirectUnitId(value: string): boolean {
  if (!value) return false;
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value
    );
  const isHex24 = /^[0-9a-f]{24}$/i.test(value);
  const isNumericId = /^[0-9]+$/.test(value);
  const isLegacyUnderscoreId = value.includes("_") && !value.includes("-");
  return isUuid || isHex24 || isNumericId || isLegacyUnderscoreId;
}

function extractUnitIdFromSlug(slug: string): string | null {
  const markerIndex = slug.lastIndexOf(SLUG_ID_MARKER);
  if (markerIndex === -1) return null;
  const encoded = slug.slice(markerIndex + SLUG_ID_MARKER.length);
  if (!encoded) return null;
  const unitId = sanitizeUnitId(encoded);
  return unitId || null;
}

function unitIdPrefix(unitId: string): string {
  return sanitizeUnitId(unitId).replace(/[-_]/g, "").slice(0, 8).toLowerCase();
}

function getUnitId(unit: any): string | null {
  const raw = unit?.unitId ?? unit?.id ?? null;
  if (!raw) return null;
  const cleaned = sanitizeUnitId(String(raw));
  return cleaned || null;
}

// Slug format (v2, deterministic + reversible):
//   <type>-<project>-<code>--u-<unitId>
// This makes slug resolution independent from fragile cache matching.
export function generateUnitSlug(unit: {
  buildingType?: string | null;
  project?: string | null;
  code?: string | null;
  unitId?: string | null;
}): string {
  const type = cleanSlugPart(unit.buildingType || "property") || "property";
  const project = cleanSlugPart(unit.project || "unknown") || "unknown";

  let code = cleanCodePart(unit.code || "");
  if (!code && unit.unitId) {
    code = unitIdPrefix(String(unit.unitId)) || "unknown";
  }
  if (!code) code = "unknown";

  const safeUnitId = unit.unitId ? sanitizeUnitId(String(unit.unitId)) : "";
  const base = `${type}-${project}-${code}`;

  return safeUnitId ? `${base}${SLUG_ID_MARKER}${safeUnitId}` : base;
}

export function parseUnitSlug(slug: string): UnitSlugParts {
  const normalized = normalizeSlugInput(slug);
  const extractedUnitId = extractUnitIdFromSlug(normalized);
  const base = extractedUnitId
    ? normalized.slice(0, normalized.lastIndexOf(SLUG_ID_MARKER))
    : normalized;
  const parts = base.split("-").filter(Boolean);

  const code = parts.length > 0 ? parts[parts.length - 1] : "unknown";
  const type = parts.length > 1 ? parts[0] : "property";
  const project =
    parts.length > 2
      ? parts.slice(1, parts.length - 1).join("-")
      : parts.length === 2
      ? parts[1]
      : "unknown";

  return {
    type,
    project,
    code,
    unitId: extractedUnitId,
  };
}

const slugToUnitIdCache = new Map<string, string>();
let cacheTimestamp = 0;
let cachePromise: Promise<void> | null = null;

function isCacheExpired(): boolean {
  return Date.now() - cacheTimestamp > CACHE_TTL_MS;
}

async function buildSlugMapping(): Promise<void> {
  // If cache is already being built, return the existing promise
  if (cachePromise) {
    return cachePromise;
  }

  // Create and store the cache building promise
  cachePromise = (async () => {
    try {
      const { getUnits } = await import("@/lib/units/unit-api");
      const response = await getUnits();
      const units = response?.data?.units;

      if (response?.status && Array.isArray(units) && units.length > 0) {
        slugToUnitIdCache.clear();

        units.forEach((unit: any) => {
          const resolvedUnitId = getUnitId(unit);
          if (!resolvedUnitId) return;

          const buildingType = unit?.buildingType ?? unit?.building_type ?? null;
          const project =
            unit?.project ??
            unit?.projectName ??
            unit?.project_name ??
            unit?.project_en_name ??
            null;
          const code = unit?.code ?? unit?.referenceCode ?? unit?.reference_code ?? null;

          const canonical = generateUnitSlug({
            buildingType,
            project,
            code,
            unitId: resolvedUnitId,
          });
          slugToUnitIdCache.set(canonical, resolvedUnitId);

          // Backward compatibility for legacy slugs:
          // 1) old "type-project-code" format
          const oldStyle = `${cleanSlugPart(buildingType || "property")}-${
            cleanSlugPart(project || "unknown")
          }-${cleanCodePart(code || unitIdPrefix(resolvedUnitId) || "unknown")}`;
          slugToUnitIdCache.set(oldStyle, resolvedUnitId);

          // 2) project-code and -project-code aliases used in older URLs
          const cleanProject = cleanSlugPart(project || "");
          const cleanCode = cleanCodePart(code || "");
          if (cleanProject && cleanCode) {
            slugToUnitIdCache.set(`${cleanProject}-${cleanCode}`, resolvedUnitId);
            slugToUnitIdCache.set(`-${cleanProject}-${cleanCode}`, resolvedUnitId);
          }
        });

        cacheTimestamp = Date.now();
      }
    } catch (error) {
      // Keep prior cache when refresh fails.
      console.error("Error building slug mapping:", error);
    } finally {
      // Clear the promise when done (whether success or failure)
      cachePromise = null;
    }
  })();

  return cachePromise;
}

export async function refreshSlugCache(): Promise<void> {
  cacheTimestamp = 0;
  await buildSlugMapping();
}

export async function findUnitBySlug(slug: string): Promise<string | null> {
  try {
    const normalizedSlug = normalizeSlugInput(slug);
    if (!normalizedSlug) return null;

    const embeddedUnitId = extractUnitIdFromSlug(normalizedSlug);
    if (embeddedUnitId) return embeddedUnitId;

    if (isDirectUnitId(normalizedSlug)) return normalizedSlug;

    if (slugToUnitIdCache.size === 0 || isCacheExpired()) {
      await buildSlugMapping();
    }

    if (slugToUnitIdCache.has(normalizedSlug)) {
      return slugToUnitIdCache.get(normalizedSlug) || null;
    }

    // Try unique prefix fallback for partially copied legacy slugs.
    const matches: string[] = [];
    for (const key of slugToUnitIdCache.keys()) {
      if (key.startsWith(normalizedSlug)) matches.push(key);
      if (matches.length > 1) break;
    }
    if (matches.length === 1) {
      return slugToUnitIdCache.get(matches[0]) || null;
    }

    return null;
  } catch (error) {
    console.error("Error finding unit by slug:", error);
    return null;
  }
}

export function getUnitUrl(unit: {
  unitId?: string | null;
  buildingType?: string | null;
  project?: string | null;
  code?: string | null;
}): string {
  if (!unit.unitId) {
    return "/units/not-found";
  }
  return `/units/${generateUnitSlug(unit)}`;
}
