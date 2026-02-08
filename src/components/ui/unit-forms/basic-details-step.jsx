"use client";

import AddCompoundDialog from "@/components/ui/add-compound-dialog";
import AddPhaseDialog from "@/components/ui/add-phase-dialog";
import LenaTextField from "@/components/ui/inputs/lena-text-field";
import SearchableDropdownSelect from "@/components/ui/inputs/searchable-dropdown-select";
import SearchableCitySelect from "@/components/ui/inputs/searchable-city-select";
import { useI18n } from "@/context/translate-api";
import { useLocaleConstants } from "@/utils/localeConstants";
import { useCitiesDistricts } from "@/hooks/use-cities-districts";
import { useProjectsNames } from "@/hooks/use-admin-shared-data";
import ProjectsNamesManager from "@/utils/projects_names_manager";
import {
  convertArabicToEnglishNumbers,
} from "@/utils/formatters";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";

export default function BasicDetailsStep({
  clientId,
  formData,
  updateFormData,
  citiesAndDistricts: _citiesAndDistricts, // Keep for backward compatibility but don't use
  invalidFields = [],
  setInvalidFields = () => {},
}) {
  const { t, locale } = useI18n();
  const { getBuildingTypes, getViewTypes } = useLocaleConstants();
  const { getDistrictsWithLabels, isLoading: citiesLoading } = useCitiesDistricts();

  // State for districts
  const [districtsWithLabels, setDistrictsWithLabels] = useState([]);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);

  // Load districts when city changes
  useEffect(() => {
    const loadDistricts = async () => {
      if (!formData.city) {
        setDistrictsWithLabels([]);
        return;
      }

      try {
        setIsLoadingDistricts(true);
        const districts = await getDistrictsWithLabels(formData.city);
        setDistrictsWithLabels(districts || []);
      } catch (error) {
        console.error("Failed to load districts:", error);
        setDistrictsWithLabels([]);
      } finally {
        setIsLoadingDistricts(false);
      }
    };

    loadDistricts();
  }, [formData.city, getDistrictsWithLabels]);

  const [projectId, setProjectId] = useState(null);
  const [isAddCompoundDialogOpen, setIsAddCompoundDialogOpen] = useState(false);
  const [isAddPhaseDialogOpen, setIsAddPhaseDialogOpen] = useState(false);
  const [addedCompounds, setAddedCompounds] = useState([]);
  const [projectPhasesMap, setProjectPhasesMap] = useState({});

  const { data: projectsData, isLoading: isLoadingProjectsFromApi } = useProjectsNames(false);

  useEffect(() => {
    if (Array.isArray(projectsData) && projectsData.length > 0) {
      ProjectsNamesManager.getInstance().setProjects(projectsData);
    }
  }, [projectsData]);

  const filteredFromApi = useMemo(() => {
    if (!formData.city || !formData.district || !Array.isArray(projectsData)) return [];
    const normalizedCity = String(formData.city).toLowerCase().trim();
    const normalizedDistrict = String(formData.district).toLowerCase().trim();
    return projectsData.filter(
      (p) =>
        p.city?.toLowerCase() === normalizedCity &&
        p.district?.toLowerCase() === normalizedDistrict
    );
  }, [formData.city, formData.district, projectsData]);

  const dataProject = useMemo(
    () => [...filteredFromApi, ...addedCompounds],
    [filteredFromApi, addedCompounds]
  );

  useEffect(() => {
    const selected = dataProject.find((p) => p.en_name === formData.project);
    if (selected?.id) setProjectId(selected.id);
  }, [formData.project, dataProject]);

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

    // If city or district changed, only clear project if the new value is different
    if (name === "city" || name === "district") {
      if (formData[name] !== updatedValue) {
        setAddedCompounds([]);
        if (name === "city") {
          updateFormData({ [name]: updatedValue, district: "", project: "", project_ar: "" });
        } else {
          updateFormData({ [name]: updatedValue, project: "", project_ar: "" });
        }
      } else {
        updateFormData({ [name]: updatedValue });
      }
    } else {
      updateFormData({ [name]: updatedValue });
    }

    if (invalidFields.includes(name) && updatedValue) {
      setInvalidFields((prev) => prev.filter((field) => field !== name));
    }

    if (name === "project") {
      const project_ar = dataProject.find(
        (project) => project.en_name === updatedValue
      );

      updateFormData({ phase: "", project_ar: project_ar?.ar_name || "" });
    }
  };

  const handleAddCompound = (newCompound) => {
    setAddedCompounds((prev) => [...prev, newCompound]);
    updateFormData({ project: newCompound.en_name, project_ar: newCompound.ar_name || "" });
  };

  const selectedProjectFromList = useMemo(
    () => dataProject.find((p) => p.en_name === formData.project || p.name === formData.project),
    [dataProject, formData.project]
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

        {/* City */}
        <SearchableCitySelect
          name="city"
          value={formData.city || ""}
          onChange={handleChange}
          required
          error={invalidFields.includes("city")}
          placeholder={t.basicDetails.selectCity}
        />

        {/* District */}
        <SearchableDropdownSelect
          name="district"
          value={formData.district || ""}
          onChange={handleChange}
          disabled={!formData.city}
          required
          error={invalidFields.includes("district")}
          options={districtsWithLabels}
          getValue={(opt) => opt.value}
          getLabel={(opt) => opt.label}
          placeholder={
            formData.city
              ? t.formLabels.selectDistrict
              : t.formLabels.cityFirst
          }
          isLoading={formData.city && isLoadingDistricts}
          loadingText={locale === "ar" ? "جاري التحميل..." : "Loading districts..."}
          noResultsText={
            formData.city && districtsWithLabels.length === 0 && !isLoadingDistricts
              ? (locale === "ar"
                ? `لا توجد مناطق لـ ${formData.city}`
                : `No districts found for ${formData.city}`)
              : undefined
          }
        />

        {/* Project */}
        <div className="relative">
          <SearchableDropdownSelect
            name="project"
            value={formData.project || ""}
            onChange={handleChange}
            disabled={!formData.district}
            required
            error={invalidFields.includes("project")}
            options={dataProject}
            getValue={(opt) => opt.en_name}
            getLabel={(opt) => (locale === "ar" ? opt.ar_name : opt.en_name)}
            placeholder={
              formData.city && formData.district && isLoadingProjectsFromApi
                ? t.basicDetails.placeholders.loadingProjects
                : t.basicDetails.selectCompound
            }
            isLoading={!!(formData.city && formData.district && isLoadingProjectsFromApi)}
            loadingText={locale === "ar" ? "جاري التحميل..." : "Loading..."}
            noResultsText={
              !isLoadingProjectsFromApi && dataProject.length === 0 && formData.district
                ? t.basicDetails.placeholders.noProjects
                : undefined
            }
          />

          <button
            type="button"
            onClick={() => {
              if (!formData.city) {
                toast.error(t.formLabels.cityFirst);
                return;
              }
              if (!formData.district) {
                toast.error(t.formLabels.districtFirst);
                return;
              }
              setIsAddCompoundDialogOpen(true);
            }}
            className="text-blue-600 absolute top-0 rtl:left-0 ltr:right-0 text-sm font-medium disabled:opacity-70 disabled:pointer-events-none"
          >
            + {t.addNew}
          </button>
        </div>

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
          value={formData.floor || ""}
          onChange={(e) => handleChange(e, "number")}
          placeholder="0"
          type="number"
        />

        {/* Land Area */}
        <LenaTextField
          label={`${t.basicDetails.landArea} (m²)`}
          name="landArea"
          value={formData.landArea || ""}
          onChange={(e) => handleChange(e, "number")}
          placeholder="0"
          type="number"
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

      {/* Add Compound Dialog */}
      {isAddCompoundDialogOpen && (
        <AddCompoundDialog
          clientId={clientId}
          projectId={projectId}
          setProjectId={setProjectId}
          isOpen={isAddCompoundDialogOpen}
          onClose={() => setIsAddCompoundDialogOpen(false)}
          onAdd={handleAddCompound}
          defaultCity={formData.city}
          defaultDistrict={formData.district}
          onProjectsLoaded={(projects) => {
            if (projects && projects.length > 0) {
              setDataProject(projects);
            }
          }}
        />
      )}
    </>
  );
}
