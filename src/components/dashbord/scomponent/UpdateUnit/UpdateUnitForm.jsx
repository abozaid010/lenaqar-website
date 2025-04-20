"use client";
import {
  uploadImages,
  deleteImage,
  updateUnitRent,
} from "@/components/services/serviceFetching";
import React, { useState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react"; // Import the spinner icon from lucide-react

import propertyEnums from "../../data/propertyEnums.json";
import PaymentPlanPopup from "../PaymentPlanPopup";
import AddCompoundModal from "../AddCompoundModal";
import AddDeveloperModal from "../AddDeveloperModal";
import PropertyDetailsSection from "./PropertyDetailsSection";
import AdditionalDetailsSection from "./AdditionalDetailsSection";
import ImagesSection from "./ImagesSection";
import RentalDetailsSectionUpdate from "./RentalDetailsSectionUpdate";
import PricingSection from "./PricingSection";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

// Define cities data
const citiesByCountry = {
  Egypt: ["Cairo", "Alexandria", "Giza", "Sharm El Sheikh", "Hurghada", "El Gouna", "Dahab", "Luxor", "Aswan", "Port Said"],
  UAE: ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah", "Fujairah", "Umm Al Quwain"],
  "Saudi Arabia": ["Riyadh", "Jeddah", "Mecca", "Medina", "Dammam", "Khobar", "Taif", "Tabuk"],
  Qatar: ["Doha", "Al Wakrah", "Al Khor", "Dukhan", "Mesaieed", "Lusail"],
  Bahrain: ["Manama", "Riffa", "Muharraq", "Hamad Town", "Isa Town"],
  Kuwait: ["Kuwait City", "Hawalli", "Salmiya", "Fahaheel", "Jahra"],
  Oman: ["Muscat", "Salalah", "Sohar", "Sur", "Nizwa"],
};

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
    district: "", // Added district field with empty string default
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
    deliveryDate: "",
    amenities: {},
  });

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false); // New state for tracking form submission
  const fileInputRef = useRef(null);
  const [isPaymentPlanPopupOpen, setIsPaymentPlanPopupOpen] = useState(false);
  const [isAddCompoundModalOpen, setIsAddCompoundModalOpen] = useState(false);
  const [isAddDeveloperModalOpen, setIsAddDeveloperModalOpen] = useState(false);
  const [isCompoundDropdownOpen, setIsCompoundDropdownOpen] = useState(false);
  const [isDevDropdownOpen, setIsDevDropdownOpen] = useState(false);
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [isRentalProperty, setIsRentalProperty] = useState(false);
  const [isSellProperty, setIsSellProperty] = useState(false);
  const [availableCities, setAvailableCities] = useState([]);
  const initialLoad = useRef(true);
  const router = useRouter();
  
  // For debugging
  useEffect(() => {
    console.log("formData updated:", formData);
  }, [formData]);

  useEffect(() => {
    if (unit && initialLoad.current) {
      setFormData({
        unitTitle: unit.unitTitle || "",
        unitId: unit.unitId || "",
        buildingType: unit.buildingType || "",
        city: unit.city || "",
        country: unit.country || "",
        district: unit.district || "", // Added district field
        compound: unit.compound || "",
        developer: unit.developer || "",
        purpose:
          unit.purpose.charAt(0).toUpperCase() + unit.purpose.slice(1) || "",
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
        paymentPlans: unit.paymentPlans || {
          years: 0,
          price: 0,
          maintenance: 0
        },
        deliveryDate: unit.deliveryDate ? unit.deliveryDate.split("T")[0] : "",
        clientId: unit.clientId || "",
        clientName: unit.clientName || "",
        dataSource: unit.dataSource || "",
        images: unit.images || [],
        updatedAt: unit.updatedAt || "",
        availability: unit.availability || false,
        deliveryDate: unit.deliveryDate ? unit.deliveryDate.split("T")[0] : "",
        amenities: unit.amenities || {},
        isGated: unit.isGated || false,
        rentPrice: unit.rentPrice || 0,
        availabilityDate: unit.availabilityDate || "",
        rentDurationType: unit.rentDurationType || "",
        isAvailable: unit.isAvailable || false,
        deliveryStatus: unit.deliveryStatus || "",
      });

      // Set the property type states based on the purpose
      setIsRentalProperty(unit.purpose === "Rent");
      setIsSellProperty(unit.purpose === "Sell" || unit.purpose === "Buy");
      
      // Set available cities based on the country
      if (unit.country && citiesByCountry[unit.country]) {
        setAvailableCities(citiesByCountry[unit.country]);
      }
      
      initialLoad.current = false;
    }
  }, [unit]);

  // Update cities when country changes
  useEffect(() => {
    if (formData.country && citiesByCountry[formData.country]) {
      setAvailableCities(citiesByCountry[formData.country]);
    } else {
      setAvailableCities([]);
    }
  }, [formData.country]);

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
        setFormData((prev) => ({
          ...prev,
          [name]: value,
          amenities:
            prev.amenities && Object.keys(prev.amenities).length > 0
              ? prev.amenities
              : {},
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
      
      // Show success toast instead of auto-submitting
      toast.success("Images uploaded successfully");
    } catch (error) {
      console.error("Error uploading images:", error);
      toast.error("Failed to upload images");
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
      
      // Check if there are images before proceeding
      if (!formData.images || formData.images.length === 0) {
        toast.error("Please upload at least one image before updating the unit");
        return;
      }
      
      // Set updating state to true to show spinner and disable button
      setIsUpdating(true);
  
      try {
        // For rental properties, check if availabilityDate is provided
        if (formData.purpose === "Rent") {
          if (!formData.availabilityDate || formData.availabilityDate.trim() === "") {
            toast.error("Please provide an availability date for rental properties");
            setIsUpdating(false); // Reset updating state
            return;
          }
          
          // التحقق من وجود سعر على الأقل في أحد خيارات مدة الإيجار
          const rentDurationType = formData.rentDurationType;
          const hasValidPrice = rentDurationType && (
            (rentDurationType.daily && rentDurationType.daily.price > 0) ||
            (rentDurationType.weekly && rentDurationType.weekly.price > 0) ||
            (rentDurationType.monthly && rentDurationType.monthly.price > 0)
          );
          
          if (!hasValidPrice) {
            toast.error("Please provide at least one price for rental duration options");
            setIsUpdating(false);
            return;
          }
        }

        // For Buy properties, check if all required fields are filled
        if (formData.purpose === "Buy") {
          // Check if totalPrice is greater than zero
          if (!formData.totalPrice || Number(formData.totalPrice) <= 0) {
            toast.error("Total Price must be greater than zero");
            setIsUpdating(false);
            return;
          }
          
          // Modified: Allow downPayment to be zero
          if (formData.downPayment === undefined || formData.downPayment === null) {
            toast.error("Down Payment must be provided");
            setIsUpdating(false);
            return;
          }
          
          // Check other required fields
          if (!formData.deliveryDate || formData.deliveryDate.trim() === "") {
            toast.error("Please provide Delivery Date for Buy properties");
            setIsUpdating(false);
            return;
          }
        }

        const preparedFormData = { ...formData };

        // Convert finishing to lowercase
        if (preparedFormData.finishing) {
          preparedFormData.finishing = preparedFormData.finishing.toLowerCase();
        }

        // Convert view to lowercase
        if (preparedFormData.view) {
          preparedFormData.view = preparedFormData.view.toLowerCase();
        }

        // Calculate delivery status based on delivery date for Buy/Sell properties
        if ((formData.purpose === "Sell" || formData.purpose === "Buy") && formData.deliveryDate) {
          const today = new Date();
          const deliveryDate = new Date(formData.deliveryDate);
          
          // Set deliveryStatus based on date comparison
          preparedFormData.deliveryStatus = deliveryDate > today ? "off-plan" : "ready to move";
        }

        if (formData.purpose === "Rent") {
          console.log("Processing rental property");

          // For rental properties, keep the existing values
          // No need to modify rentPrice, it will be sent as is
          
          // Remove sell/buy specific fields for Rent
          delete preparedFormData.paymentPlans;
          delete preparedFormData.downPayment;
          delete preparedFormData.deliveryDate;
          delete preparedFormData.totalPrice;
          delete preparedFormData.availability;
          delete preparedFormData.deliveryStatus;

          console.log("Amenities before processing:", formData.amenities);

          // Only process amenities if needed
          if (formData.amenities && typeof formData.amenities === "object" && !Array.isArray(formData.amenities)) {
            const amenitiesArray = [];
            Object.entries(formData.amenities).forEach(([key, value]) => {
              if (value) {
                amenitiesArray.push(key);
              }
            });
            preparedFormData.amenities = amenitiesArray;
          }
        } else if (formData.purpose === "Sell" || formData.purpose === "Buy") {
          preparedFormData.totalPrice = Number(formData.totalPrice) || 0;
          preparedFormData.downPayment = Number(formData.downPayment) || 0;

          // Remove rental-specific fields for Sell/Buy properties
          delete preparedFormData.amenities;
          delete preparedFormData.availability;
          delete preparedFormData.availabilityDate;
          delete preparedFormData.rentDurationType;
          delete preparedFormData.rentPrice;
          delete preparedFormData.isAvailable;
        }
        
        console.log(formData.purpose);
        await onSubmit(preparedFormData, formData.purpose);

        // Reload window after successful update
        window.location.reload();
      } catch (error) {
        console.error("Error updating unit:", error);
        setIsUpdating(false); // Reset updating state if there's an error
      }

      return false;
    };

    const handleAddPaymentPlan = (planData) => {
      // Update payment plans as an object with the new structure
      setFormData((prev) => ({
        ...prev,
        paymentPlans: {
          years: planData.years || 0,
          price: planData.price || 0,
          maintenance: planData.maintenance || 0
        }
      }));
      setIsPaymentPlanPopupOpen(false);
    };

    const handleRemovePaymentPlan = () => {
      // Reset payment plans to default values
      setFormData((prev) => ({
        ...prev,
        paymentPlans: {
          years: 0,
          price: 0,
          maintenance: 0
        }
      }));
    };

    const handleCompoundSave = (compoundData) => {
      // Using a callback to ensure we're working with the latest state
      setFormData((prev) => {
        const updated = {
          ...prev,
          compound: compoundData.name,
        };
        
        // Log to confirm the update
        console.log("Updating compound to:", compoundData.name);
        return updated;
      });
      
      // Close the modal after state update is queued
      setIsAddCompoundModalOpen(false);
      
      // Set timeout to verify compound value after state update has processed
      setTimeout(() => {
        console.log("Compound value after update:", formData.compound);
      }, 100);
    };

    const handleDeveloperSave = (developerData) => {
      // Using the same pattern as compound save to ensure consistency
      setFormData((prev) => {
        const updated = {
          ...prev,
          developer: developerData.name,
        };
        console.log("Updating developer to:", developerData.name);
        return updated;
      });
      
      setIsAddDeveloperModalOpen(false);
      
      setTimeout(() => {
        console.log("Developer value after update:", formData.developer);
      }, 100);
    };

    // Fixed the missing closing of the grid layout in the Location section
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
                    <option key={index} value={type}>
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
                  <option value={formData?.purpose}>
                    {formData?.purpose.charAt(0).toUpperCase() +
                      formData?.purpose.slice(1)}
                  </option>
                  {propertyEnums.EnumPropertyIntent
                    .filter(intent => 
                      intent.charAt(0).toUpperCase() + intent.slice(1) !== formData?.purpose
                    )
                    .map((intent, index) => (
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

          {/* Location Section - Fixed layout issue */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Location</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Country Dropdown */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                <div
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-primary cursor-pointer flex justify-between items-center"
                  onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                >
                  <span>{formData.country || "Select Country"}</span>
                  <span>{isCountryDropdownOpen ? "▲" : "▼"}</span>
                </div>

                {isCountryDropdownOpen && (
                  <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {Object.keys(citiesByCountry).map((country, index) => (
                      <div
                        key={index}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            country: country,
                            // Clear city when country changes
                            city: "",
                          }));
                          setIsCountryDropdownOpen(false);
                        }}
                      >
                        {country}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* City Dropdown */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <div
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-primary cursor-pointer flex justify-between items-center"
                  onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
                >
                  <span>{formData.city || "Select City"}</span>
                  <span>{isCityDropdownOpen ? "▲" : "▼"}</span>
                </div>

                {isCityDropdownOpen && (
                  <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {availableCities.length > 0 ? (
                      availableCities.map((city, index) => (
                        <div
                          key={index}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              city: city,
                            }));
                            setIsCityDropdownOpen(false);
                          }}
                        >
                          {city}
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-gray-500">
                        Please select a country first
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* District field */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  District
                </label>
                <input
                  type="text"
                  name="district"
                  value={formData.district || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                />
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
          {(isRentalProperty || formData.purpose === "Rent") && (
            <RentalDetailsSectionUpdate
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
              disabled={isUpdating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-6 py-2 ${
                isUpdating
                  ? "bg-gray-400 cursor-not-allowed" 
                  : "bg-primary hover:bg-primary/90"
              } text-white rounded-lg flex items-center justify-center`}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Unit"
              )}
            </button>
          </div>
        </form>

        {/* Modals */}
        {isPaymentPlanPopupOpen && (
          <PaymentPlanPopup
            isOpen={isPaymentPlanPopupOpen}
            onClose={() => setIsPaymentPlanPopupOpen(false)}
            onAdd={handleAddPaymentPlan}
          />
        )}
        {isAddCompoundModalOpen && (
          <AddCompoundModal
            isOpen={isAddCompoundModalOpen}
            onClose={() => setIsAddCompoundModalOpen(false)}
            onSave={handleCompoundSave}
            developersData={developers}
          />
        )}
        {isAddDeveloperModalOpen && (
          <AddDeveloperModal
            isOpen={isAddDeveloperModalOpen}
            onClose={() => setIsAddDeveloperModalOpen(false)}
            onSave={handleDeveloperSave}
          />
        )}
      </div>
    );
};

export default UpdateUnitForm;