/** Max gallery images for the add/edit unit flow (images step + uploader). */
export const MAX_UNIT_IMAGES = 10;

/**
 * Hydrate monthly rent for the rent form from a unit document.
 * Prefers `monthlyRentPrice`; falls back to mirrored `totalPrice` during migration.
 */
export function resolveMonthlyRentFromUnit(unit) {
  if (!unit || typeof unit !== "object") return "";
  const monthly = Number(unit.monthlyRentPrice);
  if (Number.isFinite(monthly) && monthly > 0) return monthly;
  const mirrored = Number(unit.totalPrice);
  if (Number.isFinite(mirrored) && mirrored > 0) return mirrored;
  return "";
}

function asTrimmedString(value) {
  if (value == null) return "";
  return String(value).trim();
}

/**
 * A unit location is valid only when it points at a leaf in the hierarchy:
 * - City → District → Subdistrict → Project
 * - City → District → Subdistrict
 * - City → District → Project (district has no subdistricts)
 * - City → District (district has no subdistricts)
 *
 * Rejects city-only, empty selection, and district when that district has subdistricts.
 */
export async function isValidUnitLocationLeaf(location = {}, cityManager) {
  const project = asTrimmedString(
    location.project || location.project_id || location.projectId
  );
  const city = asTrimmedString(location.city);
  const district = asTrimmedString(location.district);
  const sub_district = asTrimmedString(location.sub_district);

  // Project selected but parents not resolved yet (filled before save).
  if (!city || !district) {
    return Boolean(project);
  }

  if (!cityManager) {
    return Boolean(sub_district || project);
  }

  await cityManager.initializeData();
  const resolved = cityManager.resolveLocationHierarchy
    ? cityManager.resolveLocationHierarchy({ city, district, sub_district })
    : { city, district, sub_district };

  if (!resolved.city || !resolved.district) {
    return Boolean(project);
  }

  const cityObj = await cityManager.getCityByValue(resolved.city);
  if (!cityObj) {
    // Unknown city in catalog — require a deeper node.
    return Boolean(resolved.sub_district || project);
  }

  const subs = await cityManager.getSubDistrictsForCityDistrict(
    cityObj.id,
    resolved.district
  );

  if (subs.length > 0) {
    // District has subdistricts — must select one (project optional).
    return Boolean(resolved.sub_district);
  }

  // District has no subdistricts — district itself is a valid leaf (project optional).
  return true;
}

/**
 * Ensure unit create/update payloads always include location fields and
 * fill missing city/district/sub_district from the selected project when possible.
 */
export async function ensureUnitLocationPayload(payload, {
  cityManager,
  projects = [],
  fetchProjectById,
} = {}) {
  if (!payload || typeof payload !== "object") return payload;

  let city = asTrimmedString(payload.city);
  let district = asTrimmedString(payload.district);
  let sub_district = asTrimmedString(payload.sub_district);
  let project = asTrimmedString(payload.project);
  let project_ar = asTrimmedString(payload.project_ar);
  let project_id = asTrimmedString(payload.project_id || payload.projectId);
  let phase = payload.phase != null ? String(payload.phase) : "";
  let developer = asTrimmedString(payload.developer);
  let developer_id = asTrimmedString(payload.developer_id || payload.developerId);

  const locationIncomplete = !city || !district || !sub_district;
  const projectList = Array.isArray(projects) ? projects : [];

  if ((project_id || project) && locationIncomplete) {
    let proj =
      projectList.find((p) => project_id && String(p?.id) === String(project_id)) ||
      projectList.find(
        (p) =>
          project &&
          (p?.en_name === project || p?.name === project)
      ) ||
      null;

    const needsFullProject =
      project_id &&
      (!proj?.city || !proj?.district || !proj?.sub_district) &&
      typeof fetchProjectById === "function";

    if (needsFullProject) {
      try {
        const res = await fetchProjectById(project_id, false);
        if (res?.data) {
          proj = { ...(proj || {}), ...res.data };
        }
      } catch {
        // Location fill from full project is best-effort.
      }
    }

    if (proj) {
      if (!city && proj.city) city = asTrimmedString(proj.city);
      if (!district && proj.district) district = asTrimmedString(proj.district);
      if (!sub_district && proj.sub_district) {
        sub_district = asTrimmedString(proj.sub_district);
      }
      if (!project) {
        project = asTrimmedString(proj.en_name || proj.name);
      }
      if (!project_ar && proj.ar_name) {
        project_ar = asTrimmedString(proj.ar_name);
      }
      if (!project_id && proj.id) project_id = asTrimmedString(proj.id);

      if (!developer_id) {
        const devId =
          proj.developer_id ??
          proj.developerId ??
          proj?.developer?.id ??
          proj?.developer?.developer_id ??
          "";
        if (devId) developer_id = asTrimmedString(devId);
      }
      if (!developer) {
        developer = asTrimmedString(
          proj.developer_name ||
            proj.developer?.en_name ||
            proj.developer_en_name ||
            proj.developer?.ar_name ||
            ""
        );
      }
    }
  }

  if (cityManager?.resolveLocationHierarchyAsync) {
    const resolved = await cityManager.resolveLocationHierarchyAsync({
      city,
      district,
      sub_district,
    });
    city = resolved.city || city;
    district = resolved.district || district;
    sub_district = resolved.sub_district || sub_district;
  }

  // Always send these keys so the backend receives the full location shape.
  payload.city = city || "";
  payload.district = district || "";
  payload.sub_district = sub_district || "";
  payload.project = project || "";
  payload.project_ar = project_ar || "";
  payload.project_id = project_id || "";
  payload.phase = phase;
  payload.developer = developer || "";
  payload.developer_id = developer_id || "";

  if (cityManager) {
    if (payload.city && cityManager.normalizeCityValueAsync) {
      payload.city = await cityManager.normalizeCityValueAsync(payload.city);
    }
    if (
      payload.district &&
      payload.city &&
      cityManager.normalizeDistrictValueAsync
    ) {
      payload.district = await cityManager.normalizeDistrictValueAsync(
        payload.district,
        payload.city
      );
    }
    if (
      payload.sub_district &&
      payload.city &&
      payload.district &&
      cityManager.normalizeSubDistrictValueAsync
    ) {
      payload.sub_district = await cityManager.normalizeSubDistrictValueAsync(
        payload.sub_district,
        payload.city,
        payload.district
      );
    }
  }

  return payload;
}
