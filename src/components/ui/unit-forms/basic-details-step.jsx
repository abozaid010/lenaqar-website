"use client";

import AddPhaseDialog from "@/components/ui/add-phase-dialog";
import LenaTextField from "@/components/ui/inputs/lena-text-field";
import SearchableDropdownSelect from "@/components/ui/inputs/searchable-dropdown-select";
import SearchableProjectSelect from "@/components/ui/inputs/searchable-project-select";
import { useI18n } from "@/hooks/useI18n";
import { getBuildingTypeOptions } from "@/lib/enums/buildingTypes";
import { useLocaleConstants } from "@/utils/localeConstants";
import { useProjectsNames } from "@/hooks/use-admin-shared-data";
import ProjectsNamesManager from "@/utils/projects_names_manager";
import {
  convertArabicToEnglishNumbers,
} from "@/utils/formatters";
import { useCallback, useEffect, useMemo, useState } from "react";

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
}) {
  const { t, locale, translate } = useI18n();
  const { getViewTypes } = useLocaleConstants();

  const [projectId, setProjectId] = useState(null);
  const [isAddPhaseDialogOpen, setIsAddPhaseDialogOpen] = useState(false);
  const [projectPhasesMap, setProjectPhasesMap] = useState({});

  const { data: projectsData, isLoading: isLoadingProjectsFromApi } = useProjectsNames(false);

  useEffect(() => {
    if (Array.isArray(projectsData) && projectsData.length > 0) {
      ProjectsNamesManager.getInstance().setProjects(projectsData);
    }
  }, [projectsData]);

  const allProjects = useMemo(() => Array.isArray(projectsData) ? projectsData : [], [projectsData]);

  useEffect(() => {
    const selected = allProjects.find(
      (p) => p.en_name === formData.project || p.name === formData.project
    );
    if (selected?.id) {
      setProjectId(selected.id);
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

    updateFormData({ [name]: updatedValue });

    if (invalidFields.includes(name) && (updatedValue === 0 || updatedValue)) {
      setInvalidFields((prev) => prev.filter((field) => field !== name));
    }
  };

  const handleProjectChange = (e) => {
    const value = e?.target?.value ?? "";
    const proj = allProjects.find((p) => p.en_name === value || p.name === value);
    updateFormData({
      project: value,
      project_ar: proj?.ar_name ?? "",
      project_id: proj?.id ?? "",
      // Always derive location + developer from project
      city: proj?.city ?? "",
      district: proj?.district ?? "",
      phase: "",
      developer_id: "",
      developer: "",
    });
    if (invalidFields.includes("project") && value) {
      setInvalidFields((prev) => prev.filter((field) => field !== "project"));
    }
  };

  const applyDeveloperFromProject = useCallback(
    (fullProject) => {
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

      if (devId) {
        updateFormData({
          developer_id: String(devId),
          developer: devName || "",
        });
      }
    },
    [locale, updateFormData]
  );

  const selectedProjectFromList = useMemo(
    () => allProjects.find((p) => p.en_name === formData.project || p.name === formData.project),
    [allProjects, formData.project]
  );

  // When editing an existing unit, keep city/district synced with the selected project
  useEffect(() => {
    if (!selectedProjectFromList) return;
    const nextCity = selectedProjectFromList.city ?? "";
    const nextDistrict = selectedProjectFromList.district ?? "";
    const patch = {};
    if ((formData.city || "") !== nextCity) patch.city = nextCity;
    if ((formData.district || "") !== nextDistrict) patch.district = nextDistrict;
    if (Object.keys(patch).length) updateFormData(patch);
  }, [selectedProjectFromList, formData.city, formData.district, updateFormData]);

  const phases = useMemo(() => {
    if (!selectedProjectFromList) return [];
    const existingPhases = selectedProjectFromList.phases ?? projectPhasesMap[selectedProjectFromList.id] ?? [];
    return [{ ...selectedProjectFromList, phases: existingPhases }];
  }, [selectedProjectFromList, projectPhasesMap]);

  const buildingTypeOptions = useMemo(() => getBuildingTypeOptions(translate), [translate]);

  const handleAddPhase = (newPhase) => {
    if (!projectId) return;
    const currentPhases = phases[0]?.phases ?? [];
    setProjectPhasesMap((prev) => ({
      ...prev,
      [projectId]: [...currentPhases, newPhase],
    }));
    updateFormData({ phase: newPhase.name });
  };

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

        {/* Project (all projects; city & district are set from selected project and sent to API) */}
        <SearchableProjectSelect
          name="project"
          value={formData.project || ""}
          onChange={handleProjectChange}
          onProjectSelect={applyDeveloperFromProject}
          projects={allProjects}
          isLoading={isLoadingProjectsFromApi}
          required
          error={invalidFields.includes("project")}
          placeholder={translate("basicDetails.selectCompound", t.basicDetails.selectCompound)}
        />

        {/* Phase */}
        <SearchableDropdownSelect
          name="phase"
          value={formData.phase || ""}
          onChange={handleChange}
          disabled={!formData.project}
          options={
            formData.project && phases[0]?.phases?.length
              ? phases[0].phases
              : []
          }
          getValue={(opt) => opt.name}
          getLabel={(opt) => opt.name}
          placeholder={
            !formData.project
              ? translate("projectFirst", t?.projectFirst || "Select project first")
              : phases[0]?.phases?.length === 0
                ? translate("basicDetails.noPhases", t.basicDetails.noPhases)
                : translate("basicDetails.selectPhase", t.basicDetails.selectPhase)
          }
          noResultsText={translate("basicDetails.noPhases", t.basicDetails.noPhases)}
        />

        <AddPhaseDialog
          isOpen={isAddPhaseDialogOpen}
          onClose={() => setIsAddPhaseDialogOpen(false)}
          onAdd={handleAddPhase}
          projectId={phases[0]?.id || projectId}
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
