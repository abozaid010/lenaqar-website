"use client";

import React, { useState, useEffect } from "react";
import { X, ArrowRight, Save as SaveIcon } from "lucide-react";
import AddCompoundModal from "@/components/dashbord/scomponent/AddCompoundModal";
import PaymentPlanPopup from "@/components/dashbord/scomponent/PaymentPlanPopup";
import { useUnitForm } from "@/components/dashbord/hooks/useUnitForm";
import propertyEnums from "@/components/dashbord/data/propertyEnums.json";
import AddDeveloperModal from "@/components/dashbord/scomponent/AddDeveloperModal";
import ImageUploadSection from "@/components/dashbord/scomponent/AddUnit/ImageUploadSection";
import AdditionalDetailsSection from "@/components/dashbord/scomponent/AddUnit/AdditionalDetailsSection";
import FinancialDetailsSection from "@/components/dashbord/scomponent/AddUnit/FinancialDetailsSection";
import PropertySpecificationsSection from "@/components/dashbord/scomponent/AddUnit/PropertySpecificationsSection";
import RentalDetailsSection from "@/components/dashbord/scomponent/AddUnit/RentalDetailsSection";
import toast from "react-hot-toast";

const AddUnitModal = ({
  isOpen,
  onClose,
  onSave,
  comboundata,
  developersData,
}) => {
  const {
    formik,
    isAddCompoundModalOpen,
    uploadingImages,
    selectedFiles,
    isPaymentPlanPopupOpen,
    fileInputRef,
    setIsAddCompoundModalOpen,
    setIsPaymentPlanPopupOpen,
    handleFileSelection,
    handleImageUpload,
    removeSelectedFile,
    removeUploadedImage,
    handleDrop,
    handleAddPaymentPlan,
    handleRemovePaymentPlan,
    handleDragOver,
    handleCompoundSave,
    isAddDeveloperModalOpen,
    setIsAddDeveloperModalOpen,
    handleDeveloperSave,
    uploadStatus,
  } = useUnitForm(onClose, onSave);

  const [isDevDropdownOpen, setIsDevDropdownOpen] = useState(false);
  const [isCompoundDropdownOpen, setIsCompoundDropdownOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  const [isRentalProperty, setIsRentalProperty] = useState(false);
  const [isSellProperty, setIsSellProperty] = useState(false);
  const [isStep1Valid, setIsStep1Valid] = useState(false);
  const [isStep2Valid, setIsStep2Valid] = useState(false);

  // Initialize amenities as an empty array
  useEffect(() => {
    setIsRentalProperty(formik.values.purpose === "Rent");
    setIsSellProperty(
      formik.values.purpose === "Sell" || formik.values.purpose === "Buy"
    );

    if (
      formik.values.purpose === "Rent" &&
      !Array.isArray(formik.values.amenities)
    ) {
      formik.setFieldValue("amenities", []);
    }
  }, [formik.values.purpose]);

  // Add this new effect to reset step when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
    }
  }, [isOpen]);

  // Validate step 1
  useEffect(() => {
    const requiredStep1Fields = [
      "compound",
      "unitTitle",
      "buildingType",
      "purpose",
      "city",
      // 'district'
    ];

    const step1Valid = requiredStep1Fields.every(
      (field) => formik.values[field] && formik.values[field].trim() !== ""
    );

    setIsStep1Valid(step1Valid);
  }, [formik.values]);

  // Validate step 2 fields
  useEffect(() => {
    if (currentStep === 2) {
      if (formik.values.purpose === "Sell" || formik.values.purpose === "Buy") {
        // Remove deliveryStatus from required fields since it's now set automatically
        const financialFields = ["totalPrice", "deliveryDate"];
        const isFinancialValid = financialFields.every(
          (field) =>
            formik.values[field] &&
            formik.values[field].toString().trim() !== ""
        );

        setIsStep2Valid(isFinancialValid);
      } else if (formik.values.purpose === "Rent") {
        // تعديل التحقق من rentDurationType ليتعامل معه ككائن
        const isRentDurationValid =
          formik.values.rentDurationType &&
          typeof formik.values.rentDurationType === "object" &&
          (formik.values.rentDurationType.daily?.price > 0 ||
            formik.values.rentDurationType.weekly?.price > 0 ||
            formik.values.rentDurationType.monthly?.price > 0);

        const isAvailabilityDateValid =
          formik.values.availabilityDate &&
          formik.values.availabilityDate.toString().trim() !== "";

        setIsStep2Valid(isRentDurationValid && isAvailabilityDateValid);
      }
    }
  }, [formik.values, currentStep]);

  const handleNextStep = () => {
    if (currentStep === 1) {
      // Touch only step 1 fields to show validation errors
      const step1Fields = [
        "compound",
        "unitTitle",
        "buildingType",
        "purpose",
        "city",
        "view",
      ];

      step1Fields.forEach((field) => {
        formik.setFieldTouched(field, true, true);
      });

      // Only proceed if all required fields are filled
      if (isStep1Valid) {
        setCurrentStep(2);
      } else {
        toast.error("Please fill all required fields");
      }
    } else if (currentStep === 2) {
      // Touch only step 2 fields based on property type
      if (formik.values.purpose === "Sell" || formik.values.purpose === "Buy") {
        // Remove deliveryStatus from fields to touch since it's now set automatically
        const financialFields = ["totalPrice", "downPayment", "deliveryDate"];
        financialFields.forEach((field) => {
          formik.setFieldTouched(field, true, true);
        });
      } else if (formik.values.purpose === "Rent") {
        // تعديل التحقق من الحقول للإيجار
        formik.setFieldTouched("availabilityDate", true, true);
        // لا نحتاج لتعيين rentDurationType كـ touched لأنه كائن الآن
      }

      // Validate fields based on purpose
      if (
        (formik.values.purpose === "Sell" || formik.values.purpose === "Buy") &&
        !isStep2Valid
      ) {
        toast.error("Please fill all required financial fields");
        return;
      } else if (formik.values.purpose === "Rent" && !isStep2Valid) {
        toast.error(
          "Please fill at least one rental duration price and availability date"
        );
        return;
      }

      setCurrentStep(3);
    }
  };

  const handleBackStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (formik.values.images.length === 0) {
      toast.error("You must upload images to the server first");
      return;
    }

    formik.handleSubmit();
  };

  // Add useEffect to reset step when modal opens or closes
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center overflow-y-auto p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-primary z-10 px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Add New Unit</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-primary/80 transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Progress steps indicator */}
        <div className="px-6 pt-4">
          <div className="flex items-center justify-between mb-6">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex flex-col items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full text-lg font-semibold ${
                    currentStep >= step
                      ? "bg-primary text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {step}
                </div>
                <span className="mt-2 text-sm font-medium text-gray-600">
                  {step === 1
                    ? "Basic Details"
                    : step === 2
                      ? isRentalProperty
                        ? "Rental Details"
                        : "Financial Details"
                      : "Images & Additional Info"}
                </span>
              </div>
            ))}
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
            <div
              className="bg-primary h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>

        <form className="p-6">
          {/* Step 1: Property Details Section */}
          {currentStep === 1 && (
            <div className="space-y-8">
              {/* Property Details Section */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-700 mb-4">
                  Property Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Compound
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsAddCompoundModalOpen(true)}
                        className="text-xs text-primary hover:text-primary/80 mb-1"
                      >
                        + Add New
                      </button>
                    </div>

                    <div className="relative">
                      <div
                        className={`w-full px-4 py-2 rounded-lg border ${
                          formik.touched.compound && formik.errors.compound
                            ? "border-red-500 focus:ring-red-500"
                            : "border-gray-300 focus:ring-primary"
                        } focus:border-transparent cursor-pointer flex justify-between items-center`}
                        onClick={() =>
                          setIsCompoundDropdownOpen(!isCompoundDropdownOpen)
                        }
                      >
                        <span>
                          {formik.values.compound || "Select Compound"}
                        </span>
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
                                  formik.setFieldValue(
                                    "compound",
                                    compound.name
                                  );
                                  formik.setFieldTouched("compound", true);
                                  setTimeout(() => {
                                    formik.validateField("compound");
                                  }, 0);
                                  setIsCompoundDropdownOpen(false);
                                }}
                              >
                                {compound.name}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>

                    <input
                      type="hidden"
                      name="compound"
                      value={formik.values.compound}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />

                    {formik.touched.compound && formik.errors.compound && (
                      <p className="mt-1 text-sm text-red-500">
                        {formik.errors.compound}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit Title
                    </label>
                    <input
                      type="text"
                      name="unitTitle"
                      value={formik.values.unitTitle}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`w-full px-4 py-2 rounded-lg border ${
                        formik.touched.unitTitle && formik.errors.unitTitle
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:ring-primary"
                      } focus:border-transparent`}
                    />
                    {formik.touched.unitTitle && formik.errors.unitTitle && (
                      <p className="mt-1 text-sm text-red-500">
                        {formik.errors.unitTitle}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Building Type
                    </label>
                    <div className="relative">
                      <select
                        name="buildingType"
                        value={formik.values.buildingType}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className={`w-full px-4 py-2 rounded-lg border appearance-none bg-white cursor-pointer ${
                          formik.touched.buildingType &&
                          formik.errors.buildingType
                            ? "border-red-500 focus:ring-red-500"
                            : "border-gray-300 hover:border-gray-400 focus:ring-primary focus:border-primary"
                        } focus:outline-none focus:ring-2 focus:ring-opacity-50 shadow-sm transition-all duration-200`}
                      >
                        <option value="">Select Building Type</option>
                        {propertyEnums.EnumBuildingType.map((type, index) => (
                          <option key={index} value={type} className="py-2">
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                        <svg
                          className="h-5 w-5"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>
                    {formik.touched.buildingType &&
                      formik.errors.buildingType && (
                        <p className="mt-1 text-sm text-red-500">
                          {formik.errors.buildingType}
                        </p>
                      )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Purpose
                    </label>
                    <div className="relative">
                      <select
                        name="purpose"
                        value={formik.values.purpose}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className={`w-full px-4 py-2 rounded-lg border appearance-none bg-white cursor-pointer ${
                          formik.touched.purpose && formik.errors.purpose
                            ? "border-red-500 focus:ring-red-500"
                            : "border-gray-300 hover:border-gray-400 focus:ring-primary focus:border-primary"
                        } focus:outline-none focus:ring-2 focus:ring-opacity-50 shadow-sm transition-all duration-200`}
                      >
                        <option value="" disabled>
                          Select Purpose
                        </option>
                        {propertyEnums.EnumPropertyIntent.map(
                          (intent, index) => (
                            <option
                              key={index}
                              value={
                                intent.charAt(0).toUpperCase() + intent.slice(1)
                              }
                              className="py-2"
                            >
                              {intent.charAt(0).toUpperCase() + intent.slice(1)}
                            </option>
                          )
                        )}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                        <svg
                          className="h-5 w-5"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>
                    {formik.touched.purpose && formik.errors.purpose && (
                      <p className="mt-1 text-sm text-red-500">
                        {formik.errors.purpose}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <div className="relative">
                      <select
                        name="city"
                        value={formik.values.city}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className={`w-full px-4 py-2 rounded-lg border appearance-none bg-white cursor-pointer ${
                          formik.touched.city && formik.errors.city
                            ? "border-red-500 focus:ring-red-500"
                            : "border-gray-300 hover:border-gray-400 focus:ring-primary focus:border-primary"
                        } focus:outline-none focus:ring-2 focus:ring-opacity-50 shadow-sm transition-all duration-200`}
                      >
                        <option value="">Select City</option>
                        <option value="Cairo">Cairo</option>
                        <option value="Alexandria">Alexandria</option>
                        <option value="Giza">Giza</option>
                        <option value="New Cairo">New Cairo</option>
                        <option value="6th of October">6th of October</option>

                        <option value="El Shorouk">El Shorouk</option>
                        <option value="Sheikh Zayed">Sheikh Zayed</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                        <svg
                          className="h-5 w-5"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>
                    {formik.touched.city && formik.errors.city && (
                      <p className="mt-1 text-sm text-red-500">
                        {formik.errors.city}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      District
                    </label>
                    <input
                      type="text"
                      name="district"
                      value={formik.values.district || ""}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder="Enter district name"
                      className={`w-full px-4 py-2 rounded-lg border ${
                        formik.touched.district && formik.errors.district
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:ring-primary"
                      } focus:border-transparent`}
                    />
                    {formik.touched.district && formik.errors.district && (
                      <p className="mt-1 text-sm text-red-500">
                        {formik.errors.district}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      View
                    </label>
                    <select
                      name="view"
                      value={formik.values.view}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`w-full px-4 py-2 rounded-lg border ${
                        formik.touched.view && formik.errors.view
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:ring-primary"
                      } focus:border-transparent`}
                    >
                      <option value="">Select View</option>
                      {propertyEnums.EnumViewType.map((view, index) => (
                        <option key={index} value={view}>
                          {view.charAt(0).toUpperCase() + view.slice(1)}
                        </option>
                      ))}
                    </select>
                    {formik.touched.view && formik.errors.view && (
                      <p className="mt-1 text-sm text-red-500">
                        {formik.errors.view}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Property Specifications Section */}
              <PropertySpecificationsSection formik={formik} />
            </div>
          )}

          {/* Step 2: Financial/Rental Details based on purpose */}
          {currentStep === 2 && (
            <div>
              {(formik.values.purpose === "Sell" ||
                formik.values.purpose === "Buy") && (
                <FinancialDetailsSection
                  formik={formik}
                  setIsPaymentPlanPopupOpen={setIsPaymentPlanPopupOpen}
                  handleRemovePaymentPlan={handleRemovePaymentPlan}
                />
              )}

              {isRentalProperty && <RentalDetailsSection formik={formik} />}
            </div>
          )}

          {/* Step 3: Images and Additional Details */}
          {currentStep === 3 && (
            <div className="space-y-8">
              <AdditionalDetailsSection
                formik={formik}
                developersData={developersData}
                isDevDropdownOpen={isDevDropdownOpen}
                setIsDevDropdownOpen={setIsDevDropdownOpen}
                setIsAddDeveloperModalOpen={setIsAddDeveloperModalOpen}
              />

              <ImageUploadSection
                formik={formik}
                selectedFiles={selectedFiles}
                uploadingImages={uploadingImages}
                fileInputRef={fileInputRef}
                handleDragOver={handleDragOver}
                handleDrop={handleDrop}
                handleFileSelection={handleFileSelection}
                handleImageUpload={handleImageUpload}
                removeSelectedFile={removeSelectedFile}
                removeUploadedImage={removeUploadedImage}
                uploadStatus={uploadStatus} // Add this line
              />
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handleBackStep}
                className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors shadow-md flex items-center"
              >
                <ArrowRight className="w-5 h-5 mr-2" />
                Back
              </button>
            ) : (
              <div></div>
            )}

            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={handleNextStep}
                disabled={currentStep === 1 && !isStep1Valid}
                className={`px-6 py-3 font-medium rounded-lg shadow-md flex items-center ${
                  currentStep === 1 && !isStep1Valid
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-primary text-white hover:bg-primary/90 transition-colors"
                }`}
              >
                Next
                <ArrowRight className="w-5 h-5 ml-2 rotate-180" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={uploadingImages}
                className={`px-6 py-3 ${
                  uploadingImages
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-primary hover:bg-primary/90"
                } text-white font-medium rounded-lg transition-colors shadow-md flex items-center`}
              >
                <SaveIcon className="w-5 h-5 mr-2" />
                {uploadingImages ? "Uploading..." : "Save Unit"}
              </button>
            )}
          </div>
        </form>
      </div>

      <AddCompoundModal
        developersData={developersData}
        isOpen={isAddCompoundModalOpen}
        onClose={() => setIsAddCompoundModalOpen(false)}
        onSave={handleCompoundSave}
      />

      <PaymentPlanPopup
        isOpen={isPaymentPlanPopupOpen}
        onClose={() => setIsPaymentPlanPopupOpen(false)}
        onAdd={handleAddPaymentPlan}
      />

      <AddDeveloperModal
        isOpen={isAddDeveloperModalOpen}
        onClose={() => setIsAddDeveloperModalOpen(false)}
        onSave={handleDeveloperSave}
      />
    </div>
  );
};

export default AddUnitModal;
