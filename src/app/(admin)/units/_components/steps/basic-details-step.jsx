"use client";

import { useI18n } from "@/context/translate-api";
import Egypt_cities from "../../../../../data/Egypt_cities.json";
import AddCompoundDialog from "../add-compound-dialog";
import { useState, useEffect } from "react";
import { getprojects } from "@/components/services/serviceFetching";

export default function BasicDetailsStep({
  clientId,
  formData,
  updateFormData,
  developers,
  setDevelopers = () => {},
  invalidFields = [],
  setInvalidFields = () => {},
}) {
  const { t } = useI18n();
  const [isAddCompoundDialogOpen, setIsAddCompoundDialogOpen] = useState(false);
  const [availableCompounds, setAvailableCompounds] = useState([]);
  const [dataProject, setDataProject] = useState([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);

  // Function to print selected city and district
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

  // Load projects when component mounts or when returning from step 2
  useEffect(() => {
    if (formData.city && formData.district) {
      printLocationDetails(formData.city, formData.district);
    }
  }, []);

  // Update available compounds when district changes
  useEffect(() => {
    if (formData.city && formData.district) {
      const selectedCountry = Egypt_cities.countries[0]; // Assuming Egypt is the only country for now
      const selectedGovernorate = selectedCountry.governorates.find(
        (gov) => gov.governorate === formData.city
      );

      if (selectedGovernorate) {
        const selectedDistrict = selectedGovernorate.districts.find(
          (dist) => dist.district === formData.district
        );

        if (selectedDistrict) {
          setAvailableCompounds(selectedDistrict.projects);
        } else {
          setAvailableCompounds([]);
        }
      } else {
        setAvailableCompounds([]);
      }

      // Call the function to print location details when district changes
      printLocationDetails(formData.city, formData.district);
    } else {
      setAvailableCompounds([]);
    }
  }, [formData.city, formData.district]);

  const handleChange = (e) => {
    const { name, value, type, checked, dataset } = e.target;

    let updatedValue;
    if (type === "checkbox") {
      updatedValue = checked;
    } else if (dataset.formatNumber === "true") {
      const rawValue = value.replace(/\D/g, "");
      updatedValue = Number(rawValue);
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
  };

  const handleAddCompound = (newCompound) => {
    // Add the new compound to the list
    setAvailableCompounds([...availableCompounds, newCompound.name]);

    // Update selected project in the form
    updateFormData({ project: newCompound.name });
  };

  return (
    <div>
      <h3 className="text-xl font-semibold mb-3 text-slate-800">
        {t.basicDetails.propertyDetails}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-y-3 gap-x-4">
        {/* Unit Title */}
        <div className="col-span-1 md:col-span-2">
          <label
            className={`block text-sm font-medium mb-1 ${
              invalidFields.includes("unitTitle")
                ? "text-red-500"
                : "text-gray-700"
            }`}
          >
            {t.basicDetails.unitTitle} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="unitTitle"
            required
            value={formData.unitTitle || ""}
            onChange={handleChange}
            placeholder={t.basicDetails.placeholders.unitTitle}
            className={`block w-full rounded-md border py-1 px-3 focus:outline-none focus:ring-1 ${
              invalidFields.includes("unitTitle")
                ? "border-red-500 ring-red-500 placeholder-red-500"
                : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            }`}
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
              className={`block w-full rounded-md border py-1 px-3 bg-white focus:outline-none focus:ring-1 appearance-none ${
                invalidFields.includes("buildingType")
                  ? "border-red-500 ring-red-500"
                  : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              }`}
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
              className={`block w-full rounded-md border py-1 px-3 bg-white focus:outline-none focus:ring-1 appearance-none ${
                invalidFields.includes("city")
                  ? "border-red-500 ring-red-500"
                  : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              }`}
            >
              <option value="">{t.basicDetails.selectCity}</option>
              {Egypt_cities.countries[0].governorates?.map((gov) => (
                <option key={gov?.governorate} value={gov?.governorate}>
                  {gov?.governorate}
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
            className={`block w-full rounded-md border py-1 px-3 focus:outline-none focus:ring-1 ${
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
            {formData.city &&
              Egypt_cities.countries[0].governorates
                .find((gov) => gov.governorate === formData.city)
                ?.districts.map((dist) => (
                  <option key={dist.district} value={dist.district}>
                    {dist.district}
                  </option>
                ))}
          </select>
        </div>

        {/* Project */}
        <div>
          <div>
            <label
              className={`text-sm  font-medium mb-1 flex items-center ${
                invalidFields.includes("project")
                  ? "text-red-500"
                  : "text-gray-700"
              }`}
            >
              {t.basicDetails.compound}
              <span className="text-red-500 mr-1">*</span>
              <button
                type="button"
                disabled={!formData.district}
                onClick={() => setIsAddCompoundDialogOpen(true)}
                className="ml-auto text-blue-600 text-sm font-medium disabled:opacity-70 disabled:pointer-events-none"
              >
                + Add New
              </button>
            </label>
          </div>
          <div className="relative">
            <select
              name="project"
              value={formData.project || ""}
              onChange={handleChange}
              disabled={!formData.district}
              required
              className={`block w-full rounded-md border py-1 px-3 focus:outline-none focus:ring-1 ${
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
                    <option key={project.id} value={project.name}>
                      {project.name}
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
              <option value="park">{t.basicDetails.views.park}</option>
              <option value="street">{t.basicDetails.views.street}</option>
              <option value="lagoon">{t.basicDetails.views.lagoon}</option>
              <option value="sea">{t.basicDetails.views.sea}</option>
              <option value="city">{t.basicDetails.views.city}</option>
              <option value="river">{t.basicDetails.views.river}</option>
              <option value="pool">{t.basicDetails.views.pool}</option>
              <option value="golf">{t.basicDetails.views.golf}</option>
              <option value="garden">{t.basicDetails.views.garden}</option>
              <option value="open area">{t.basicDetails.views.openArea}</option>
              <option value="mountain">{t.basicDetails.views.mountain}</option>
            </select>
          </div>
        </div>

        {/* code */}
        <div>
          <label className="block text-sm font-medium mb-1">
            {t.basicDetails.code}
          </label>
          <input
            type="text"
            name="code"
            value={formData.code}
            onChange={handleChange}
            placeholder={t.basicDetails.placeholders.code}
            className="block w-full rounded-md border py-1 px-3 focus:outline-none focus:ring-1 border-gray-300 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <h3 className="text-xl font-semibold mb-3 mt-8 text-slate-800">
        {t.basicDetails.propertySpecs}
      </h3>

      <div className="grid grid-cols-2 gap-x-2 md:grid-cols-3 gap-y-3 md:gap-x-4">
        {/* Rooms */}
        <div>
          <label
            className={`block text-sm font-medium mb-1 ${
              invalidFields.includes("roomsCount")
                ? "text-red-500 "
                : "text-gray-700"
            }`}
          >
            {t.basicDetails.rooms} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="roomsCount"
            value={formData.roomsCount || ""}
            placeholder="0"
            onChange={handleChange}
            required
            className={`block w-full rounded-md border py-1 px-3 focus:outline-none focus:ring-1 ${
              invalidFields.includes("roomsCount")
                ? "border-red-500 ring-red-500 placeholder-red-500"
                : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            }`}
          />
        </div>

        {/* Bathrooms */}
        <div>
          <label
            className={`block text-sm font-medium mb-1 ${
              invalidFields.includes("bathroomCount")
                ? "text-red-500"
                : "text-gray-700"
            }`}
          >
            {t.basicDetails.bathrooms} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            data-format-number
            name="bathroomCount"
            placeholder="0"
            value={formData.bathroomCount || ""}
            onChange={handleChange}
            required
            className={`block w-full rounded-md border py-1 px-3 focus:outline-none focus:ring-1 ${
              invalidFields.includes("bathroomCount")
                ? "border-red-500 ring-red-500"
                : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            }`}
          />
        </div>

        {/* Floor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t.basicDetails.floor}
          </label>
          <input
            type="text"
            data-format-number
            name="floor"
            value={formData.floor || ""}
            placeholder="0"
            onChange={handleChange}
            className="block w-full rounded-md border border-gray-300 py-1 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Land Area */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t.basicDetails.landArea} (m²)
          </label>
          <input
            type="text"
            data-format-number
            name="landArea"
            placeholder="0"
            value={formData.landArea || ""}
            onChange={handleChange}
            className="block w-full rounded-md border border-gray-300 py-1 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Garden Size */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t.basicDetails.gardenSize} (m²)
          </label>
          <input
            type="text"
            data-format-number
            name="gardenSize"
            placeholder="0"
            value={formData.gardenSize || ""}
            onChange={handleChange}
            className="block w-full rounded-md border border-gray-300 py-1 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Garage Area */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t.basicDetails.garageArea} (m²)
          </label>
          <input
            type="text"
            name="garageArea"
            placeholder="0"
            value={formData.garageArea || ""}
            onChange={handleChange}
            className="block w-full rounded-md border border-gray-300 py-1 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Add Compound Dialog */}
      <AddCompoundDialog
        clientId={clientId}
        isOpen={isAddCompoundDialogOpen}
        onClose={() => setIsAddCompoundDialogOpen(false)}
        onAdd={handleAddCompound}
        developers={developers}
        setDevelopers={setDevelopers}
        Egypt_cities={Egypt_cities}
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
