// Utility functions for unit URL handling

interface UnitSlugParts {
  type: string;
  project: string;
  code: string;
}

// Generate URL-friendly slug from unit type, project, and code
export function generateUnitSlug(unit: {
  buildingType?: string | null;
  project?: string | null;
  code?: string | null;
  unitId?: string | null;
}): string {
  const type = unit.buildingType || 'property';
  const project = unit.project || 'unknown';
  
  // Handle empty code by using first 4 chars of unit.id
  let code = unit.code;
  if (!code && unit.unitId) {
    // Take first 4 alphanumeric characters from unitId
    code = unit.unitId.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase();
  }
  code = code || 'unknown';
  
  // Clean and normalize each part
  const cleanType = type.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  const cleanProject = project.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  const cleanCode = code.toUpperCase().replace(/[^a-z0-9]/g, '');
  
  return `${cleanType}-${cleanProject}-${cleanCode}`;
}

// Parse slug back to components
export function parseUnitSlug(slug: string): UnitSlugParts {
  const parts = slug.split('-');
  
  // Find the split points - code is typically the last part and is uppercase
  let codeStartIndex = -1;
  for (let i = parts.length - 1; i >= 0; i--) {
    if (parts[i] === parts[i].toUpperCase() && parts[i].length >= 3) {
      codeStartIndex = i;
      break;
    }
  }
  
  if (codeStartIndex === -1) {
    // Fallback: assume last part is code
    codeStartIndex = parts.length - 1;
  }
  
  const code = parts.slice(codeStartIndex).join('-');
  const typeAndProject = parts.slice(0, codeStartIndex);
  
  // Try to split type and project - this is a best effort approach
  let type = 'property';
  let project = 'unknown';
  
  if (typeAndProject.length >= 2) {
    // Assume first part is type, rest is project
    type = typeAndProject[0];
    project = typeAndProject.slice(1).join('-');
  } else if (typeAndProject.length === 1) {
    type = typeAndProject[0];
    project = 'unknown';
  }
  
  return {
    type,
    project,
    code
  };
}

// Cache for slug-to-unitId mapping
const slugToUnitIdCache = new Map<string, string>();

function cleanSlugPart(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function cleanCodePart(input: string): string {
  return input.toUpperCase().replace(/[^a-z0-9]/g, "");
}

// Build slug-to-unitId mapping from units data
async function buildSlugMapping(): Promise<void> {
  try {
    const { getUnits } = await import('@/lib/units/unit-api');
    const response = await getUnits();
    
    if (response.status && response.data.units.length > 0) {
      slugToUnitIdCache.clear();
      
      response.data.units.forEach(unit => {
        if (unit.unitId) {
          const slug = generateUnitSlug({
            buildingType: unit.buildingType,
            project: unit.project,
            code: unit.code,
            unitId: unit.unitId
          });
          slugToUnitIdCache.set(slug, unit.unitId);

          // Backwards compatibility: older links used looser slug formats.
          // Examples seen in the wild: `-ramla-57` (missing type), or `ramla-57`.
          const project = typeof unit.project === "string" ? unit.project : "";
          const code = typeof unit.code === "string" ? unit.code : "";
          const cleanProject = project ? cleanSlugPart(project) : "";
          const cleanCode = code ? cleanCodePart(code) : "";
          if (cleanProject && cleanCode) {
            slugToUnitIdCache.set(`${cleanProject}-${cleanCode}`, unit.unitId);
            slugToUnitIdCache.set(`-${cleanProject}-${cleanCode}`, unit.unitId);
          }
        }
      });
      
      console.log('Built slug mapping with', slugToUnitIdCache.size, 'entries');
    }
  } catch (error) {
    console.error('Error building slug mapping:', error);
  }
}

// Find unit by slug using cached mapping
export async function findUnitBySlug(slug: string): Promise<string | null> {
  try {
    // Support direct unitId usage (older routes sometimes used unitId instead of slug)
    if (slug && (slug.includes("_") || slug.length >= 20)) {
      return slug;
    }

    // Check cache first
    if (slugToUnitIdCache.has(slug)) {
      return slugToUnitIdCache.get(slug) || null;
    }
    
    // Build mapping if cache is empty
    if (slugToUnitIdCache.size === 0) {
      await buildSlugMapping();
    }
    
    // Try cache again
    if (slugToUnitIdCache.has(slug)) {
      return slugToUnitIdCache.get(slug) || null;
    }
    
    // If still not found, rebuild mapping (in case of stale cache)
    await buildSlugMapping();
    
    return slugToUnitIdCache.get(slug) || null;
  } catch (error) {
    console.error('Error finding unit by slug:', error);
    return null;
  }
}

// Get unit URL with new slug format
export function getUnitUrl(unit: {
  unitId?: string | null;
  buildingType?: string | null;
  project?: string | null;
  code?: string | null;
}): string {
  if (!unit.unitId) {
    return '/units/not-found';
  }
  
  const slug = generateUnitSlug(unit);
  return `/units/${slug}`;
}
