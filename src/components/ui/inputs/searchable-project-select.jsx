"use client";

import { useMemo, useCallback, useState } from "react";
import { useI18n } from "@/context/translate-api";
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
  ...rest
}) {
  const { t, locale } = useI18n();
  const [fetchingId, setFetchingId] = useState(null);

  // Fetch lightweight projects if not provided as prop (all project names for search)
  const { data: fetchedProjects, isLoading: fetchedLoading } = useProjectsNames(
    isPublic
  );

  const projects = projectsProp || fetchedProjects || [];
  const isLoading = isLoadingProp !== undefined ? isLoadingProp : fetchedLoading;

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
      placeholder={placeholder || t.unitsFilter?.allCompounds || "All Projects"}
      showAllOption={showAllOption}
      allOptionLabel={allOptionLabel || t.unitsFilter?.allCompounds || "All Projects"}
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
      isLoading={isLoading}
      loadingText={locale === "ar" ? "جاري التحميل..." : "Loading projects..."}
      noResultsText={locale === "ar" ? "لا توجد نتائج" : "No projects found"}
      searchPlaceholder={locale === "ar" ? "ابحث عن المشروع..." : "Search projects..."}
      className={className}
      disabled={isDisabled}
      isLoading={isLoading || !!fetchingId}
      {...rest}
    />
  );
}
