"use client";

import { getprojects } from "@/components/services/serviceFetching";
import AddCompoundDialog from "@/components/ui/add-compound-dialog";
import AddPhaseDialog from "@/components/ui/add-phase-dialog";
import FormInput from "@/components/ui/inputs/form-input";
import FormSelect from "@/components/ui/inputs/form-select";
import CitySelect from "@/components/ui/inputs/sorted-city-select";
import { useI18n } from "@/context/translate-api";
import { BUILDING_TYPES } from "@/data/constants";
import {
  convertArabicToEnglishNumbers,
  formatDistrictLabel,
} from "@/utils/formatters";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

export default function BasicDetailsStep({
  clientId,
  formData,
  updateFormData,
  developers,
  citiesAndDistricts,
  setDevelopers = () => {},
  invalidFields = [],
  setInvalidFields = () => {},
}) {
  const { t, locale } = useI18n();
  const [projectId, setProjectId] = useState(null);
  const [isAddCompoundDialogOpen, setIsAddCompoundDialogOpen] = useState(false);
  const [isAddPhaseDialogOpen, setIsAddPhaseDialogOpen] = useState(false);
  const [dataProject, setDataProject] = useState(() => {
    if (formData.project) {
      return [
        {
          en_name: formData.project,
          ar_name: formData.project_ar || "",
        },
      ];
    }
    return [];
  });

  const [isLoadingProjects, setIsLoadingProjects] = useState(false);

  const printLocationDetails = async (city, district) => {
    if (city && district) {
      try {
        setIsLoadingProjects(true);
        const data = await getprojects(city, district);
        setDataProject(data);
      } catch (error) {
        setDataProject([]);
      } finally {
        setIsLoadingProjects(false);
      }
    }
  };

  useEffect(() => {
    if (formData.city && formData.district) {
      printLocationDetails(formData.city, formData.district);
    }
  }, [formData.city, formData.district]);

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
        if (name === "city") {
          // If city changed, clear district and project
          updateFormData({ [name]: updatedValue, district: "", project: "" });
        } else {
          // If district changed, only clear project
          updateFormData({ [name]: updatedValue, project: "" });
        }

        // If district changed, call the function to print location details
        if (name === "district" && formData.city && updatedValue) {
          printLocationDetails(formData.city, updatedValue);
        }
      } else {
        // If value didn't change, keep current values
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
    setDataProject([...dataProject, newCompound]);

    updateFormData({ project: newCompound.en_name });
  };

  const handleAddPhase = (newPhase) => {
    if (phases[0]) {
      const updatedPhases = [...phases[0].phases, newPhase];
      const updatedProject = { ...phases[0], phases: updatedPhases };
      const updatedDataProject = dataProject.map((p) =>
        p.name === formData.project ? updatedProject : p
      );
      setDataProject(updatedDataProject);
      // Update form with the newly added phase
      updateFormData({ phase: newPhase.name });
    } else if (projectId) {
      // If we have a projectId but no phases yet, create new project data
      const newProjectData = {
        id: projectId,
        name: formData.project,
        phases: [newPhase],
      };
      setDataProject([...dataProject, newProjectData]);
      // Update form with the newly added phase
      updateFormData({ phase: newPhase.name });
    }
  };

  const phases = dataProject.filter(
    (project) => project.en_name === formData.project
  );

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-y-3 gap-x-4">
        {/* Unit Title */}
        <div className="col-span-1 md:col-span-2">
          <FormInput
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
        <FormSelect
          label={t.basicDetails.buildingType}
          name="buildingType"
          value={formData.buildingType || ""}
          onChange={handleChange}
          error={invalidFields.includes("buildingType")}
        >
          {BUILDING_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {locale === "ar" ? type.ar_label : type.en_label}
            </option>
          ))}
        </FormSelect>

        {/* City */}
        <CitySelect
          value={formData.city}
          onChange={handleChange}
          required
          error={invalidFields.includes("city")}
        />

        {/* District */}
        <FormSelect
          label={t.basicDetails.district}
          name="district"
          value={formData.district || ""}
          onChange={handleChange}
          disabled={!formData.city}
          required
          error={invalidFields.includes("district")}
        >
          <option value="">
            {formData.city
              ? t.formLabels.selectDistrict
              : t.formLabels.cityFirst}
          </option>
          {formData?.city &&
            citiesAndDistricts
              ?.find((gov) => gov.governorate === formData.city)
              ?.districts.sort((a, b) => a.district.localeCompare(b.district))
              .map((dist) => (
                <option key={dist.district} value={dist.district}>
                  {formatDistrictLabel(dist.district, formData.city, locale)}
                </option>
              ))}
        </FormSelect>

        {/* Project */}
        <div className="relative">
          <FormSelect
            label={t.basicDetails.compound}
            name="project"
            value={formData.project || ""}
            onChange={handleChange}
            disabled={!formData.district}
            required
            error={invalidFields.includes("project")}
          >
            {formData.project && isLoadingProjects && (
              <option key={formData.project} value={formData.project}>
                {locale === "ar" ? formData.project_ar : formData.project}
              </option>
            )}

            {!isLoadingProjects && dataProject.length > 0 && (
              <>
                <option value="">{t.basicDetails.selectCompound}</option>
                {dataProject
                  .sort((a, b) => {
                    const nameA = locale === "ar" ? a.ar_name : a.en_name;
                    const nameB = locale === "ar" ? b.ar_name : b.en_name;
                    return nameA.trim().localeCompare(nameB.trim(), locale, {
                      sensitivity: "base",
                    });
                  })
                  .map((project) => (
                    <option key={project.en_name} value={project.en_name}>
                      {locale === "ar" ? project.ar_name : project.en_name}
                    </option>
                  ))}
              </>
            )}

            {!isLoadingProjects && dataProject.length === 0 && (
              <option disabled value="">
                {t.basicDetails.placeholders.noProjects}
              </option>
            )}

            {formData.city && formData.district && isLoadingProjects && (
              <option value="">
                {t.basicDetails.placeholders.loadingProjects}
              </option>
            )}
          </FormSelect>

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
        <FormSelect
          label={t.basicDetails.selectPhase || "Select Phase"}
          name="phase"
          value={formData.phase}
          onChange={handleChange}
          disabled={!formData.project}
        >
          {!formData.project ? (
            <option value="">
              {t?.projectFirst || "Select project first"}
            </option>
          ) : (
            <>
              {formData.phase ? (
                <>
                  <option value="">{t.basicDetails.selectPhase}</option>
                  <option value={formData.phase}>
                    {formData.phase ? formData.phase : ""}
                  </option>
                </>
              ) : null}
              {phases[0]?.phases && phases[0].phases.length === 0 ? (
                <option value="" disabled>
                  {t.basicDetails.noPhases}
                </option>
              ) : null}
              {formData.project &&
                !isLoadingProjects &&
                phases[0]?.phases?.length > 0 && (
                  <>
                    {!formData.phase && (
                      <option value="">{t.basicDetails.selectPhase}</option>
                    )}
                    {phases[0].phases
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((phase, idx) =>
                        formData.phase === phase.name ? null : (
                          <option key={phase.name + idx} value={phase.name}>
                            {phase.name}
                          </option>
                        )
                      )}
                  </>
                )}
            </>
          )}
        </FormSelect>

        <AddPhaseDialog
          isOpen={isAddPhaseDialogOpen}
          onClose={() => setIsAddPhaseDialogOpen(false)}
          onAdd={handleAddPhase}
          projectId={phases[0]?.id || projectId}
        />

        {/* Purpose */}
        <FormSelect
          label={t.basicDetails.purpose}
          name="purpose"
          required
          value={formData.purpose || ""}
          onChange={handleChange}
          error={invalidFields.includes("purpose")}
        >
          <option value="">{t.basicDetails.selectPurpose}</option>
          <option value="sell">{t.basicDetails.purposes.sell}</option>
          <option value="rent">{t.basicDetails.purposes.rent}</option>
        </FormSelect>

        {/* View */}
        <FormSelect
          label={t.basicDetails.view}
          name="view"
          required
          value={formData.view || ""}
          onChange={handleChange}
          error={invalidFields.includes("view")}
        >
          <option value="">{t.basicDetails.selectView}</option>
          {[
            { value: "park", label: t.basicDetails.views.park },
            { value: "street", label: t.basicDetails.views.street },
            { value: "lagoon", label: t.basicDetails.views.lagoon },
            { value: "sea", label: t.basicDetails.views.sea },
            { value: "city", label: t.basicDetails.views.city },
            { value: "river", label: t.basicDetails.views.river },
            { value: "pool", label: t.basicDetails.views.pool },
            { value: "golf", label: t.basicDetails.views.golf },
            { value: "garden", label: t.basicDetails.views.garden },
            { value: "open area", label: t.basicDetails.views.openArea },
            { value: "mountain", label: t.basicDetails.views.mountain },
          ]
            .sort((a, b) => a.label.localeCompare(b.label))
            .map((option) => {
              return (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              );
            })}
        </FormSelect>

        {/* code */}
        <FormInput
          label={t.basicDetails.code}
          name="code"
          value={formData.code}
          onChange={handleChange}
          placeholder={t.basicDetails.placeholders.code}
        />

        {/* model */}
        <FormInput
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
              <FormInput
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
            <FormInput
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
        <FormInput
          label={t.basicDetails.floor}
          name="floor"
          value={formData.floor || ""}
          onChange={(e) => handleChange(e, "number")}
          placeholder="0"
          type="number"
        />

        {/* Land Area */}
        <FormInput
          label={`${t.basicDetails.landArea} (m²)`}
          name="landArea"
          value={formData.landArea || ""}
          onChange={(e) => handleChange(e, "number")}
          placeholder="0"
          type="number"
        />

        {/* Garden Size */}
        {formData.buildingType !== "office" && (
          <FormInput
            label={`${t.basicDetails.gardenSize} (m²)`}
            name="gardenSize"
            value={formData.gardenSize || ""}
            onChange={(e) => handleChange(e, "number")}
            placeholder="0"
            type="number"
          />
        )}

        {/* Garage Area */}
        <FormInput
          label={`${t.basicDetails.garageArea} (m²)`}
          name="garageArea"
          value={formData.garageArea || ""}
          onChange={(e) => handleChange(e, "number")}
          placeholder="0"
          type="number"
        />
      </div>

      {/* Add Compound Dialog */}
      <AddCompoundDialog
        clientId={clientId}
        projectId={projectId}
        setProjectId={setProjectId}
        isOpen={isAddCompoundDialogOpen}
        onClose={() => setIsAddCompoundDialogOpen(false)}
        onAdd={handleAddCompound}
        developers={developers}
        setDevelopers={setDevelopers}
        Egypt_cities={citiesAndDistricts}
        defaultCity={formData.city}
        defaultDistrict={formData.district}
        onProjectsLoaded={(projects) => {
          if (projects && projects.length > 0) {
            setDataProject(projects);
          }
        }}
      />
    </>
  );
}
