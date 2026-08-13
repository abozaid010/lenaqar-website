"use client";

import { useMemo, useCallback, useState, useEffect } from "react";
import { useI18n } from "@/hooks/useI18n";
import { useProjectsNames } from "@/hooks/use-admin-shared-data";
import { fetchProjectById } from "@/utils/api";
import SearchableDropdownSelect from "./searchable-dropdown-select";

/**
 * SearchableProjectSelect - A reusable project selection component with search functionality
 * Wrapper around SearchableDropdownSelect with project-specific configuration
 * Loads all projects (via fetchProjectsNames). Optional onProjectSelect: when user selects
 * a project, fetches full project by id and calls onProjectSelect(fullProject).
 *
 * @param {string} value - Selected project value (en_name)
 * @param {Function} onChange - Callback when project changes: (event) => void
 * @param {Function} onProjectSelectStart - Optional: (option) => void. Called immediately when user selects an option (before fetch), so parent can show loading at position 0.
 * @param {Function} onProjectSelect - Optional: (fullProject) => void. When set, on selection fetches project by id and calls with full project (for appending to list without affecting pagination).
 * @param {string} name - Input name attribute
 * @param {string} label - Label text (optional)
 * @param {boolean} required - Whether field is required
 * @param {boolean} error - Whether to show error state
 * @param {string} errorMessage - Error message to display
 * @param {string} placeholder - Placeholder text
 * @param {boolean} showAllOption - Show "All Projects" option (for filters)
 * @param {string} allOptionLabel - Label for "All Projects" option
 * @param {string} className - Additional CSS classes
 * @param {boolean} disabled - Whether the select is disabled
 * @param {Array} projects - Array of project objects (optional, will fetch if not provided)
 * @param {boolean} isPublic - Whether to fetch public projects (used if projects not provided)
 * @param {boolean} isLoading - Loading state (used if projects not provided)
 * @param {string} city - Optional city value to scope projects
 * @param {string} district - Optional district value to scope projects
 * @param {string} subDistrict - Optional sub-district value to scope projects
 */
