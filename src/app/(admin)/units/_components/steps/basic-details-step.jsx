"use client";
import { useI18n } from "@/context/translate-api";
import Egypt_cities from "../../../../../data/Egypt_cities.json";
import AddCompoundDialog from "../add-compound-dialog";
import { useState, useEffect } from "react";

export default function BasicDetailsStep({
  clientId,
  formData,
  updateFormData,
  developers,
  setDevelopers = () => {},
  invalidFields = [],
  setInvalidFields = () => {},
}) {
  const [isAddCompoundDialogOpen, setIsAddCompoundDialogOpen] = useState(false);
  const [availableCompounds, setAvailableCompounds] = useState([]);
  console.log(Egypt_cities.countries[0])
  // Remove the inline data definition
  // const data = [ ... ]; 

  // Update available compounds when district changes
  useEffect(() => {
    if (formData.city && formData.district) {
      const selectedCountry = Egypt_cities.countries[0]; // Assuming Egypt is the only country currently
      const selectedGovernorate = selectedCountry.governorates.find(
        (gov) => gov.governorate === formData.city
      );
      
      if (selectedGovernorate) {
        const selectedDistrict = selectedGovernorate.districts.find(
          (dist) => dist.district === formData.district
        );
        
        if (selectedDistrict) {
          setAvailableCompounds(selectedDistrict.projects);
          
          // If the current project is not in the list of available projects, clear it
          if (
            formData.project &&
            !selectedDistrict.projects.includes(formData.project)
          ) {
            updateFormData({ project: "" });
          }
        } else {
          setAvailableCompounds([]);
        }
      } else {
        setAvailableCompounds([]);
      }
    } else {
      setAvailableCompounds([]);
    }
  }, [formData.city, formData.district]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    let updatedValue;
    if (type === "checkbox") {
      updatedValue = checked;
    } else if (type === "number") {
      updatedValue = Number(value);
    } else {
      updatedValue = value;
    }

    updateFormData({ [name]: updatedValue });

    // If changing city or district, clear the project selection
    if (name === "city" || name === "district") {
      updateFormData({ project: "" });
    }

    if (invalidFields.includes(name) && updatedValue) {
      setInvalidFields((prev) => prev.filter((field) => field !== name));
    }
  };

  const { t } = useI18n();
  const handleAddCompound = (newCompound) => {
    // Add the new compound to the list
    setAvailableCompounds([...availableCompounds, newCompound.name]);

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
            value={formData.unitTitle}
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
              value={formData.buildingType}
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
              value={formData.city}
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t.basicDetails.district}
          </label>
          <select
            name="district"
            value={formData.district}
            onChange={handleChange}
            disabled={!formData.city}
            className="block w-full rounded-md border border-gray-300 py-1 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
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
          <label className=" text-sm font-medium text-gray-700 mb-1 flex items-center justify-between">
            {t.basicDetails.compound}
            <button
              type="button"
              disabled={!formData.district}
              onClick={() => setIsAddCompoundDialogOpen(true)}
              className="text-blue-600 text-sm font-medium disabled:opacity-70 disabled:pointer-events-none"
            >
              + Add New
            </button>
          </label>
          <select
            name="project"
            value={formData.project}
            onChange={handleChange}
            disabled={!formData.district}
            className="block w-full rounded-md border border-gray-300 py-1 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">
              {!formData.city
                ? t.formLabels.cityFirst
                : !formData.district
                  ? t.formLabels.districtFirst
                  : t.basicDetails.selectCompound}
            </option>
            {availableCompounds.map((compound) => (
              <option key={compound} value={compound}>
                {compound}
              </option>
            ))}
          </select>
          {formData.district && (
            <div className="mt-1">
              <button
                type="button"
                onClick={() => setIsAddCompoundDialogOpen(true)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {t.basicDetails.addNewCompound}
              </button>
            </div>
          )}
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
              value={formData.purpose}
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
              value={formData.view}
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
            type="number"
            name="roomsCount"
            value={formData.roomsCount}
            placeholder="0"
            onChange={handleChange}
            min="0"
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
            type="number"
            name="bathroomCount"
            placeholder="0"
            value={formData.bathroomCount}
            onChange={handleChange}
            min={0}
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
            type="number"
            name="floor"
            value={formData.floor}
            placeholder="0"
            onChange={handleChange}
            min={0}
            className="block w-full rounded-md border border-gray-300 py-1 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Land Area */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t.basicDetails.landArea} (m²)
          </label>
          <input
            type="number"
            name="landArea"
            placeholder="0"
            value={formData.landArea}
            onChange={handleChange}
            min={0}
            className="block w-full rounded-md border border-gray-300 py-1 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Garden Size */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t.basicDetails.gardenSize} (m²)
          </label>
          <input
            type="number"
            name="gardenSize"
            placeholder="0"
            value={formData.gardenSize}
            onChange={handleChange}
            min={0}
            className="block w-full rounded-md border border-gray-300 py-1 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Garage Area */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t.basicDetails.garageArea} (m²)
          </label>
          <input
            type="number"
            name="garageArea"
            placeholder="0"
            value={formData.garageArea}
            onChange={handleChange}
            min="0"
            className="block w-full rounded-md border border-gray-300 py-1 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Add Compound Dialog */}
      <AddCompoundDialog
        clientId={clientId}
        developers={developers}
        setDevelopers={setDevelopers}
        isOpen={isAddCompoundDialogOpen}
        onClose={() => setIsAddCompoundDialogOpen(false)}
        onAdd={handleAddCompound}
      />
    </div>
  );
}
