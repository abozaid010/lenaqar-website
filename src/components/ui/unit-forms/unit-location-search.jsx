"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import SearchableDropdownSelect from "@/components/ui/inputs/searchable-dropdown-select";
import { useI18n } from "@/hooks/useI18n";
import { useProjectsNames } from "@/hooks/use-admin-shared-data";
import { fetchProjectById } from "@/utils/api";
import CityManager from "@/utils/city_manager";

function normalizeQuery(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u064B-\u065F]/g, "")
    .trim();
}

function joinPath(parts) {
  return parts.filter(Boolean).join(" › ");
}

function matchesBlob(haystack, query) {
  const q = normalizeQuery(query);
  if (!q) return true;
  if (haystack.includes(q)) return true;
  const words = q.split(/\s+/).filter((w) => w.length >= 2 || q.length <= 3);
  if (words.length === 0) return true;
  return words.every((word) => haystack.includes(word));
}

function optionKey(kind, parts) {
  return `${kind}:${parts.map((p) => normalizeQuery(p)).join("|")}`;
}

/**
 * Single searchable field for unit location + project.
 * Search matches city / district / sub-district / project names (and aliases).
 * Picking a project fills all four; picking a location fills hierarchy and keeps project pick next.
 */
export default function UnitLocationSearch({
  formData,
  onSelectProject,
  onSelectLocation,
  required = false,
  error = false,
  errorMessage = "",
  disabled = false,
  isPublic = false,
  /** auth = CRM names, feed = resale inventory, catalog = all public compounds */
  projectSource,
  hydrateSelectedProject,
  showHint = true,
  showHierarchySummary = true,
  showAllOption = false,
  allOptionLabel,
  label,
  placeholder,
  name = "unit_location_search",
  className = "flex flex-col gap-2 md:col-span-2",
  buttonClassName = "",
}) {
  const { locale, translate } = useI18n();
  const cityManager = CityManager.getInstance();
  const source = projectSource || (isPublic ? "feed" : "auth");
  const shouldHydrateProject =
    hydrateSelectedProject ?? source !== "feed";

  const { data: authProjects, isLoading: authProjectsLoading } = useProjectsNames(
    false,
    { enabled: source === "auth" },
  );
  const { data: feedProjects, isLoading: feedProjectsLoading } = useQuery({
    queryKey: ["lenaqar", "project-names"],
    queryFn: async () => {
      const response = await fetch("/api/lenaqar/project-names");
      if (!response.ok) return [];
      const json = await response.json();
      const rows = json?.data ?? json;
      return Array.isArray(rows) ? rows : [];
    },
    enabled: source === "feed",
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
  const { data: catalogProjects, isLoading: catalogProjectsLoading } = useQuery({
    queryKey: ["lenaqar", "catalog-projects"],
    queryFn: async () => {
      const response = await fetch("/api/lenaqar/catalog-projects");
      if (!response.ok) return [];
      const json = await response.json();
      const rows = json?.data ?? json;
      return Array.isArray(rows) ? rows : [];
    },
    enabled: source === "catalog",
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
  const projectsData =
    source === "catalog"
      ? catalogProjects
      : source === "feed"
        ? feedProjects
        : authProjects;
  const projectsLoading =
    source === "catalog"
      ? catalogProjectsLoading
      : source === "feed"
        ? feedProjectsLoading
        : authProjectsLoading;

  const [geoLoading, setGeoLoading] = useState(true);
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [subDistricts, setSubDistricts] = useState([]);
  const [fetchingProject, setFetchingProject] = useState(false);

  const allProjects = useMemo(
    () => (Array.isArray(projectsData) ? projectsData : []),
    [projectsData],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setGeoLoading(true);
        await cityManager.initializeData();
        if (cancelled) return;
        setCities(await cityManager.getCities());
        setDistricts(await cityManager.getDistricts());
        setSubDistricts(await cityManager.getSubDistricts());
      } catch (err) {
        console.error("Failed to load location index:", err?.message ?? err);
        if (!cancelled) {
          setCities([]);
          setDistricts([]);
          setSubDistricts([]);
        }
      } finally {
        if (!cancelled) setGeoLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cityManager]);

  const labelFor = useCallback(
    (en, ar) => (locale === "ar" ? ar || en : en || ar) || "",
    [locale],
  );

  const options = useMemo(() => {
    const rows = [];

    for (const city of cities) {
      const label = labelFor(city.en_name, city.ar_name);
      const searchText = normalizeQuery(
        [city.en_name, city.ar_name, city.value].filter(Boolean).join(" "),
      );
      rows.push({
        key: optionKey("city", [city.value]),
        kind: "city",
        value: city.value,
        label,
        path: "",
        kindLabel: translate("basicDetails.city", "City"),
        searchText,
        payload: { city: city.value },
      });
    }

    for (const district of districts) {
      const cityValue = normalizeQuery(district.city_en_name);
      const label = labelFor(district.en_name, district.ar_name);
      const path = labelFor(district.city_en_name, district.city_ar_name);
      const aliases = Array.isArray(district.aliases) ? district.aliases : [];
      const searchText = normalizeQuery(
        [district.en_name, district.ar_name, district.value, path, ...aliases]
          .filter(Boolean)
          .join(" "),
      );
      rows.push({
        key: optionKey("district", [cityValue, district.value]),
        kind: "district",
        value: district.value,
        label,
        path,
        kindLabel: translate("basicDetails.district", "District"),
        searchText,
        payload: { city: cityValue, district: district.value },
      });
    }

    for (const sub of subDistricts) {
      const cityValue = normalizeQuery(sub.city_en_name);
      const districtValue = normalizeQuery(sub.district_value);
      const districtMeta = districts.find(
        (d) =>
          normalizeQuery(d.city_en_name) === cityValue &&
          normalizeQuery(d.value) === districtValue,
      );
      const label = labelFor(sub.en_name, sub.ar_name);
      const path = joinPath([
        labelFor(sub.city_en_name, sub.city_ar_name),
        labelFor(
          districtMeta?.en_name || sub.district_value,
          districtMeta?.ar_name || sub.district_value,
        ),
      ]);
      const aliases = Array.isArray(sub.aliases) ? sub.aliases : [];
      const searchText = normalizeQuery(
        [
          sub.en_name,
          sub.ar_name,
          sub.value,
          sub.city_en_name,
          sub.district_value,
          districtMeta?.en_name,
          districtMeta?.ar_name,
          ...aliases,
        ]
          .filter(Boolean)
          .join(" "),
      );
      rows.push({
        key: optionKey("sub_district", [cityValue, districtValue, sub.value]),
        kind: "sub_district",
        value: sub.value,
        label,
        path,
        kindLabel: translate("basicDetails.subDistrict", "Sub-district"),
        searchText,
        payload: {
          city: cityValue,
          district: districtValue,
          sub_district: sub.value,
        },
      });
    }

    for (const project of allProjects) {
      const enName = project.en_name || project.name || "";
      if (!enName) continue;
      const city = normalizeQuery(project.city);
      const district = normalizeQuery(project.district);
      const sub = normalizeQuery(project.sub_district);
      const label = labelFor(enName, project.ar_name);
      const path = joinPath([city, district, sub]);
      const searchText = normalizeQuery(
        [
          enName,
          project.ar_name,
          city,
          district,
          sub,
          project.id,
          project.developer,
          project.developer_name,
        ]
          .filter(Boolean)
          .join(" "),
      );
      rows.push({
        key: optionKey("project", [project.id || enName]),
        kind: "project",
        value: enName,
        label,
        path,
        kindLabel: translate("basicDetails.compound", "Project"),
        searchText,
        payload: { project },
      });
    }

    // Prefer projects (most specific) then sub-districts, districts, cities.
    const kindRank = { project: 0, sub_district: 1, district: 2, city: 3 };
    return rows.sort((a, b) => {
      const rank = (kindRank[a.kind] ?? 9) - (kindRank[b.kind] ?? 9);
      if (rank !== 0) return rank;
      return a.label.localeCompare(b.label, locale, { sensitivity: "base" });
    });
  }, [cities, districts, subDistricts, allProjects, labelFor, locale, translate]);

  const selectedKey = useMemo(() => {
    if (formData?.project) {
      const proj =
        allProjects.find(
          (p) =>
            p.en_name === formData.project || p.name === formData.project,
        ) || null;
      if (proj) return optionKey("project", [proj.id || proj.en_name]);
      return optionKey("project", [formData.project]);
    }
    if (formData?.sub_district && formData?.city && formData?.district) {
      return optionKey("sub_district", [
        formData.city,
        formData.district,
        formData.sub_district,
      ]);
    }
    if (formData?.district && formData?.city) {
      return optionKey("district", [formData.city, formData.district]);
    }
    if (formData?.city) {
      return optionKey("city", [formData.city]);
    }
    return "";
  }, [formData, allProjects]);

  const selectedSummary = useMemo(() => {
    const parts = [];
    if (formData?.project) {
      const proj = allProjects.find(
        (p) => p.en_name === formData.project || p.name === formData.project,
      );
      parts.push(
        labelFor(formData.project, proj?.ar_name || formData.project_ar),
      );
    }
    const path = joinPath([
      formData?.city,
      formData?.district,
      formData?.sub_district,
    ]);
    return { title: parts[0] || path, path: parts[0] ? path : "" };
  }, [formData, allProjects, labelFor]);

  const handleChange = async (e) => {
    const key = e?.target?.value ?? "";
    if (!key) {
      onSelectLocation?.({
        city: "",
        district: "",
        sub_district: "",
        project: "",
        project_ar: "",
        project_id: "",
      });
      return;
    }
    const opt = options.find((row) => row.key === key);
    if (!opt) return;

    if (opt.kind === "project") {
      const proj = opt.payload.project;
      onSelectProject?.(proj);
      if (shouldHydrateProject && proj?.id) {
        setFetchingProject(true);
        try {
          const res = await fetchProjectById(proj.id, isPublic);
          if (res?.data) onSelectProject?.(res.data, { full: true });
        } catch {
          // Location already applied from list item; developer fill is best-effort.
        } finally {
          setFetchingProject(false);
        }
      }
      return;
    }

    onSelectLocation?.(opt.payload);
  };

  const isLoading = geoLoading || projectsLoading || fetchingProject;
  const resolvedPlaceholder =
    placeholder ||
    translate(
      "basicDetails.locationSearchPlaceholder",
      "Search project, area, district, or city…",
    );

  return (
    <div className={className}>
      <SearchableDropdownSelect
        name={name}
        label={
          label ||
          translate(
            "basicDetails.locationSearchLabel",
            "Location / Project",
          )
        }
        options={options}
        value={selectedKey}
        onChange={handleChange}
        required={required}
        error={error}
        errorMessage={errorMessage}
        disabled={disabled || fetchingProject}
        isLoading={isLoading}
        showAllOption={showAllOption}
        allOptionLabel={allOptionLabel}
        allOptionValue=""
        placeholder={
          showAllOption ? allOptionLabel || resolvedPlaceholder : resolvedPlaceholder
        }
        searchPlaceholder={resolvedPlaceholder}
        noResultsText={translate(
          "basicDetails.locationSearchEmpty",
          "No matching locations or projects",
        )}
        buttonClassName={buttonClassName}
        getValue={(opt) => opt.key}
        getLabel={(opt) => opt.label}
        getKey={(opt) => opt.key}
        searchFields={(opt, query) => matchesBlob(opt.searchText, query)}
        renderOption={(opt, _index, isSelected) => (
          <div className="flex flex-col gap-0.5 min-w-0 text-start">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={`text-sm font-medium truncate ${
                  isSelected ? "text-primary" : "text-gray-900"
                }`}
              >
                {opt.label}
              </span>
              <span className="shrink-0 text-[10px] uppercase tracking-wide text-gray-400">
                {opt.kindLabel}
              </span>
            </div>
            {opt.path ? (
              <span className="text-xs text-gray-500 truncate">{opt.path}</span>
            ) : null}
          </div>
        )}
        resolveSelectedLabel={() => {
          if (!selectedKey && showAllOption) {
            return allOptionLabel || resolvedPlaceholder;
          }
          if (selectedSummary.title && selectedSummary.path) {
            return `${selectedSummary.title} · ${selectedSummary.path}`;
          }
          return selectedSummary.title || "";
        }}
      />
      {showHierarchySummary &&
      (formData?.city || formData?.district || formData?.sub_district) ? (
        <p className="text-xs text-gray-500">
          {translate("basicDetails.city", "City")}:{" "}
          <span className="font-medium text-gray-700">
            {formData.city || "—"}
          </span>
          {" · "}
          {translate("basicDetails.district", "District")}:{" "}
          <span className="font-medium text-gray-700">
            {formData.district || "—"}
          </span>
          {" · "}
          {translate("basicDetails.subDistrict", "Sub-district")}:{" "}
          <span className="font-medium text-gray-700">
            {formData.sub_district || "—"}
          </span>
        </p>
      ) : null}
      {showHint ? (
        <p className="text-xs text-gray-500">
          {translate(
            "basicDetails.locationSearchHint",
            "Select a leaf location: project, sub-district, or a district with no sub-districts. Choosing a project fills city, district, and area.",
          )}
        </p>
      ) : null}
    </div>
  );
}