export default function SearchableProjectSelect({
  value = "",
  onChange,
  onProjectSelectStart,
  onProjectSelect,
  name = "project",
  label,
  required = false,
  error = false,
  errorMessage = "",
  placeholder,
  showAllOption = false,
  allOptionLabel,
  className = "",
  disabled = false,
  projects: projectsProp,
  isPublic = false,
  isLoading: isLoadingProp,
  city = "",
  district = "",
  subDistrict = "",
  ...rest
}) {
  const { locale, translate } = useI18n();
  const [fetchingId, setFetchingId] = useState(null);

  // Fetch lightweight projects if not provided as prop (all project names for search)
  const { data: fetchedProjects, isLoading: fetchedLoading } = useProjectsNames(
    isPublic,
    { enabled: projectsProp == null },
  );

  const allProjects = projectsProp || fetchedProjects || [];
  const isLoading = isLoadingProp !== undefined ? isLoadingProp : fetchedLoading;

  const projects = useMemo(() => {
    const normalizedCity = city && city !== "all" ? String(city).toLowerCase().trim() : "";
    const normalizedDistrict =
      district && district !== "all" ? String(district).toLowerCase().trim() : "";
    const normalizedSubDistrict =
      subDistrict && subDistrict !== "all"
        ? String(subDistrict).toLowerCase().trim()
        : "";

    if (!normalizedCity && !normalizedDistrict && !normalizedSubDistrict) {
      return allProjects;
    }

    return allProjects.filter((project) => {
      const projectCity = project.city ? String(project.city).toLowerCase().trim() : "";
      const projectDistrict = project.district
        ? String(project.district).toLowerCase().trim()
        : "";
      const projectSubDistrict = project.sub_district
        ? String(project.sub_district).toLowerCase().trim()
        : "";

      if (normalizedCity && projectCity !== normalizedCity) {
        return false;
      }
      if (normalizedDistrict && projectDistrict !== normalizedDistrict) {
        return false;
      }
      if (normalizedSubDistrict && projectSubDistrict !== normalizedSubDistrict) {
        return false;
      }
      return true;
    });
  }, [allProjects, city, district, subDistrict]);

  const [resolvedLabel, setResolvedLabel] = useState("");

  useEffect(() => {
    let active = true;
    const loadLabel = async () => {
      if (!value) {
        if (active) setResolvedLabel("");
        return;
      }
      const normalized = String(value).toLowerCase().trim();
      const match =
        allProjects.find(
          (p) => String(p.en_name || "").toLowerCase().trim() === normalized
        ) ||
        allProjects.find((p) => p.ar_name === value || p.ar_name === value.trim());

      if (match) {
        const label =
          locale === "ar"
            ? match.ar_name || match.en_name || ""
            : match.en_name || match.ar_name || "";
        if (active) setResolvedLabel(label);
        return;
      }

      if (active) setResolvedLabel("");
    };
    loadLabel();
    return () => {
      active = false;
    };
  }, [value, locale, allProjects]);

  const resolveSelectedLabel = useCallback(
    (selectedValue, currentLocale) => {
      const normalized = String(selectedValue).toLowerCase().trim();
      const pool = projects.length ? projects : allProjects;
      const match =
        pool.find(
          (p) => String(p.en_name || "").toLowerCase().trim() === normalized
        ) ||
        allProjects.find(
          (p) => p.ar_name === selectedValue || p.ar_name === String(selectedValue).trim()
        );
      if (match) {
        return currentLocale === "ar"
          ? match.ar_name || match.en_name || ""
          : match.en_name || match.ar_name || "";
      }
      return currentLocale === locale ? resolvedLabel : "";
    },
    [projects, allProjects, resolvedLabel, locale]
  );

  const handleChange = useCallback(
    (e) => {
      onChange?.(e);
      if (!onProjectSelect || !e?.target?.value) return;
      const selectedValue = e.target.value;
      const option = projects.find(
        (p) => (p.en_name === selectedValue) || (p.ar_name === selectedValue)
      );
      if (!option?.id) return;
      onProjectSelectStart?.(option);
      setFetchingId(option.id);
      fetchProjectById(option.id, isPublic)
        .then((res) => {
          if (res?.data) onProjectSelect(res.data);
        })
        .catch(() => {
          onProjectSelect(null);
        })
        .finally(() => setFetchingId(null));
    },
    [onChange, onProjectSelectStart, onProjectSelect, projects, isPublic]
  );

  // Custom sort function for projects
  const sortProjects = useMemo(() => {
    return (options, locale) => {
      return [...options].sort((a, b) => {
        const nameA = locale === "ar" ? a.ar_name : a.en_name;
        const nameB = locale === "ar" ? b.ar_name : b.en_name;
        return (nameA || "").trim().localeCompare((nameB || "").trim(), locale, {
          sensitivity: "base",
        });
      });
    };
  }, []);

  const isDisabled = disabled || !!fetchingId;

  return (
    <SearchableDropdownSelect
      options={projects}
      value={value}
      onChange={handleChange}
      name={name}
      label={label}
      required={required}
      error={error}
      errorMessage={errorMessage}
      placeholder={placeholder || translate("unitsFilter.allCompounds", "All Projects")}
      showAllOption={showAllOption}
      allOptionLabel={allOptionLabel || translate("unitsFilter.allCompounds", "All Projects")}
      getValue={(project) => project.en_name}
      getLabel={(project, locale) => locale === "ar" ? project.ar_name : project.en_name}
      getKey={(project) => {
        // Prioritize unique ID
        if (project.id) return `project-${project.id}`;
        // Use combination of fields as fallback to ensure uniqueness
        if (project.en_name && project.ar_name) {
          return `project-${project.en_name}-${project.ar_name}`;
        }
        // Last resort: use en_name with client_id if available
        if (project.en_name) {
          return `project-${project.client_id || 'default'}-${project.en_name}`;
        }
        // Final fallback (should rarely happen)
        return `project-unknown-${project.city || ''}-${project.district || ''}`;
      }}
      searchFields={["ar_name", "en_name"]}
      sortOptions={sortProjects}
      loadingText={locale === "ar" ? "جاري التحميل..." : "Loading projects..."}
      noResultsText={locale === "ar" ? "لا توجد نتائج" : "No projects found"}
      searchPlaceholder={locale === "ar" ? "ابحث عن المشروع..." : "Search projects..."}
      className={className}
      disabled={isDisabled}
      isLoading={isLoading || !!fetchingId}
      resolveSelectedLabel={resolveSelectedLabel}
      {...rest}
    />
  );
}
