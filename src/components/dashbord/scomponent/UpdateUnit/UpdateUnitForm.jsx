"use client";
import {
  uploadImages,
  deleteImage,
} from "@/components/services/serviceFetching";
import React, { useState, useEffect, useRef } from "react";

import propertyEnums from "../../data/propertyEnums.json";
import PaymentPlanPopup from "../PaymentPlanPopup";
import AddCompoundModal from "../AddCompoundModal";
import AddDeveloperModal from "../AddDeveloperModal";
import PropertyDetailsSection from "./PropertyDetailsSection";
import AdditionalDetailsSection from "./AdditionalDetailsSection";
import ImagesSection from "./ImagesSection";
import RentalDetailsSection from "./RentalDetailsSection";
import PricingSection from "./PricingSection";
import { useRouter } from 'next/navigation'

const UpdateUnitForm = ({
  unit,
  onSubmit,
  onCancel,
  comboundata,
  developers,
}) => {
  // Form state
  const [formData, setFormData] = useState({
    unitTitle: "",
    unitId: "",
    buildingType: "",
    city: "",
    country: "",
    compound: "",
    developer: "",
    purpose: "",
    finishing: "",
    view: "",
    floor: "",
    roomsCount: "",
    bathroomCount: "",
    landArea: "",
    gardenSize: "",
    garageArea: "",
    totalPrice: "",
    downPayment: "",
    paymentPlans: "",
    deliveryDate: "",
    clientId: "",
    clientName: "",
    dataSource: "",
    images: [],
    availability: false,
    startingDate: "",
    monthlyRent: 0,
    weeklyRent: 0,
    dailyRent: 0,
    amenities: {},
  });

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const fileInputRef = useRef(null);
  const [isPaymentPlanPopupOpen, setIsPaymentPlanPopupOpen] = useState(false);
  const [isAddCompoundModalOpen, setIsAddCompoundModalOpen] = useState(false);
  const [isAddDeveloperModalOpen, setIsAddDeveloperModalOpen] = useState(false);
  const [isCompoundDropdownOpen, setIsCompoundDropdownOpen] = useState(false);
  const [isDevDropdownOpen, setIsDevDropdownOpen] = useState(false);
  const [isRentalProperty, setIsRentalProperty] = useState(false);
  const [isSellProperty, setIsSellProperty] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (unit) {
      setFormData({
        unitTitle: unit.unitTitle || "",
        unitId: unit.unitId || "",
        buildingType: unit.buildingType || "",
        city: unit.city || "",
        country: unit.country || "",
        compound: unit.compound || "",
        developer: unit.developer || "",
        purpose: unit.purpose.charAt(0).toUpperCase() + unit.purpose.slice(1) || "",
        finishing: unit.finishing || "",
        view: unit.view || "",
        floor: unit.floor || 0,
        roomsCount: unit.roomsCount || 0,
        bathroomCount: unit.bathroomCount || 0,
        landArea: unit.landArea || 0,
        gardenSize: unit.gardenSize || 0,
        garageArea: unit.garageArea || 0,
        totalPrice: unit.totalPrice || 0,
        downPayment: unit.downPayment || 0,
        paymentPlans: unit.paymentPlans || "",
        deliveryDate: unit.deliveryDate ? unit.deliveryDate.split("T")[0] : "",
        clientId: unit.clientId || "",
        clientName: unit.clientName || "",
        dataSource: unit.dataSource || "",
        images: unit.images || [],
        updatedAt: unit.updatedAt || "",
        availability: unit.availability || false,
        startingDate: unit.startingDate ? unit.startingDate.split("T")[0] : "",
        monthlyRent: unit.monthlyRent || 0,
        weeklyRent: unit.weeklyRent || 0,
        dailyRent: unit.dailyRent || 0,
        amenities: unit.amenities || {},
      });

      // Set the property type states based on the purpose
      setIsRentalProperty(unit.purpose === "Rent");
      setIsSellProperty(unit.purpose === "Sell" || unit.purpose === "Buy");
    }
  }, [unit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Update the form data
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Immediately update property type states if purpose changes
    if (name === "purpose") {
      setIsRentalProperty(value === "Rent");
      setIsSellProperty(value === "Sell" || value === "Buy");
      
      // Initialize amenities correctly when switching to Rent
      if (value === "Rent") {
        setFormData(prev => ({
          ...prev,
          [name]: value,
          amenities: prev.amenities && Object.keys(prev.amenities).length > 0 
            ? prev.amenities 
            : {}
        }));
      }
    }
  };

  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileSelection = (files) => {
    if (!files || files.length === 0) return;
    const newFiles = Array.from(files);
    setSelectedFiles((prev) => [...prev, ...newFiles]);

    if (newFiles.length > 1) {
      setTimeout(() => handleImageUpload(), 100);
    }
  };

  const handleImageUpload = async () => {
    if (selectedFiles.length === 0) return;
    setUploadingImages(true);

    try {
      const uploadedImagesData = [];

      for (const file of selectedFiles) {
        const formDataToUpload = new FormData();
        formDataToUpload.append("file", file);

        // Upload the current file
        const uploadedImage = await uploadImages(formDataToUpload);

        if (Array.isArray(uploadedImage)) {
          uploadedImagesData.push(...uploadedImage);
        } else {
          uploadedImagesData.push(uploadedImage);
        }
      }

      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...uploadedImagesData],
      }));

      setSelectedFiles([]);
      resetFileInput();
    } catch (error) {
      console.error("Error uploading images:", error);
    } finally {
      setUploadingImages(false);
    }
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeUploadedImage = async (index, imageId) => {
    try {
      await deleteImage(imageId);
      const updatedImages = [...formData.images];
      updatedImages.splice(index, 1);
      setFormData((prev) => ({
        ...prev,
        images: updatedImages,
      }));
    } catch (error) {
      console.error("Error deleting image:", error);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    handleFileSelection(files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("formData", formData);

    try {
      const preparedFormData = { ...formData };

      if (formData.purpose === "Rent") {
        console.log("Processing rental property");
        preparedFormData.monthlyRent = Number(formData.monthlyRent) || 0;
        preparedFormData.weeklyRent = Number(formData.weeklyRent) || 0;
        preparedFormData.dailyRent = Number(formData.dailyRent) || 0;

        console.log("Amenities before processing:", formData.amenities);

        if (formData.amenities && typeof formData.amenities === "object") {
          const amenitiesArray = [];
          Object.entries(formData.amenities).forEach(([key, value]) => {
            if (value) {
              const amenityObj = {};
              amenityObj[key] = value;
              amenitiesArray.push(amenityObj);
            }
          });
          preparedFormData.amenities = amenitiesArray;
        } else {
          preparedFormData.amenities = [];
        }
      } else if (formData.purpose === "Sell" || formData.purpose === "Buy") {
        preparedFormData.totalPrice = Number(formData.totalPrice) || 0;
        preparedFormData.downPayment = Number(formData.downPayment) || 0;
      }

      await onSubmit(preparedFormData);
     
      window.location.reload();
    } catch (error) {
      console.error("Error updating unit:", error);
    }

    return false;
  };

  const handleAddPaymentPlan = (plan) => {
    const currentPlans = formData.paymentPlans
      ? formData.paymentPlans.split(", ")
      : [];

    if (!currentPlans.includes(plan)) {
      const updatedPlans = [...currentPlans, plan].join(", ");
      setFormData((prev) => ({
        ...prev,
        paymentPlans: updatedPlans,
      }));
    }

    setIsPaymentPlanPopupOpen(false);
  };

  const handleRemovePaymentPlan = (indexToRemove) => {
    const currentPlans = formData.paymentPlans.split(", ");
    const updatedPlans = currentPlans
      .filter((_, index) => index !== indexToRemove)
      .join(", ");

    setFormData((prev) => ({
      ...prev,
      paymentPlans: updatedPlans,
    }));
  };

  const handleCompoundSave = (compoundData) => {
    setFormData((prev) => ({
      ...prev,
      compound: compoundData.name || compoundData.compoundName,
    }));
    setIsAddCompoundModalOpen(false);
  };

  const handleDeveloperSave = (developerData) => {
    setFormData((prev) => ({
      ...prev,
      developer: developerData.name,
    }));
    setIsAddDeveloperModalOpen(false);
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="mt-4">
        {/* Basic Information Section */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">
            Basic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit Title
              </label>
              <input
                type="text"
                name="unitTitle"
                value={formData.unitTitle}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Building Type
              </label>
              <select
                name="buildingType"
                value={formData.buildingType}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Select Building Type</option>
                {propertyEnums.EnumBuildingType.map((type, index) => (
                  <option
                    key={index}
                    value={type.charAt(0).toUpperCase() + type.slice(1)}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purpose
              </label>
              <select
                name="purpose"
                value={formData?.purpose}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                
                <option value={formData?.purpose}>{formData?.purpose.charAt(0).toUpperCase() + formData?.purpose.slice(1)}</option>
                {propertyEnums.EnumPropertyIntent.map((intent, index) => (
                  <option
                    key={index}
                    value={intent.charAt(0).toUpperCase() + intent.slice(1)}
                  >
                    {intent.charAt(0).toUpperCase() + intent.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Compound Field */}
            <div className="relative">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Compound
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddCompoundModalOpen(true)}
                  className="text-xs text-primary hover:text-primary/80"
                >
                  + Add New
                </button>
              </div>

              <div
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-primary cursor-pointer flex justify-between items-center"
                onClick={() =>
                  setIsCompoundDropdownOpen(!isCompoundDropdownOpen)
                }
              >
                <span>{formData.compound || "Select Compound"}</span>
                <span>{isCompoundDropdownOpen ? "▲" : "▼"}</span>
              </div>

              {isCompoundDropdownOpen && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {comboundata &&
                    comboundata.map((compound, index) => (
                      <div
                        key={index}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            compound: compound.name,
                          }));
                          setIsCompoundDropdownOpen(false);
                        }}
                      >
                        {compound.name}
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Developer Field */}
            <div className="relative">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Developer
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddDeveloperModalOpen(true)}
                  className="text-xs text-primary hover:text-primary/80"
                >
                  + Add New
                </button>
              </div>

              <div
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-primary cursor-pointer flex justify-between items-center"
                onClick={() => setIsDevDropdownOpen(!isDevDropdownOpen)}
              >
                <span>{formData.developer || "Select Developer"}</span>
                <span>{isDevDropdownOpen ? "▲" : "▼"}</span>
              </div>

              {isDevDropdownOpen && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {developers &&
                    developers.map((developer, index) => (
                      <div
                        key={index}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            developer: developer.name,
                          }));
                          setIsDevDropdownOpen(false);
                        }}
                      >
                        {developer.name}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Location Section */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Location</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Country
              </label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                View
              </label>
              <select
                name="view"
                value={formData.view}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Select View</option>
                {propertyEnums.EnumViewType.map((view, index) => (
                  <option
                    key={index}
                    value={view.charAt(0).toUpperCase() + view.slice(1)}
                  >
                    {view.charAt(0).toUpperCase() + view.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Pricing Section */}
        {(isSellProperty || formData.purpose === "Buy") && (
          <PricingSection
            formData={formData}
            handleChange={handleChange}
            setIsPaymentPlanPopupOpen={setIsPaymentPlanPopupOpen}
            handleRemovePaymentPlan={handleRemovePaymentPlan}
          />
        )}

        {/* Property Details Section - Now using the separate component */}
        <PropertyDetailsSection
          formData={formData}
          handleChange={handleChange}
        />

        {/* Rental Details Section */}
        {console.log(formData.purpose)}
        {(isRentalProperty || formData.purpose === "Rent") && (
          <RentalDetailsSection
            formData={formData}
            setFormData={setFormData}
            handleChange={handleChange}
          />
        )}

        {/* Additional Details Section */}
        <AdditionalDetailsSection
          formData={formData}
          handleChange={handleChange}
        />
        {/* Images Section */}
        <ImagesSection
          formData={formData}
          selectedFiles={selectedFiles}
          uploadingImages={uploadingImages}
          fileInputRef={fileInputRef}
          handleDragOver={handleDragOver}
          handleDrop={handleDrop}
          handleFileSelection={handleFileSelection}
          handleImageUpload={handleImageUpload}
          removeSelectedFile={removeSelectedFile}
          removeUploadedImage={removeUploadedImage}
        />

        {/* Form Actions */}
        <div className="flex justify-end gap-4 mt-8">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Update Unit
          </button>
        </div>
      </form>

      {/* Modals */}
      {isPaymentPlanPopupOpen && (
        <PaymentPlanPopup
          onClose={() => setIsPaymentPlanPopupOpen(false)}
          onSave={handleAddPaymentPlan}
        />
      )}
      {isAddCompoundModalOpen && (
        <AddCompoundModal
          onClose={() => setIsAddCompoundModalOpen(false)}
          onSave={handleCompoundSave}
        />
      )}
      {isAddDeveloperModalOpen && (
        <AddDeveloperModal
          onClose={() => setIsAddDeveloperModalOpen(false)}
          onSave={handleDeveloperSave}
        />
      )}
    </div>
  );
};
export default UpdateUnitForm;
