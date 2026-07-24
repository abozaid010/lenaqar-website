"use client";

import LenaTextField from "@/components/ui/inputs/lena-text-field";
import SearchableDropdownSelect from "@/components/ui/inputs/searchable-dropdown-select";
import UnitLocationSearch from "@/components/ui/unit-forms/unit-location-search";
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
  const didFillFromProject = useRef(false);

  const { data: projectsData } = useProjectsNames(false);

  useEffect(() => {
    if (Array.isArray(projectsData) && projectsData.length > 0) {
      ProjectsNamesManager.getInstance().setProjects(projectsData);
    }
  }, [projectsData]);

  const allProjects = useMemo(() => Array.isArray(projectsData) ? projectsData : [], [projectsData]);

  // Resolve full city → district → sub-district hierarchy once (edit / pre-filled units)
  useEffect(() => {
    if (didNormalizeLocation.current) return;
    if (!formData.city && !formData.district && !formData.sub_district) return;

    let cancelled = false;
    (async () => {
      try {
        const resolved = await cityManager.resolveLocationHierarchyAsync({
          city: formData.city || "",
          district: formData.district || "",
          sub_district: formData.sub_district || "",
        });

        const patch = {};
        if (resolved.city && resolved.city !== formData.city) {
          patch.city = resolved.city;
        }
        if (resolved.district && resolved.district !== formData.district) {
          patch.district = resolved.district;
        }
        if (
          resolved.sub_district &&
          resolved.sub_district !== formData.sub_district
        ) {
          patch.sub_district = resolved.sub_district;
        }
        if (!cancelled && Object.keys(patch).length) {
          updateFormData(patch);
        }
      } catch (error) {
        console.error("Failed to normalize location:", error?.message ?? error);
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

    if (name === "roomsCount" && updatedValue !== "" && updatedValue != null) {
      const n = Number(updatedValue);
      if (!Number.isNaN(n)) {
        updatedValue = Math.min(Math.max(0, n), 15);
      }
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

      const resolved = await cityManager.resolveLocationHierarchyAsync({
        city: rawCity,
        district: rawDistrict,
        sub_district: rawSubDistrict,
      });

      const patch = {};
      if (resolved.city) patch.city = resolved.city;
      if (resolved.district) patch.district = resolved.district;
      if (resolved.sub_district) patch.sub_district = resolved.sub_district;

      if (Object.keys(patch).length === 0) return;

      updateFormData(patch);
      setLocationFromProject(
        Boolean(patch.city || patch.district || patch.sub_district)
      );
    },
    [cityManager, updateFormData]
  );

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

  const handleLocationSearchProject = useCallback(
    async (proj, meta = {}) => {
      if (!proj) return;
      const enName = proj.en_name || proj.name || "";
      if (!meta.full) {
        updateFormData({
          project: enName,
          project_ar: proj.ar_name ?? "",
          project_id: proj.id ? String(proj.id) : "",
          phase: "",
          developer_id: "",
          developer: "",
        });
        await applyLocationFromProject(proj);
      } else {
        await applyDeveloperFromProject(proj);
      }
      if (invalidFields.includes("project") && enName) {
        setInvalidFields((prev) => prev.filter((field) => field !== "project"));
      }
    },
    [
      updateFormData,
      applyLocationFromProject,
      applyDeveloperFromProject,
      invalidFields,
      setInvalidFields,
    ],
  );

  const handleLocationSearchLocation = useCallback(
    (payload) => {
      setLocationFromProject(false);
      updateFormData({
        city: payload.city ?? "",
        district: payload.district ?? "",
        sub_district: payload.sub_district ?? "",
        project: payload.project ?? "",
        project_ar: payload.project_ar ?? "",
        project_id: payload.project_id ?? "",
        phase: "",
        developer_id: "",
        developer: "",
      });
    },
    [updateFormData],
  );

  const selectedProjectFromList = useMemo(
    () => allProjects.find((p) => p.en_name === formData.project || p.name === formData.project),
    [allProjects, formData.project]
  );

  // On edit: fill any missing location fields from the selected project once
  useEffect(() => {
    if (!isEdit || !selectedProjectFromList || didFillFromProject.current) return;
    if (formData.city && formData.district && formData.sub_district) {
      didFillFromProject.current = true;
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const proj = selectedProjectFromList;
        const resolved = await cityManager.resolveLocationHierarchyAsync({
          city: proj.city ?? "",
          district: proj.district ?? "",
          sub_district: proj.sub_district ?? "",
        });

        const patch = {};
        if (!formData.city && resolved.city) patch.city = resolved.city;
        if (!formData.district && resolved.district) {
          patch.district = resolved.district;
        }
        if (!formData.sub_district && resolved.sub_district) {
          patch.sub_district = resolved.sub_district;
        }

        if (!cancelled && Object.keys(patch).length) {
          updateFormData(patch);
          setLocationFromProject(true);
        }
      } catch (error) {
        console.error(
          "Failed to fill location from project:",
          error?.message ?? error
        );
      } finally {
        if (!cancelled) didFillFromProject.current = true;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    isEdit,
    selectedProjectFromList,
    formData.city,
    formData.district,
    formData.sub_district,
    cityManager,
    updateFormData,
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
              value: "rent",
              label: translate(
                "basicDetails.purposes.rent",
                t.basicDetails.purposes.rent
              ),
            },
            {
              value: "sell",
              label: translate(
                "basicDetails.purposes.sell",
                t.basicDetails.purposes.sell
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
          placeholder={translate("basicDetails.view", t.basicDetails.view)}
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
          <UnitLocationSearch
            formData={formData}
            onSelectProject={handleLocationSearchProject}
            onSelectLocation={handleLocationSearchLocation}
            required
            error={invalidFields.includes("project")}
          />

          <LenaTextField
            label={translate(
              "basicDetails.phase",
              locale === "ar" ? "المرحلة / المبنى" : "Phase / Building"
            )}
            name="phase"
            value={formData.phase || ""}
            onChange={handleChange}
            placeholder={translate(
              "basicDetails.placeholders.phase",
              locale === "ar" ? "اختياري" : "Optional"
            )}
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
                onChange={(e) => handleChange(e, "number")}
                placeholder="0"
                error={invalidFields.includes("roomsCount")}
                type="number"
                max={15}
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
