"use client";

import { getprojects } from "@/components/services/serviceFetching";
import AddCompoundDialog from "@/components/ui/add-compound-dialog";
import AddPhaseDialog from "@/components/ui/add-phase-dialog";
import FormInput from "@/components/ui/form-input";
import { useI18n } from "@/context/translate-api";
import {
  convertArabicToEnglishNumbers,
  formatCityLabel,
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
  const [dataProject, setDataProject] = useState([]);
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

  // Update available compounds when district changes
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
      const englishValue = convertArabicToEnglishNumbers(value);
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
      // reset phase when project changes
      updateFormData({ phase: "" });
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
    <div>
      <h3 className="text-xl font-semibold mb-3 text-slate-800">
        {t.basicDetails.propertyDetails}
      </h3>

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
        <div>
          <label
            className={`block text-sm font-medium mb-1 ${
              invalidFields.includes("buildingType")
                ? "text-red-500"
                : "text-gray-700"
            }`}
          >
            {t.basicDetails.buildingType}
          </label>
          <div className="relative">
            <select
              name="buildingType"
              value={formData.buildingType || ""}
              onChange={handleChange}
              className="border-gray-300 focus:ring-blue-500 focus:border-blue-500 block w-full rounded-md border py-1 px-3 bg-white focus:outline-none focus:ring-1 appearance-none"
            >
              <option value="apartment">
                {t.basicDetails.buildingTypes.apartment}
              </option>
              <option value="villa">
                {t.basicDetails.buildingTypes.villa}
              </option>
              <option value="townhouse">
                {t.basicDetails.buildingTypes.townhouse}
              </option>
              <option value="duplex">
                {t.basicDetails.buildingTypes.duplex}
              </option>
              <option value="penthouse">
                {t.basicDetails.buildingTypes.penthouse}
              </option>
              <option value="studio">
                {t.basicDetails.buildingTypes.studio}
              </option>
              <option value="chalet">
                {t.basicDetails.buildingTypes.chalet}
              </option>
              <option value="office">
                {t.basicDetails.buildingTypes.office}
              </option>
              <option value="shop">{t.basicDetails.buildingTypes.shop}</option>
              <option value="twinhouse">
                {t.basicDetails.buildingTypes.twinhouse}
              </option>
              <option value="house">
                {t.basicDetails.buildingTypes.house}
              </option>
            </select>
          </div>
        </div>

        {/* City */}
        <div>
          <label
            className={`block text-sm font-medium mb-1 ${
              invalidFields.includes("city") ? "text-red-500" : "text-gray-700"
            }`}
          >
            {t.basicDetails.city} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              name="city"
              value={formData.city || ""}
              required
              onChange={handleChange}
              className={`block w-full rounded-md border h-[34px] py-1 px-3 bg-white focus:outline-none focus:ring-1 appearance-none ${
                invalidFields.includes("city")
                  ? "border-red-500 ring-red-500"
                  : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              }`}
            >
              <option value="">{t.basicDetails.selectCity}</option>
              {citiesAndDistricts
                ?.sort((a, b) => a.governorate.localeCompare(b.governorate))
                .map((gov) => (
                  <option key={gov.governorate} value={gov.governorate}>
                    {formatCityLabel(gov.governorate, locale)}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* District */}
        <div>
          <label
            className={`flex  text-sm font-medium mb-1 ${
              invalidFields.includes("district")
                ? "text-red-500"
                : "text-gray-700"
            }`}
          >
            {t.basicDetails.district} <span className="text-red-500">*</span>
          </label>
          <select
            name="district"
            value={formData.district || ""}
            onChange={handleChange}
            disabled={!formData.city}
            required
            className={`block w-full rounded-md border py-1 h-[34px] px-3 focus:outline-none focus:ring-1 ${
              invalidFields.includes("district")
                ? "border-red-500 ring-red-500"
                : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            }`}
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
          </select>
        </div>

        {/* Project */}
        <div>
          <label
            className={`text-sm relative font-medium mb-1 flex items-center ${
              invalidFields.includes("project")
                ? "text-red-500"
                : "text-gray-700"
            }`}
          >
            {t.basicDetails.compound}
            <span className="text-red-500 mr-1">*</span>
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
              className="text-blue-600 absolute rtl:left-0 ltr:right-0 text-sm font-medium disabled:opacity-70 disabled:pointer-events-none"
            >
              + {t.addNew}
            </button>
          </label>
          <div className="relative">
            <select
              name="project"
              value={formData.project || ""}
              onChange={handleChange}
              disabled={!formData.district}
              required
              className={`block w-full rounded-md border py-1 h-[34px] px-3 focus:outline-none focus:ring-1 ${
                invalidFields.includes("project")
                  ? "border-red-500 ring-red-500"
                  : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              }`}
            >
              <option value="">
                {!formData.city
                  ? t.formLabels.cityFirst
                  : !formData.district
                    ? t.formLabels.districtFirst
                    : t.basicDetails.selectCompound}
              </option>
              {isLoadingProjects ? (
                <option disabled value="">
                  Loading projects...
                </option>
              ) : formData.city && formData.district ? (
                dataProject && dataProject.length > 0 ? (
                  dataProject.map((project) => (
                    <option key={project.en_name} value={project.en_name}>
                      {project.en_name}
                    </option>
                  ))
                ) : (
                  <option disabled value="">
                    No data available
                  </option>
                )
              ) : null}
              {/* If we have a selected project but it's not in the loaded list, add it separately */}
              {formData.project &&
              formData.city &&
              formData.district &&
              dataProject &&
              !dataProject.some((p) => p.name === formData.project) ? (
                <option key="preserved-selection" value={formData.project}>
                  {formData.project}
                </option>
              ) : null}
            </select>
          </div>
        </div>

        {/* Phase */}
        <div>
          <label className="text-sm font-medium mb-1 text-gray-700 flex items-center justify-between">
            <span>{t.basicDetails.selectPhase || "Select Phase"} </span>
            {formData.project && (
              <button
                type="button"
                onClick={() => setIsAddPhaseDialogOpen(true)}
                className="text-blue-600 text-sm font-medium"
              >
                + {t.addPhase}
              </button>
            )}
          </label>
          <select
            name="phase"
            value={formData.phase}
            onChange={handleChange}
            disabled={!formData.project}
            className="block w-full rounded-md border py-1 h-[34px] px-3 focus:outline-none focus:ring-1 border-gray-300 focus:ring-blue-500 focus:border-blue-500"
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
          </select>
        </div>

        <AddPhaseDialog
          isOpen={isAddPhaseDialogOpen}
          onClose={() => setIsAddPhaseDialogOpen(false)}
          onAdd={handleAddPhase}
          projectId={phases[0]?.id || projectId}
        />

        {/* Purpose */}
        <div>
          <label
            className={`block text-sm font-medium mb-1 ${
              invalidFields.includes("purpose")
                ? "text-red-500"
                : "text-gray-700"
            }`}
          >
            {t.basicDetails.purpose} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              name="purpose"
              required
              value={formData.purpose || ""}
              onChange={handleChange}
              className={`block w-full rounded-md border py-1 px-3 bg-white focus:outline-none focus:ring-1 appearance-none ${
                invalidFields.includes("purpose")
                  ? "border-red-500 ring-red-500"
                  : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              }`}
            >
              <option value="">{t.basicDetails.selectPurpose}</option>
              <option value="sell">{t.basicDetails.purposes.sell}</option>
              <option value="rent">{t.basicDetails.purposes.rent}</option>
            </select>
          </div>
        </div>

        {/* View */}
        <div>
          <label
            className={`block text-sm font-medium mb-1 ${
              invalidFields.includes("view") ? "text-red-500" : "text-gray-700"
            }`}
          >
            {t.basicDetails.view} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              name="view"
              value={formData.view || ""}
              required
              onChange={handleChange}
              className={`block w-full rounded-md border py-1 px-3 bg-white focus:outline-none focus:ring-1 appearance-none ${
                invalidFields.includes("view")
                  ? "border-red-500 ring-red-500"
                  : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              }`}
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
                .map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
            </select>
          </div>
        </div>

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
          placeholder=""
        />
      </div>

      <h3 className="text-xl font-semibold mb-3 mt-8 text-slate-800">
        {t.basicDetails.propertySpecs}
      </h3>

      <div className="grid grid-cols-2 gap-x-2 md:grid-cols-3 gap-y-3 md:gap-x-4">
        {/* Rooms */}
        <div>
          <FormInput
            label={t.basicDetails.rooms}
            name="roomsCount"
            required
            value={formData.roomsCount || ""}
            onChange={(e) => handleChange(e, "number")}
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
        <FormInput
          label={`${t.basicDetails.gardenSize} (m²)`}
          name="gardenSize"
          value={formData.gardenSize || ""}
          onChange={(e) => handleChange(e, "number")}
          placeholder="0"
          type="number"
        />

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
    </div>
  );
}
