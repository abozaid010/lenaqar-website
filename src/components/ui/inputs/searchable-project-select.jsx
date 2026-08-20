"use client";

import { useMemo, useCallback } from "react";
import { useI18n } from "@/hooks/useI18n";
import SearchableDropdownSelect from "./searchable-dropdown-select";

export default function SearchableProjectSelect({
  value = "",
  onChange,
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
  projects: projectsProp = [],
  isLoading = false,
  city = "",
  district = "",
  subDistrict = "",
  ...rest
}) {
  const { locale, translate } = useI18n();
  const allProjects = Array.isArray(projectsProp) ? projectsProp : [];

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

      if (normalizedCity && projectCity !== normalizedCity) return false;
      if (normalizedDistrict && projectDistrict !== normalizedDistrict) return false;
      if (normalizedSubDistrict && projectSubDistrict !== normalizedSubDistrict) return false;
      return true;
    });
  }, [allProjects, city, district, subDistrict]);

  const handleChange = useCallback(
    (e) => {
      onChange?.(e);
      if (!onProjectSelect || !e?.target?.value) return;
      const selectedValue = e.target.value;
      const option = projects.find(
        (p) => p.en_name === selectedValue || p.ar_name === selectedValue,
      );
      if (option) onProjectSelect(option);
    },
    [onChange, onProjectSelect, projects],
  );

  const sortProjects = useMemo(
    () => (options, currentLocale) =>
      [...options].sort((a, b) => {
        const nameA = currentLocale === "ar" ? a.ar_name : a.en_name;
        const nameB = currentLocale === "ar" ? b.ar_name : b.en_name;
        return (nameA || "").trim().localeCompare((nameB || "").trim(), currentLocale, {
          sensitivity: "base",
        });
      }),
    [],
  );

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
      placeholder={placeholder || translate("lenaqar.buyRequest.selectProject", "Select project")}
      showAllOption={showAllOption}
      allOptionLabel={allOptionLabel || translate("lenaqar.buyRequest.selectProject", "Select project")}
      getValue={(project) => project.en_name}
      getLabel={(project, currentLocale) =>
        currentLocale === "ar" ? project.ar_name : project.en_name
      }
      getKey={(project) => {
        if (project.id) return `project-${project.id}`;
        if (project.en_name && project.ar_name) {
          return `project-${project.en_name}-${project.ar_name}`;
        }
        return `project-${project.en_name || "unknown"}`;
      }}
      searchFields={["ar_name", "en_name"]}
      sortOptions={sortProjects}
      loadingText={locale === "ar" ? "جاري التحميل..." : "Loading projects..."}
      noResultsText={locale === "ar" ? "لا توجد نتائج" : "No projects found"}
      searchPlaceholder={locale === "ar" ? "ابحث عن المشروع..." : "Search projects..."}
      className={className}
      disabled={disabled}
      isLoading={isLoading}
      {...rest}
    />
  );
}
