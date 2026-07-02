"use client";

import LenaTextField from "@/components/ui/inputs/lena-text-field";
import SearchableDropdownSelect from "@/components/ui/inputs/searchable-dropdown-select";
import SearchableProjectSelect from "@/components/ui/inputs/searchable-project-select";
import SearchableCitySelect from "@/components/ui/inputs/searchable-city-select";
import SearchableDistrictSelect from "@/components/ui/inputs/searchable-district-select";
import SearchableSubDistrictSelect from "@/components/ui/inputs/searchable-sub-district-select";
import { useI18n } from "@/hooks/useI18n";
import { getBuildingTypeOptions } from "@/lib/enums/buildingTypes";
import { useLocaleConstants } from "@/utils/localeConstants";
import { normalizeViewTypeValue } from "@/data/constants";
import { useProjectsNames } from "@/hooks/use-admin-shared-data";
import ProjectsNamesManager from "@/utils/projects_names_manager";
import CityManager from "@/utils/city_manager";
import {
  convertArabicToEnglishNumbers,
} from "@/utils/formatters";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/** Display value for numeric fields – 0 is valid; empty shows "". */
function numericValue(v) {
  return v === 0 || (v != null && v !== "") ? String(v) : "";
}

export default function BasicDetailsStep({
  clientId,
  formData,
  updateFormData,
  citiesAndDistricts: _citiesAndDistricts, // Keep for backward compatibility but don't use
  invalidFields = [],
  setInvalidFields = () => { },
  developers = [],
  developersLoading = false,
  isEdit = false,
}) {
  const { t, locale, translate } = useI18n();
  const { getViewTypes } = useLocaleConstants();
  const cityManager = CityManager.getInstance();

  const [locationFromProject, setLocationFromProject] = useState(false);
  const didNormalizeLocation = useRef(false);

  const { data: projectsData, isLoading: isLoadingProjectsFromApi } = useProjectsNames(false);

  useEffect(() => {
    if (Array.isArray(projectsData) && projectsData.length > 0) {
      ProjectsNamesManager.getInstance().setProjects(projectsData);
    }
  }, [projectsData]);

  const allProjects = useMemo(() => Array.isArray(projectsData) ? projectsData : [], [projectsData]);

  // Normalize existing city/district to canonical API values once (edit / pre-filled units)
  useEffect(() => {
    if (didNormalizeLocation.current) return;
    if (!formData.city && !formData.district && !formData.sub_district) return;

    let cancelled = false;
    (async () => {
      try {
        const nextCity = await cityManager.normalizeCityValueAsync(formData.city);
        const nextDistrict = formData.district
          ? await cityManager.normalizeDistrictValueAsync(
              formData.district,
              formData.city || nextCity
            )
          : "";
        const nextSubDistrict =
          formData.sub_district && (nextDistrict || formData.district)
            ? await cityManager.normalizeSubDistrictValueAsync(
                formData.sub_district,
                formData.city || nextCity,
                formData.district || nextDistrict
              )
            : "";

        const patch = {};
        if (nextCity && nextCity !== formData.city) patch.city = nextCity;
        if (nextDistrict && nextDistrict !== formData.district) {
          patch.district = nextDistrict;
        }
        if (nextSubDistrict && nextSubDistrict !== formData.sub_district) {
          patch.sub_district = nextSubDistrict;
        }
        if (!cancelled && Object.keys(patch).length) {
          updateFormData(patch);
        }
      } catch (error) {
        console.error("Failed to normalize location:", error);
      } finally {
        if (!cancelled) didNormalizeLocation.current = true;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [formData.city, formData.district, formData.sub_district, cityManager, updateFormData]);

  useEffect(() => {
    const selected = allProjects.find(
      (p) => p.en_name === formData.project || p.name === formData.project
    );
    if (selected?.id) {
      const idStr = String(selected.id);
      // Sync project_id when project name matches (e.g. editing ai_generated unit)
      if (!formData.project_id || String(formData.project_id) !== idStr) {
        updateFormData({ project_id: idStr });
      }
    }
  }, [formData.project, formData.project_id, allProjects]);

  const handleChange = (e, dataInput = "") => {
    const { name, value, type, checked } = e.target;
    let updatedValue;

    if (type === "checkbox") {
      updatedValue = checked;
    } else if (dataInput === "number") {
      const englishValue = String(convertArabicToEnglishNumbers(value));
      const rawValue = englishValue.replace(/\D/g, "");
      updatedValue = rawValue === "" ? "" : Number(rawValue);
    } else {
      updatedValue = value;
    }

    if (name === "view") {
      updatedValue = normalizeViewTypeValue(updatedValue);
    }

    updateFormData({ [name]: updatedValue });

    if (invalidFields.includes(name) && (updatedValue === 0 || updatedValue)) {
      setInvalidFields((prev) => prev.filter((field) => field !== name));
    }
  };

  const applyLocationFromProject = useCallback(
    async (proj) => {
      if (!proj) return;
      const rawCity = proj.city ?? "";
      const rawDistrict = proj.district ?? "";
      const rawSubDistrict = proj.sub_district ?? "";
      if (!rawCity && !rawDistrict && !rawSubDistrict) return;

      const nextCity = rawCity
        ? await cityManager.normalizeCityValueAsync(rawCity)
        : "";
      const nextDistrict =
        rawDistrict && (nextCity || rawCity)
          ? await cityManager.normalizeDistrictValueAsync(
              rawDistrict,
              nextCity || rawCity
            )
          : "";
      const nextSubDistrict =
        rawSubDistrict && (nextDistrict || rawDistrict) && (nextCity || rawCity)
          ? await cityManager.normalizeSubDistrictValueAsync(
              rawSubDistrict,
              nextCity || rawCity,
              nextDistrict || rawDistrict
            )
          : "";

      const resolvedSubDistrict = nextSubDistrict || rawSubDistrict || "";
      const patch = {};
      if (nextCity) patch.city = nextCity;
      if (nextDistrict) patch.district = nextDistrict;
      if (resolvedSubDistrict) patch.sub_district = resolvedSubDistrict;

      if (Object.keys(patch).length === 0) return;

      updateFormData(patch);
      setLocationFromProject(
        Boolean(patch.city || patch.district || patch.sub_district)
      );
    },
    [cityManager, updateFormData]
  );

  const handleProjectChange = async (e) => {
    const value = e?.target?.value ?? "";
    const proj = allProjects.find((p) => p.en_name === value || p.name === value);
    updateFormData({
      project: value,
      project_ar: proj?.ar_name ?? "",
      project_id: proj?.id ?? "",
      phase: "",
      developer_id: "",
      developer: "",
    });
    await applyLocationFromProject(proj);
    if (invalidFields.includes("project") && value) {
      setInvalidFields((prev) => prev.filter((field) => field !== "project"));
    }
  };

  const handleCityChange = (e) => {
    const { value } = e.target;
    setLocationFromProject(false);
    updateFormData({
      city: value,
      district: "",
      sub_district: "",
    });
    if (invalidFields.includes("city") && value) {
      setInvalidFields((prev) => prev.filter((field) => field !== "city"));
    }
    if (invalidFields.includes("district")) {
      setInvalidFields((prev) => prev.filter((field) => field !== "district"));
    }
  };

  const handleDistrictChange = (e) => {
    const { value } = e.target;
    setLocationFromProject(false);
    updateFormData({ district: value, sub_district: "" });
    if (invalidFields.includes("district") && value) {
      setInvalidFields((prev) => prev.filter((field) => field !== "district"));
    }
  };

  const handleSubDistrictChange = (e) => {
    const { value } = e.target;
    setLocationFromProject(false);
    updateFormData({ sub_district: value });
  };

  const applyDeveloperFromProject = useCallback(
    async (fullProject) => {
      if (!fullProject || typeof fullProject !== "object") return;
      const devId =
        fullProject.developer_id ??
        fullProject.developerId ??
        fullProject?.developer?.id ??
        fullProject?.developer?.developer_id ??
        "";
      const devName =
        locale === "ar"
          ? fullProject?.developer_ar_name ??
            fullProject?.developer?.ar_name ??
            fullProject?.developer_name_ar ??
            fullProject?.developer_name ??
            fullProject?.developer?.en_name ??
            ""
          : fullProject?.developer_name ??
            fullProject?.developer?.en_name ??
            fullProject?.developer_en_name ??
            fullProject?.developer?.ar_name ??
            "";

      const patch = {};
      if (devId) {
        patch.developer_id = String(devId);
        patch.developer = devName || "";
      }
      if (Object.keys(patch).length) {
        updateFormData(patch);
      }
      await applyLocationFromProject(fullProject);
    },
    [locale, updateFormData, applyLocationFromProject]
  );

  const selectedProjectFromList = useMemo(
    () => allProjects.find((p) => p.en_name === formData.project || p.name === formData.project),
    [allProjects, formData.project]
  );

  // On edit: if project is set but city/district empty, fill from project once
  useEffect(() => {
    if (!isEdit || !selectedProjectFromList) return;
    if (formData.city && formData.district) return;
    applyLocationFromProject(selectedProjectFromList);
  }, [
    isEdit,
    selectedProjectFromList,
    formData.city,
    formData.district,
    formData.sub_district,
    applyLocationFromProject,
  ]);

  const buildingTypeOptions = useMemo(() => getBuildingTypeOptions(translate), [translate]);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-y-3 gap-x-4">
        {/* Unit Title */}
        <div className="col-span-1 md:col-span-2">
          <LenaTextField
            label={translate("basicDetails.unitTitle", t.basicDetails.unitTitle)}
            name="unitTitle"
            required
            value={formData.unitTitle || ""}
            onChange={handleChange}
            placeholder={translate(
              "basicDetails.placeholders.unitTitle",
              t.basicDetails.placeholders.unitTitle
            )}
            error={invalidFields.includes("unitTitle")}
          />
        </div>

        {/* Building Type */}
        <SearchableDropdownSelect
          name="buildingType"
          value={formData.buildingType || ""}
          onChange={handleChange}
          error={invalidFields.includes("buildingType")}
          options={buildingTypeOptions}
          getValue={(opt) => opt.value}
          getLabel={(opt) => opt.label}
          placeholder={translate("basicDetails.buildingType", t.basicDetails.buildingType)}
        />

        {/* Purpose */}
        <SearchableDropdownSelect
          name="purpose"
          value={formData.purpose || ""}
          onChange={handleChange}
          required
          error={invalidFields.includes("purpose")}
          options={[
            {
              value: "sell",
              label: translate(
                "basicDetails.purposes.sell",
                t.basicDetails.purposes.sell
              ),
            },
            {
              value: "rent",
              label: translate(
                "basicDetails.purposes.rent",
                t.basicDetails.purposes.rent
              ),
            },
          ]}
          getValue={(opt) => opt.value}
          getLabel={(opt) => opt.label}
          placeholder={translate("basicDetails.selectPurpose", t.basicDetails.selectPurpose)}
        />

        {/* View */}
        <SearchableDropdownSelect
          name="view"
          value={formData.view || ""}
          onChange={handleChange}
          required
          error={invalidFields.includes("view")}
          options={getViewTypes()}
          getValue={(opt) => opt.value}
          getLabel={(opt) => (locale === "ar" ? opt.ar_label : opt.en_label)}
          placeholder={translate("basicDetails.selectView", t.basicDetails.selectView)}
        />

        {/* code */}
        <LenaTextField
          label={translate("basicDetails.code", t.basicDetails.code)}
          name="code"
          value={formData.code}
          onChange={handleChange}
          placeholder={translate(
            "basicDetails.placeholders.code",
            t.basicDetails.placeholders.code
          )}
        />

        {/* model */}
        <LenaTextField
          label={translate("basicDetails.model", t.basicDetails.model)}
          name="model"
          value={formData.model}
          onChange={handleChange}
        />
      </div>

      <h3 className="text-xl font-semibold mb-3 mt-8 text-slate-800">
        {translate("unitDetails.location", t.unitDetails?.location)}
      </h3>

      <div className="rounded-lg border border-gray-200 p-4 sm:p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-4">
          <SearchableCitySelect
            name="city"
            label={translate("basicDetails.city", t.basicDetails.city)}
            value={formData.city || ""}
            onChange={handleCityChange}
            placeholder={translate("basicDetails.selectCity", t.basicDetails.selectCity)}
          />

          <SearchableDistrictSelect
            name="district"
            label={translate("basicDetails.district", t.basicDetails.district)}
            value={formData.district || ""}
            onChange={handleDistrictChange}
            city={formData.city || ""}
            disabled={!formData.city}
            placeholder={
              !formData.city
                ? translate("basicDetails.selectCityFirst", t.basicDetails.selectCityFirst)
                : translate("basicDetails.selectDistrict", t.basicDetails.selectDistrict)
            }
          />

          <SearchableSubDistrictSelect
            name="sub_district"
            label={translate("basicDetails.subDistrict", t.basicDetails?.subDistrict)}
            value={formData.sub_district || ""}
            onChange={handleSubDistrictChange}
            city={formData.city || ""}
            district={formData.district || ""}
            disabled={!formData.city || !formData.district}
            placeholder={
              !formData.city
                ? translate("basicDetails.selectCityFirst", t.basicDetails.selectCityFirst)
                : !formData.district
                  ? translate(
                      "basicDetails.selectDistrictFirst",
                      t.basicDetails?.selectDistrictFirst
                    )
                  : translate(
                      "basicDetails.selectSubDistrict",
                      t.basicDetails?.selectSubDistrict
                    )
            }
          />

          <SearchableProjectSelect
            name="project"
            label={translate("basicDetails.compound", t.basicDetails.compound)}
            value={formData.project || ""}
            onChange={handleProjectChange}
            onProjectSelect={applyDeveloperFromProject}
            projects={allProjects}
            isLoading={isLoadingProjectsFromApi}
            required
            error={invalidFields.includes("project")}
            placeholder={translate("basicDetails.selectCompound", t.basicDetails.selectCompound)}
          />
        </div>

        {locationFromProject && (formData.city || formData.district || formData.sub_district) ? (
          <p className="mt-3 text-xs text-gray-500">
            {translate(
              "basicDetails.locationFromProject",
              t.basicDetails.locationFromProject
            )}
          </p>
        ) : null}
      </div>

      <h3 className="text-xl font-semibold mb-3 mt-8 text-slate-800">
        {translate("basicDetails.propertySpecs", t.basicDetails.propertySpecs)}
      </h3>

      <div className="grid grid-cols-2 gap-x-2 md:grid-cols-3 gap-y-3 md:gap-x-4">
        {formData.buildingType !== "office" && (
          <>
            {/* Rooms */}
            <div>
              <LenaTextField
                label={t.basicDetails.rooms}
                name="roomsCount"
                required
                value={numericValue(formData.roomsCount)}
                onChange={handleChange}
                placeholder="0"
                error={invalidFields.includes("roomsCount")}
                type="number"
              />
            </div>
            {/* Bathrooms */}
            <LenaTextField
              label={translate("basicDetails.bathrooms", t.basicDetails.bathrooms)}
              name="bathroomCount"
              required
              value={numericValue(formData.bathroomCount)}
              onChange={(e) => handleChange(e, "number")}
              placeholder="0"
              error={invalidFields.includes("bathroomCount")}
              type="number"
            />
          </>
        )}

        {/* Floor */}
        <LenaTextField
          label={translate("basicDetails.floor", t.basicDetails.floor)}
          name="floor"
          value={numericValue(formData.floor)}
          onChange={(e) => handleChange(e, "number")}
          placeholder="0"
          type="number"
        />

        {/* Land Area (area) - required */}
        <LenaTextField
          label={`${translate("basicDetails.landArea", t.basicDetails.landArea)} (m²)`}
          name="landArea"
          value={numericValue(formData.landArea)}
          onChange={(e) => handleChange(e, "number")}
          placeholder="0"
          type="number"
          required
          error={invalidFields.includes("landArea")}
        />

        {/* Garden Size */}
        {formData.buildingType !== "office" && (
          <LenaTextField
            label={`${translate("basicDetails.gardenSize", t.basicDetails.gardenSize)} (m²)`}
            name="gardenSize"
            value={numericValue(formData.gardenSize)}
            onChange={(e) => handleChange(e, "number")}
            placeholder="0"
            type="number"
          />
        )}

        {/* Outdoor Area */}
        <LenaTextField
          label={`${translate(
            "basicDetails.outdoorArea",
            t.basicDetails.outdoorArea 
          )} (m²)`}
          name="outdoor_area"
          value={numericValue(formData.outdoor_area)}
          onChange={(e) => handleChange(e, "number")}
          placeholder="0"
          type="number"
        />
      </div>

    </>
  );
}
