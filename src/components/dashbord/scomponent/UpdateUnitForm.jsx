"use client";
import { updateUnit, uploadImages, deleteImage } from "@/components/services/serviceFetching";
import React, { useState, useEffect, useRef } from "react";
import { Trash2, Upload, Plus, X, Router } from "lucide-react";
import propertyEnums from "../data/propertyEnums.json";
import PaymentPlanPopup from "./PaymentPlanPopup";
import AddCompoundModal from "./AddCompoundModal";
import AddDeveloperModal from "./AddDeveloperModal";
import { useRouter } from "next/navigation";


const UpdateUnitForm = ({ unit, onSubmit, onCancel, comboundata, developers }) => {
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
  });

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const fileInputRef = useRef(null);
  const [isPaymentPlanPopupOpen, setIsPaymentPlanPopupOpen] = useState(false);
  const [isAddCompoundModalOpen, setIsAddCompoundModalOpen] = useState(false);
  const [isAddDeveloperModalOpen, setIsAddDeveloperModalOpen] = useState(false);
  const [isCompoundDropdownOpen, setIsCompoundDropdownOpen] = useState(false);
  const [isDevDropdownOpen, setIsDevDropdownOpen] = useState(false);
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
        deliveryDate: unit.deliveryDate ? unit.deliveryDate.split('T')[0] : "",
        clientId: unit.clientId || "",
        clientName: unit.clientName || "",
        dataSource: unit.dataSource || "",
        images: unit.images || [],
        updatedAt: unit.updatedAt || "",
      });
    }
  }, [unit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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
    setSelectedFiles(prev => [...prev, ...newFiles]);
    
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
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedImagesData]
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
      // استخدام وظيفة deleteImage من serviceFetching
      await deleteImage(imageId);

      // Remove from formData state after successful API deletion
      const updatedImages = [...formData.images];
      updatedImages.splice(index, 1);
      setFormData(prev => ({
        ...prev,
        images: updatedImages
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
      // Call the onSubmit function and wait for it to complete
      await onSubmit(formData);
      
      // Instead of reloading the page, we can use router.push to navigate to the same page
      // or use router.refresh() to refresh the data without a full page reload
     window.location.reload()
      
      // Alternatively, you could show a success message
      // toast.success("Unit updated successfully!");
      
      // Or close the form if it's in a modal
      // onCancel();
    } catch (error) {
      console.error("Error updating unit:", error);
      // يمكنك إضافة رسالة خطأ هنا إذا كنت تستخدم مكتبة للإشعارات
      // toast.error("Failed to update unit");
    }
    
    return false; // Extra measure to prevent form submission
  };
  
  const handleAddPaymentPlan = (plan) => {
    const currentPlans = formData.paymentPlans ? formData.paymentPlans.split(", ") : [];
    
    // Check if plan already exists
    if (!currentPlans.includes(plan)) {
      const updatedPlans = [...currentPlans, plan].join(", ");
      setFormData(prev => ({
        ...prev,
        paymentPlans: updatedPlans
      }));
    }
    
    setIsPaymentPlanPopupOpen(false);
  };

  const handleRemovePaymentPlan = (indexToRemove) => {
    const currentPlans = formData.paymentPlans.split(", ");
    const updatedPlans = currentPlans.filter((_, index) => index !== indexToRemove).join(", ");
    
    setFormData(prev => ({
      ...prev,
      paymentPlans: updatedPlans
    }));
  };
  
  const handleCompoundSave = (compoundData) => {
    // Set the newly created compound name to the unit's compound field
    setFormData(prev => ({
      ...prev,
      compound: compoundData.name || compoundData.compoundName
    }));
    setIsAddCompoundModalOpen(false);
  };
  
  const handleDeveloperSave = (developerData) => {
    // Set the newly created developer name to the unit's developer field
    setFormData(prev => ({
      ...prev,
      developer: developerData.name
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
                <option key={index} value={type.charAt(0).toUpperCase() + type.slice(1)}>
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
                <option key={index} value={intent.charAt(0).toUpperCase() + intent.slice(1)}>
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
              onClick={() => setIsCompoundDropdownOpen(!isCompoundDropdownOpen)}
            >
              <span>{formData.compound || "Select Compound"}</span>
              <span>{isCompoundDropdownOpen ? "▲" : "▼"}</span>
            </div>
            
            {/* Dropdown menu */}
            {isCompoundDropdownOpen && (
              <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {comboundata && comboundata.map((compound, index) => (
                  <div 
                    key={index} 
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        compound: compound.name
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
                {developers && developers.map((developer, index) => (
                  <div 
                    key={index} 
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        developer: developer.name
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
        <h3 className="text-xl font-semibold text-gray-700 mb-4">
          Location
        </h3>
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
                <option key={index} value={view.charAt(0).toUpperCase() + view.slice(1)}>
                  {view.charAt(0).toUpperCase() + view.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
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
                formData.paymentPlans
                  .split(", ")
                  .map((plan, index) => (
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
      </div>

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
              <option value="">Select Finishing</option>
              {propertyEnums.EnumFinishingType.map((type, index) => (
                <option key={index} value={type.charAt(0).toUpperCase() + type.slice(1)}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
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
            multiple
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
            {selectedFiles.length > 0 ? "Add More Images" : "Select Images"}
          </label>
          
          {selectedFiles.length > 0 && (
            <button
              type="button"
              onClick={handleImageUpload}
              disabled={uploadingImages}
              className="mt-4 inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
            >
              {uploadingImages ? "Uploading..." : "Upload Image"}
            </button>
          )}
        </div>

        {/* Display selected files waiting to be uploaded */}
        {selectedFiles.length > 0 && (
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium text-gray-700">
                Selected Images ({selectedFiles.length}):
              </h4>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {selectedFiles.map((file, index) => (
                <div key={index} className="relative group">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Selected image ${index + 1}`}
                    className="w-full h-24 object-cover rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => removeSelectedFile(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Display uploaded images */}
        {formData.images.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Uploaded Images:
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {formData.images.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={image.url}
                    alt={`Property image ${index + 1}`}
                    className="w-full h-24 object-cover rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => removeUploadedImage(index, image.fileId)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 bg-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-400 transition-colors shadow-md mr-4"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-md"
        >
          Update Unit
        </button>
      </div>
    </form>
    
    {/* Payment Plan Popup - Moved outside the form to prevent nested form error */}
    <PaymentPlanPopup
      isOpen={isPaymentPlanPopupOpen}
      onClose={() => setIsPaymentPlanPopupOpen(false)}
      onAdd={handleAddPaymentPlan}
    />
    
    {/* Add Compound Modal */}
    <AddCompoundModal
      isOpen={isAddCompoundModalOpen}
      onClose={() => setIsAddCompoundModalOpen(false)}
      onSave={handleCompoundSave}
    />
    
    {/* Add Developer Modal */}
    <AddDeveloperModal
      isOpen={isAddDeveloperModalOpen}
      onClose={() => setIsAddDeveloperModalOpen(false)}
      onSave={handleDeveloperSave}
    />
    </>
  );
};

export default UpdateUnitForm;