"use client";

import { useMemo } from "react";
import { useI18n } from "@/context/translate-api";
import { useCompounds } from "@/hooks/use-admin-shared-data";
import SearchableDropdownSelect from "./searchable-dropdown-select";

/**
 * SearchableProjectSelect - A reusable project selection component with search functionality
 * Wrapper around SearchableDropdownSelect with project-specific configuration
 * 
 * @param {string} value - Selected project value (en_name)
 * @param {Function} onChange - Callback when project changes: (event) => void
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
  
  // Fetch projects if not provided as prop
  const { data: fetchedProjects, isLoading: fetchedLoading } = useCompounds(
    null,
    isPublic
  );
  
  const projects = projectsProp || fetchedProjects || [];
  const isLoading = isLoadingProp !== undefined ? isLoadingProp : fetchedLoading;

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

  return (
    <SearchableDropdownSelect
      options={projects}
      value={value}
      onChange={onChange}
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
      searchFields={["ar_name", "en_name", "description", "ar_description"]}
      sortOptions={sortProjects}
      isLoading={isLoading}
      loadingText={locale === "ar" ? "جاري التحميل..." : "Loading projects..."}
      noResultsText={locale === "ar" ? "لا توجد نتائج" : "No projects found"}
      searchPlaceholder={locale === "ar" ? "ابحث عن المشروع..." : "Search projects..."}
      className={className}
      disabled={disabled}
      {...rest}
    />
  );
}
