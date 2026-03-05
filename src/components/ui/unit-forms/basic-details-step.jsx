"use client";

import AddPhaseDialog from "@/components/ui/add-phase-dialog";
import LenaTextField from "@/components/ui/inputs/lena-text-field";
import SearchableDropdownSelect from "@/components/ui/inputs/searchable-dropdown-select";
import SearchableProjectSelect from "@/components/ui/inputs/searchable-project-select";
import { useI18n } from "@/context/translate-api";
import { useLocaleConstants } from "@/utils/localeConstants";
import { useProjectsNames } from "@/hooks/use-admin-shared-data";
import ProjectsNamesManager from "@/utils/projects_names_manager";
import {
  convertArabicToEnglishNumbers,
} from "@/utils/formatters";
import { useEffect, useMemo, useState } from "react";

export default function BasicDetailsStep({
  clientId,
  formData,
  updateFormData,
  citiesAndDistricts: _citiesAndDistricts, // Keep for backward compatibility but don't use
  invalidFields = [],
  setInvalidFields = () => { },
}) {
  const { t, locale } = useI18n();
  const { getBuildingTypes, getViewTypes } = useLocaleConstants();

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
    const selected = allProjects.find((p) => p.en_name === formData.project);
    if (selected?.id) setProjectId(selected.id);
  }, [formData.project, allProjects]);

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

    if (invalidFields.includes(name) && updatedValue) {
      setInvalidFields((prev) => prev.filter((field) => field !== name));
    }
  };

  const handleProjectChange = (e) => {
    const value = e?.target?.value ?? "";
    const proj = allProjects.find((p) => p.en_name === value);
    updateFormData({
      project: value,
      project_ar: proj?.ar_name ?? "",
      city: proj?.city ?? "",
      district: proj?.district ?? "",
      phase: "",
    });
    if (invalidFields.includes("project") && value) {
      setInvalidFields((prev) => prev.filter((field) => field !== "project"));
    }
  };

  const selectedProjectFromList = useMemo(
    () => allProjects.find((p) => p.en_name === formData.project || p.name === formData.project),
    [allProjects, formData.project]
  );

  const phases = useMemo(() => {
    if (!selectedProjectFromList) return [];
    const existingPhases = selectedProjectFromList.phases ?? projectPhasesMap[selectedProjectFromList.id] ?? [];
    return [{ ...selectedProjectFromList, phases: existingPhases }];
  }, [selectedProjectFromList, projectPhasesMap]);

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
            label={t.basicDetails.unitTitle}
            name="unitTitle"
            required
            value={formData.unitTitle || ""}
            onChange={handleChange}
            placeholder={t.basicDetails.placeholders.unitTitle}
            error={invalidFields.includes("unitTitle")}
          />
        </div>

        {/* Building Type */}
        <SearchableDropdownSelect
          name="buildingType"
          value={formData.buildingType || ""}
          onChange={handleChange}
          error={invalidFields.includes("buildingType")}
          options={getBuildingTypes()}
          getValue={(opt) => opt.value}
          getLabel={(opt) => (locale === "ar" ? opt.ar_label : opt.en_label)}
          placeholder={t.basicDetails.buildingType}
        />

        {/* Project (all projects; city & district are set from selected project and sent to API) */}
        <SearchableProjectSelect
          name="project"
          value={formData.project || ""}
          onChange={handleProjectChange}
          projects={allProjects}
          isLoading={isLoadingProjectsFromApi}
          required
          error={invalidFields.includes("project")}
          placeholder={t.basicDetails.selectCompound}
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
              ? t?.projectFirst || "Select project first"
              : phases[0]?.phases?.length === 0
                ? t.basicDetails.noPhases
                : t.basicDetails.selectPhase
          }
          noResultsText={t.basicDetails.noPhases}
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
            { value: "sell", label: t.basicDetails.purposes.sell },
            { value: "rent", label: t.basicDetails.purposes.rent },
          ]}
          getValue={(opt) => opt.value}
          getLabel={(opt) => opt.label}
          placeholder={t.basicDetails.selectPurpose}
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
          placeholder={t.basicDetails.selectView}
        />

        {/* code */}
        <LenaTextField
          label={t.basicDetails.code}
          name="code"
          value={formData.code}
          onChange={handleChange}
          placeholder={t.basicDetails.placeholders.code}
        />

        {/* model */}
        <LenaTextField
          label={t.basicDetails.model}
          name="model"
          value={formData.model}
          onChange={handleChange}
        />
      </div>

      <h3 className="text-xl font-semibold mb-3 mt-8 text-slate-800">
        {t.basicDetails.propertySpecs}
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
                value={formData.roomsCount || ""}
                onChange={handleChange}
                placeholder="0"
                error={invalidFields.includes("roomsCount")}
                type="number"
              />
            </div>
            {/* Bathrooms */}
            <LenaTextField
              label={t.basicDetails.bathrooms}
              name="bathroomCount"
              required
              value={formData.bathroomCount || ""}
              onChange={(e) => handleChange(e, "number")}
              placeholder="0"
              error={invalidFields.includes("bathroomCount")}
              type="number"
            />
          </>
        )}

        {/* Floor */}
        <LenaTextField
          label={t.basicDetails.floor}
          name="floor"
          value={formData.floor === 0 || formData.floor ? String(formData.floor) : ""}
          onChange={(e) => handleChange(e, "number")}
          placeholder="0"
          type="number"
        />

        {/* Land Area (area) - required */}
        <LenaTextField
          label={`${t.basicDetails.landArea} (m²)`}
          name="landArea"
          value={formData.landArea || ""}
          onChange={(e) => handleChange(e, "number")}
          placeholder="0"
          type="number"
          required
          error={invalidFields.includes("landArea")}
        />

        {/* Garden Size */}
        {formData.buildingType !== "office" && (
          <LenaTextField
            label={`${t.basicDetails.gardenSize} (m²)`}
            name="gardenSize"
            value={formData.gardenSize || ""}
            onChange={(e) => handleChange(e, "number")}
            placeholder="0"
            type="number"
          />
        )}

        {/* Garage Area */}
        <LenaTextField
          label={`${t.basicDetails.garageArea} (m²)`}
          name="garageArea"
          value={formData.garageArea || ""}
          onChange={(e) => handleChange(e, "number")}
          placeholder="0"
          type="number"
        />
      </div>

    </>
  );
}
