"use client";
import {
  updateUnit,
  uploadImages,
  deleteImage,
} from "@/components/services/serviceFetching";
import React, { useState, useEffect, useRef } from "react";
import { Trash2, Upload, Plus, X } from "lucide-react";
import propertyEnums from "../data/propertyEnums.json";
import PaymentPlanPopup from "./PaymentPlanPopup";

import AddCompoundModal from "./AddCompoundModal";
import AddDeveloperModal from "./AddDeveloperModal";
import { useRouter } from "next/navigation";
const AMENITIES_LIST = [
  { id: "wifi", label: "WiFi" },
  { id: "air_condition", label: "Air Conditioning" },
  { id: "parking", label: "Parking" },
  { id: "gym", label: "Gym" },
  { id: "pool", label: "Swimming Pool" },
  { id: "security", label: "Security" },
  { id: "elevator", label: "Elevator" },
  { id: "balcony", label: "Balcony" },
  { id: "garden", label: "Garden" },
  { id: "cleaning", label: "Cleaning Service" },
];


const UpdateUnitForm = ({
  unit,
  onSubmit,
  onCancel,
  comboundata,
  developers,
}) => {
  // Form state


const UpdateUnitForm = ({ unit, onSubmit, onCancel }) => {

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
    // Add rental properties
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
        purpose: unit.purpose || "",
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
        // Add rental properties
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
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Update property type states when purpose changes
    if (name === "purpose") {
      setIsRentalProperty(value === "Rent");
      setIsSellProperty(value === "Sell" || value === "Buy");
    }
  };

  // Reset file input to allow reselecting the same file
  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileSelection = (files) => {
    if (!files || files.length === 0) return;

    // Convert FileList to Array - now allowing multiple files
    const newFiles = Array.from(files);

    // Store the selected files without uploading immediately
    setSelectedFiles((prev) => [...prev, ...newFiles]);

    // If more than one image is selected, trigger upload automatically
    if (newFiles.length > 1) {
      // We'll use setTimeout to ensure state is updated before upload
      setTimeout(() => handleImageUpload(), 100);
    }

  };

  const handleImageUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploadingImages(true);

    try {

      // Create an array to store all uploaded image data
      const uploadedImagesData = [];

      // Upload each file one by one
      for (const file of selectedFiles) {
        const formDataToUpload = new FormData();
        formDataToUpload.append("file", file);

        // Upload the current file
        const uploadedImage = await uploadImages(formDataToUpload);

        // Add to our array of uploaded images
        if (Array.isArray(uploadedImage)) {
          uploadedImagesData.push(...uploadedImage);
        } else {
          uploadedImagesData.push(uploadedImage);
        }
      }

      // Update formData values with all new images
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...uploadedImagesData],

      }));

      setSelectedFiles([]);
      resetFileInput();
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setUploadingImages(false);
    }
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeUploadedImage = async (index, imageId) => {
    try {
      // استخدام وظيفة deleteImage من serviceFetching
      await deleteImage(imageId);

      // Remove from formData state after successful API deletion
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
    e.preventDefault(); // This prevents the page from reloading
    console.log("formData", formData);


    try {
      // Create a copy of the form data to modify before submission
      const preparedFormData = { ...formData };

      // Handle purpose-specific fields
      if (formData.purpose === "Rent") {
        console.log("Processing rental property");

        // Convert rent values to numbers
        preparedFormData.monthlyRent = Number(formData.monthlyRent) || 0;
        preparedFormData.weeklyRent = Number(formData.weeklyRent) || 0;
        preparedFormData.dailyRent = Number(formData.dailyRent) || 0;

        console.log("Amenities before processing:", formData.amenities);

        // Format amenities as an array of objects
        if (formData.amenities && typeof formData.amenities === "object") {
          const amenitiesArray = [];

          // Convert the amenities object to array of objects format
          Object.entries(formData.amenities).forEach(([key, value]) => {
            // Only include amenities that are available (true)
            if (value) {
              const amenityObj = {};
              amenityObj[key] = value;
              amenitiesArray.push(amenityObj);
            }
          });

          preparedFormData.amenities = amenitiesArray;
          console.log(
            "Formatted amenities as array of objects:",
            preparedFormData.amenities
          );
        } else {
          preparedFormData.amenities = [];
          console.log("No amenities found, using empty array");
        }
      } else if (formData.purpose === "Sell" || formData.purpose === "Buy") {
        // Convert price values to numbers
        preparedFormData.totalPrice = Number(formData.totalPrice) || 0;
        preparedFormData.downPayment = Number(formData.downPayment) || 0;
      }

      // Call the onSubmit function with the prepared data
      await onSubmit(preparedFormData);

      // Refresh the page
      window.location.reload();
    } catch (error) {
      console.error("Error updating unit:", error);
    }

    return false; // Extra measure to prevent form submission
  };


  const handleAddPaymentPlan = (plan) => {
    const currentPlans = formData.paymentPlans
      ? formData.paymentPlans.split(", ")
      : [];

    // Check if plan already exists
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
    // Set the newly created compound name to the unit's compound field
    setFormData((prev) => ({
      ...prev,
      compound: compoundData.name || compoundData.compoundName,
    }));
    setIsAddCompoundModalOpen(false);
  };

  const handleDeveloperSave = (developerData) => {
    // Set the newly created developer name to the unit's developer field
    setFormData((prev) => ({
      ...prev,
      developer: developerData.name,
    }));
    setIsAddDeveloperModalOpen(false);
  };


  return (
    <>
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
                value={formData.purpose}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Select Purpose</option>
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

            {/* Compound Field - Fixed Layout */}
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

              {/* Main dropdown button */}
              <div
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-primary cursor-pointer flex justify-between items-center"
                onClick={() =>
                  setIsCompoundDropdownOpen(!isCompoundDropdownOpen)
                }
              >
                <span>{formData.compound || "Select Compound"}</span>
                <span>{isCompoundDropdownOpen ? "▲" : "▼"}</span>
              </div>

              {/* Dropdown menu */}
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

            {/* Developer Field - Fixed Layout */}
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

              {/* Main dropdown button */}
              <div
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-primary cursor-pointer flex justify-between items-center"
                onClick={() => setIsDevDropdownOpen(!isDevDropdownOpen)}
              >
                <span>{formData.developer || "Select Developer"}</span>
                <span>{isDevDropdownOpen ? "▲" : "▼"}</span>
              </div>

              {/* Dropdown menu */}
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

        {/* Pricing Section - Only show if purpose is "Sell" or "Buy" */}
        {(isSellProperty || formData.purpose === "Buy") && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">
              Pricing & Payment
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Price
                </label>
                <input
                  type="number"
                  name="totalPrice"
                  value={formData.totalPrice}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Down Payment
                </label>
                <input
                  type="number"
                  name="downPayment"
                  value={formData.downPayment}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Date
                </label>
                <input
                  type="date"
                  name="deliveryDate"
                  value={formData.deliveryDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>


              <div className="md:col-span-3">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Payment Plans
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsPaymentPlanPopupOpen(true)}
                    className="flex items-center text-xs text-primary hover:text-primary/80"
                  >
                    <Plus className="w-3 h-3 mr-1" /> Add Plan
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {!formData.paymentPlans ? (
                    <p className="text-sm text-gray-500 italic">
                      No payment plans added yet.
                    </p>
                  ) : (
                    formData.paymentPlans.split(", ").map((plan, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm"
                      >
                        <span>{plan}</span>
                        <button
                          type="button"
                          onClick={() => handleRemovePaymentPlan(index)}
                          className="text-gray-500 hover:text-red-500 ml-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Property Details Section */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">
            Property Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rooms Count

              </label>
              <input
                type="number"
                name="roomsCount"
                value={formData.roomsCount}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bathroom Count
              </label>
              <input
                type="number"
                name="bathroomCount"
                value={formData.bathroomCount}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Floor
              </label>
              <input
                type="number"
                name="floor"
                value={formData.floor}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Land Area (m²)
              </label>
              <input
                type="number"
                name="landArea"
                value={formData.landArea}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Garden Size (m²)
              </label>
              <input
                type="number"
                name="gardenSize"
                value={formData.gardenSize}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Garage Area (m²)
              </label>
              <input
                type="number"
                name="garageArea"
                value={formData.garageArea}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Delivery Date
            </label>
            <input
              type="date"
              name="deliveryDate"
              value={formData.deliveryDate}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        {/* Rental Details Section - Only show if purpose is "Rent" */}
        {isRentalProperty && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">
              Rental Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Availability
                </label>
                <select
                  name="availability"
                  value={formData.availability ? "true" : "false"}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      availability: e.target.value === "true",
                    }));
                  }}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="true">Available</option>
                  <option value="false">Not Available</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Starting Date
                </label>
                <input
                  type="date"
                  name="startingDate"
                  value={formData.startingDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monthly Rent
                </label>
                <input
                  type="number"
                  name="monthlyRent"
                  value={formData.monthlyRent}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Weekly Rent
                </label>
                <input
                  type="number"
                  name="weeklyRent"
                  value={formData.weeklyRent}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Daily Rent
                </label>
                <input
                  type="number"
                  name="dailyRent"
                  value={formData.dailyRent}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            {/* Amenities Section */}
                        {/* Amenities Section */}
                        <div className="mt-6">
              <h4 className="text-lg font-medium text-gray-700 mb-3">
                Amenities
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {/* Replace the propertyEnums.EnumAmenities with AMENITIES_LIST */}
                {AMENITIES_LIST.map((amenity) => (
                  <div key={amenity.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`amenity-${amenity.id}`}
                      checked={formData.amenities[amenity.id] || false}
                      onChange={(e) => {
                        setFormData((prev) => ({
                          ...prev,
                          amenities: {
                            ...prev.amenities,
                            [amenity.id]: e.target.checked,
                          },
                        }));
                      }}
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <label
                      htmlFor={`amenity-${amenity.id}`}
                      className="ml-2 text-sm text-gray-700"
                    >
                      {amenity.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Additional Details Section */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">
            Additional Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Finishing Type
              </label>
              <select
                name="finishing"
                value={formData.finishing}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Select Finishing Type</option>
                {propertyEnums.EnumFinishingType.map((type, index) => (
                  <option
                    key={index}
                    value={type.charAt(0).toUpperCase() + type.slice(1)}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Images Section */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">
            Property Images
          </h3>

          {/* Drag and drop area */}
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 mb-4 text-center cursor-pointer hover:bg-gray-50 transition-colors"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFileSelection(e.target.files)}
              className="hidden"
              multiple
              accept="image/*"
            />
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">
              Drag and drop images here, or click to select files
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Supports: JPG, PNG, GIF (Max 5MB each)
            </p>
          </div>


          {/* Selected files preview */}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Developer
            </label>
            <input
              type="text"
              name="developer"
              value={formData.developer}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Hidden fields */}
          <input
            type="hidden"
            name="dataSource"
            value={formData.dataSource || "website"}
          />
          <input
            type="hidden"
            name="clientId"
            value={formData.clientId}
          />
          <input
            type="hidden"
            name="clientName"
            value={formData.clientName}
          />
        </div>
      </div>

      {/* Image Upload Section */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">
          Property Images
        </h3>
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">
            Drag and drop images here, or click to select files
          </p>
          <p className="text-xs text-gray-400">
            Supported formats: JPG, PNG, WEBP (Max 5MB each)
          </p>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            id="image-upload"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFileSelection(e.target.files);
              }
            }}
            onClick={(e) => {
              e.target.value = "";
            }}
          />
          <label
            htmlFor="image-upload"
            className="mt-4 inline-block px-4 py-2 bg-primary cursor-pointer hover:bg-primary/90 text-white rounded-lg transition-colors mr-2"
          >
            {selectedFiles.length > 0 ? "Change Image" : "Select Image"}
          </label>
          

          {selectedFiles.length > 0 && (
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-md font-medium text-gray-700">
                  Selected Images ({selectedFiles.length})
                </h4>
                <button
                  type="button"
                  onClick={handleImageUpload}
                  disabled={uploadingImages}
                  className="px-3 py-1 bg-primary text-white rounded-md text-sm hover:bg-primary/90 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
                >
                  {uploadingImages ? (
                    "Uploading..."
                  ) : (
                    <>
                      <Upload className="w-3 h-3 mr-1" /> Upload All
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="relative group border rounded-lg overflow-hidden"

  
                  >
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Selected ${index + 1}`}
                      className="w-full h-32 object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => removeSelectedFile(index)}
                        className="p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate">
                      {file.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Uploaded images */}
          {formData.images && formData.images.length > 0 && (
            <div>
              <h4 className="text-md font-medium text-gray-700 mb-2">
                Uploaded Images ({formData.images.length})
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {formData.images.map((image, index) => (
                  <div
                    key={index}
                    className="relative group border rounded-lg overflow-hidden"
                  >
                    <img
                      src={image.url}
                      alt={`Property ${index + 1}`}
                      className="w-full h-32 object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => removeUploadedImage(index, image._id)}
                        className="p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          )}
        </div>

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

    </>
  );
};

export default UpdateUnitForm;
