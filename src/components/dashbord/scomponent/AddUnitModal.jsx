"use client";
import React, { useState, useEffect } from "react";
import { X, Upload, Trash2, Plus } from "lucide-react";
import AddCompoundModal from "./AddCompoundModal";
import PaymentPlanPopup from "./PaymentPlanPopup";
import { useUnitForm } from "../hooks/useUnitForm";
import propertyEnums from "../data/propertyEnums.json";
import AddDeveloperModal from "./AddDeveloperModal";
import ImageUploadSection from "./ImageUploadSection";
import AdditionalDetailsSection from "./AdditionalDetailsSection";
import FinancialDetailsSection from "./FinancialDetailsSection";
import PropertySpecificationsSection from "./PropertySpecificationsSection";
import RentalDetailsSection from "./RentalDetailsSection";

const AddUnitModal = ({
  isOpen,
  onClose,
  onSave,
  comboundata,
  developersData,
}) => {
  // In the destructuring of useUnitForm
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
  } = useUnitForm(onClose, onSave);
  const [isDevDropdownOpen, setIsDevDropdownOpen] = useState(false);
  const [isCompoundDropdownOpen, setIsCompoundDropdownOpen] = useState(false);

  // Add this state to track if purpose is "Rent"
  const [isRentalProperty, setIsRentalProperty] = useState(false);
  // Add this state to track if purpose is "Sell"
  const [isSellProperty, setIsSellProperty] = useState(false);

  // Add this effect to update the state when purpose changes
  useEffect(() => {
    setIsRentalProperty(formik.values.purpose === "Rent");
    setIsSellProperty(formik.values.purpose === "Sell");

    // إضافة هذا الكود للتأكد من تهيئة الحقول بشكل صحيح عند تغيير الغرض
    if (formik.values.purpose === "Rent" && !formik.values.amenities) {
      formik.setFieldValue("amenities", {});
    }
  }, [formik.values.purpose]);

  // إضافة دالة للتعامل مع الإرسال
  const handleSubmit = (e) => {
    e.preventDefault();

    // التحقق من وجود صور قبل الإرسال
    if (formik.values.images.length === 0) {
      toast.error("يجب عليك رفع الصور على السيرفر أولاً");
      return;
    }

    // تحويل البيانات إلى الصيغة المناسبة قبل الإرسال
    if (formik.values.purpose === "Rent" && formik.values.amenities) {
      // تحويل كائن amenities إلى مصفوفة للإرسال
      const amenitiesArray = Object.entries(formik.values.amenities).map(
        ([key, value]) => ({
          amenitiy: key,
          availability: value,
        })
      );
      formik.setFieldValue("amenities", amenitiesArray);
    }

    // استدعاء دالة الإرسال الأصلية
    formik.handleSubmit();
  };

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

        <form onSubmit={formik.handleSubmit} className="p-6">
          {/* Client Information - Removed clientName field */}
          {/* Hidden clientId field is maintained */}
          <input type="hidden" name="clientId" value={formik.values.clientId} />

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
                  {/* Main dropdown button */}
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
                    <span>{formik.values.compound || "Select Compound"}</span>
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
                              formik.setFieldValue("compound", compound.name);
                              formik.setFieldTouched("compound", true);
                              // This will trigger validation after setting the value
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

                {/* Hidden input for formik integration */}
                <input
                  type="hidden"
                  name="compound"
                  value={formik.values.compound}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />

                {/* Error message display */}
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
                      formik.touched.buildingType && formik.errors.buildingType
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-300 hover:border-gray-400 focus:ring-primary focus:border-primary"
                    } focus:outline-none focus:ring-2 focus:ring-opacity-50 shadow-sm transition-all duration-200`}
                  >
                    <option value="">Select Building Type</option>
                    {propertyEnums.EnumBuildingType.map((type, index) => (
                      <option
                        key={index}
                        value={type.charAt(0).toUpperCase() + type.slice(1)}
                        className="py-2"
                      >
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
                {formik.touched.buildingType && formik.errors.buildingType && (
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
                    {propertyEnums.EnumPropertyIntent.map((intent, index) => (
                      <option
                        key={index}
                        value={intent.charAt(0).toUpperCase() + intent.slice(1)}
                        className="py-2"
                      >
                        {intent.charAt(0).toUpperCase() + intent.slice(1)}
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
                <input
                  type="text"
                  name="city"
                  value={formik.values.city}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    formik.touched.city && formik.errors.city
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:ring-primary"
                  } focus:border-transparent`}
                />
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
                  value={formik.values.district}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
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
                    <option
                      key={index}
                      value={view.charAt(0).toUpperCase() + view.slice(1)}
                    >
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



          {/* Financial Details Section - Show if purpose is "Sell" or "Buy" */}
          {(isSellProperty || formik.values.purpose === "Buy") && (
            <FinancialDetailsSection
              formik={formik}
              setIsPaymentPlanPopupOpen={setIsPaymentPlanPopupOpen}
              handleRemovePaymentPlan={handleRemovePaymentPlan}
            />
          )}

          {/* Rental Details Section - Only show if purpose is "Rent" */}
          {isRentalProperty && <RentalDetailsSection formik={formik} />}

          {/* Additional Details Section */}
          <AdditionalDetailsSection
            formik={formik}
            developersData={developersData}
            isDevDropdownOpen={isDevDropdownOpen}
            setIsDevDropdownOpen={setIsDevDropdownOpen}
            setIsAddDeveloperModalOpen={setIsAddDeveloperModalOpen}
          />
          {/* Image Upload Section */}
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
          />
          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-md"
            >
              Save Unit
            </button>
          </div>
        </form>
      </div>
      {/* Add Compound Modal */}
      <AddCompoundModal
        developersData={developersData}
        isOpen={isAddCompoundModalOpen}
        onClose={() => setIsAddCompoundModalOpen(false)}
        onSave={handleCompoundSave}
      />
      {/* Payment Plan Popup */}
      <PaymentPlanPopup
        isOpen={isPaymentPlanPopupOpen}
        onClose={() => setIsPaymentPlanPopupOpen(false)}
        onAdd={handleAddPaymentPlan}
      />
      {/* Add Developer Modal */}
      <AddDeveloperModal
        isOpen={isAddDeveloperModalOpen}
        onClose={() => setIsAddDeveloperModalOpen(false)}
        onSave={handleDeveloperSave}
      />
    </div>
  );
};

export default AddUnitModal;
