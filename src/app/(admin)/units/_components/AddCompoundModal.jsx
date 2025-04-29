"use client";
import React, { useState } from "react";
import { X, Upload, MapPin, Trash2, Plus } from "lucide-react";
import { toast } from "react-hot-toast";
import { useCompoundForm } from "../hooks/useCompoundForm";
import AddDeveloperModal from "./AddDeveloperModal";
import { useUnitForm } from "../hooks/useUnitForm";
import { addDeveloper } from "@/components/services/serviceFetching";
import { v4 as uuidv4 } from 'uuid';

const AddCompoundModal = ({ isOpen, onClose, onSave, developersData }) => {
  const [showDeveloperModal, setShowDeveloperModal] = useState(false);

  const {
    formik,
    newDeveloper,
    uploadingImage,
    selectedFile,
    deletingImage,
    fileInputRef,
    handleFileSelect,
    removeSelectedFile,
    handleImageUpload,
    removeUploadedImage,
    setNewDeveloper,
  } = useCompoundForm(onClose, onSave);
  const {
    isAddDeveloperModalOpen,
    setIsAddDeveloperModalOpen,
    handleDeveloperSave,
  } = useUnitForm(onClose, onSave);

  // Define the custom developer save handler inside the component
  const handleCustomDeveloperSave = async (developerData) => {
    try {
      // Show loading toast
    
      
      // Create the developer data object
         const id = uuidv4();
      const developerToAdd = {
         id:id,
        name: developerData.name,
        logo: "",
        description: developerData.description || "",
      };
      
      // Call the API to add the developer
      const response = await addDeveloper(developerToAdd);
      console.log(response)
      // Update the form with the new developer name
      formik.setFieldValue("developer_name", response.data.name);
      
      // Close the modal and set newDeveloper to true to show the input field
      setShowDeveloperModal(false);
      setNewDeveloper(true);
      
      // Dismiss loading toast and show success message
     
      toast.success("developer adde successfuly ");
      
      return response;
      
    } catch (error) {
      console.error("Error adding developer:", error);
      toast.error("Failed to add developer " + (error.response?.data?.message || error.message));
      throw error;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 border border-red-500 backdrop-blur-sm z-50 flex items-center justify-center overflow-y-auto p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-primary z-10 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Add New Compound</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full transition-colors"
            disabled={formik.isSubmitting}
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        <form onSubmit={formik.handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Compound Name
            </label>
            <input
              type="text"
              name="name"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={`w-full px-4 py-2 rounded-lg border ${formik.touched.name && formik.errors.name ? "border-red-500" : "border-gray-300"} focus:ring-2 focus:ring-primary focus:border-transparent`}
            />
            {formik.touched.name && formik.errors.name && (
              <div className="text-red-500 text-xs mt-1">
                {formik.errors.name}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formik.values.description}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={`w-full px-4 py-2 rounded-lg border ${formik.touched.description && formik.errors.description ? "border-red-500" : "border-gray-300"} focus:ring-2 focus:ring-primary focus:border-transparent`}
              rows="3"
            />
            {formik.touched.description && formik.errors.description && (
              <div className="text-red-500 text-xs mt-1">
                {formik.errors.description}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Country
            </label>
            <select
              name="country"
              value={formik.values.country}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={`w-full px-4 py-2 rounded-lg border ${formik.touched.country && formik.errors.country ? "border-red-500" : "border-gray-300"} focus:ring-2 focus:ring-primary focus:border-transparent`}
            >
              <option value="Egypt">Egypt</option>
              <option value="UAE">UAE</option>
              <option value="Saudi Arabia">Saudi Arabia</option>
            </select>
            {formik.touched.country && formik.errors.country && (
              <div className="text-red-500 text-xs mt-1">
                {formik.errors.country}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City
            </label>
            <select
              name="city"
              value={formik.values.city}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={`w-full px-4 py-2 rounded-lg border ${formik.touched.city && formik.errors.city ? "border-red-500" : "border-gray-300"} focus:ring-2 focus:ring-primary focus:border-transparent`}
            >
              <option value="">Select City</option>
              <option value="Cairo">Cairo</option>
              <option value="Alexandria">Alexandria</option>
              <option value="مدينتي">madinty</option>
              <option value="New Cairo">New Cairo</option>
            </select>
            {formik.touched.city && formik.errors.city && (
              <div className="text-red-500 text-xs mt-1">
                {formik.errors.city}
              </div>
            )}
          </div>

        

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Video URL
            </label>
            <input
              type="url"
              name="video_url"
              value={formik.values.video_url}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={`w-full px-4 py-2 rounded-lg border ${formik.touched.video_url && formik.errors.video_url ? "border-red-500" : "border-gray-300"} focus:ring-2 focus:ring-primary focus:border-transparent`}
              placeholder="https://youtube.com/..."
            />
            {formik.touched.video_url && formik.errors.video_url && (
              <div className="text-red-500 text-xs mt-1">
                {formik.errors.video_url}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Google Maps Link
            </label>
            <div className="flex">
              <input
                type="url"
                name="google_map_link"
                value={formik.values.google_map_link}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`w-full px-4 py-2 rounded-l-lg border ${formik.touched.google_map_link && formik.errors.google_map_link ? "border-red-500" : "border-gray-300"} focus:ring-2 focus:ring-primary focus:border-transparent`}
                placeholder="https://maps.google.com/..."
              />
              <button
                type="button"
                className="bg-gray-100 px-3 rounded-r-lg border border-l-0 border-gray-300 hover:bg-gray-200"
                title="Open Maps"
                onClick={() =>
                  formik.values.google_map_link &&
                  window.open(formik.values.google_map_link, "_blank")
                }
              >
                <MapPin className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            {formik.touched.google_map_link &&
              formik.errors.google_map_link && (
                <div className="text-red-500 text-xs mt-1">
                  {formik.errors.google_map_link}
                </div>
              )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Developer
            </label>
            {!newDeveloper ? (
              <div className="flex gap-2">
                <select
                  name="developer_name"
                  value={formik.values.developer_name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`w-full px-4 py-2 rounded-lg border ${formik.touched.developer_name && formik.errors.developer_name ? "border-red-500" : "border-gray-300"} focus:ring-2 focus:ring-primary focus:border-transparent`}
                >
                  <option value="">Select Developer</option>
                  {developersData && developersData.length > 0 && 
                    developersData.map((dev, index) => (
                      <option key={index} value={dev.name}>
                        {dev.name}
                      </option>
                    ))
                  }
                  {console.log("formik.values developer",formik.values)}
                  {/* If developer_name is set but not in the list, add it as an option */}
                  {formik.values.developer_name && 
                   !developersData?.some(dev => dev.name === formik.values.developer_name) && (
                    <option value={formik.values.developer_name}>
                      {formik.values.developer_name}
                    </option>
                  )}
                </select>
                <button
                  type="button"
                  onClick={() => setShowDeveloperModal(true)}
                  className="px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>New</span>
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  name="developer_name"
                  value={formik.values.developer_name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`w-full px-4 py-2 rounded-lg border ${formik.touched.developer_name && formik.errors.developer_name ? "border-red-500" : "border-gray-300"} focus:ring-2 focus:ring-primary focus:border-transparent`}
                  placeholder="Enter developer name"
                />
                <button
                  type="button"
                  onClick={() => setNewDeveloper(false)}
                  className="px-3 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-gray-700 text-sm"
                >
                  Select
                </button>
              </div>
            )}
            {formik.touched.developer_name && formik.errors.developer_name && (
              <div className="text-red-500 text-xs mt-1">
                {formik.errors.developer_name}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Master Plan Image
            </label>
            <div
              className={`border-2 border-dashed ${formik.touched.master_plan && formik.errors.master_plan ? "border-red-500" : "border-gray-300"} rounded-lg p-4 text-center`}
            >
              <input
                type="file"
                id="masterPlanImage"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                ref={fileInputRef}
              />

              {/* When no file is selected or uploaded */}
              {!selectedFile && !formik.values.master_plan && (
                <label
                  htmlFor="masterPlanImage"
                  className="cursor-pointer flex flex-col items-center justify-center py-3"
                >
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">
                    No file was selected
                  </span>
                  <span className="text-xs text-gray-400 mt-1">
                    {" "}
                    Choose a file
                  </span>
                </label>
              )}

              {/* When file is selected but not uploaded yet */}
              {selectedFile && !formik.values.master_plan && (
                <div className="py-3">
                  <div className="flex flex-col items-center">
                    <div className="w-40 h-40 mb-3 border rounded-lg overflow-hidden relative">
                      <img
                        src={URL.createObjectURL(selectedFile)}
                        alt="Selected preview"
                        className="w-full h-full object-cover"
                      />
                      {uploadingImage && (
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <svg
                            className="animate-spin h-8 w-8 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <span className="text-sm text-gray-700">
                        {selectedFile.name}
                      </span>
                      <button
                        type="button"
                        onClick={removeSelectedFile}
                        disabled={uploadingImage}
                        className="p-1 rounded-full hover:bg-red-100 text-red-500 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Remove selected file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={handleImageUpload}
                      disabled={uploadingImage}
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 disabled:opacity-50 flex items-center gap-2"
                    >
                      {uploadingImage ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          uploading...
                          <button
                            type="button"
                            onClick={() => {
                              // Add logic to cancel upload here
                              setUploadingImage(false);
                              toast.error("Upload cancelled");
                            }}
                            disabled={deletingImage}
                            className="ml-2 p-1 bg-white/20 rounded-full hover:bg-white/30 disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Cancel upload"
                          >
                            <X className="w-3 h-3 text-white" />
                          </button>
                        </>
                      ) : (
                        "Upload Image"
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* When file is already uploaded */}
              {formik.values.master_plan && (
                <div className="py-3">
                  <div className="flex flex-col items-center">
                    <div className="w-40 h-40 mb-3 border rounded-lg overflow-hidden relative">
                      <img
                        src={
                          formik.values.master_plan.url ||
                          formik.values.master_plan
                        }
                        alt="Uploaded master plan"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-lg">
                        <span className="text-sm">
                          ✓ Image uploaded successfully
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={removeUploadedImage}
                        disabled={deletingImage}
                        className="p-1 rounded-full hover:bg-red-100 text-red-500"
                        title="Delete image"
                      >
                        {deletingImage ? (
                          <svg
                            className="animate-spin h-4 w-4 text-red-500"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {formik.touched.master_plan && formik.errors.master_plan && (
              <div className="text-red-500 text-xs mt-1">
                {formik.errors.master_plan}
              </div>
            )}
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="gated"
              name="gated"
              checked={formik.values.gated}
              onChange={formik.handleChange}
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <label
              htmlFor="gated"
              className="ml-2 text-sm font-medium text-gray-700"
            >
              Gated Community
            </label>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-3 bg-gray-200 text-gray-800 font-medium rounded-lg transition-colors hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formik.isSubmitting || uploadingImage}
              className="w-2/3 py-3 bg-primary text-white font-medium rounded-lg transition-colors shadow-md disabled:opacity-50"
            >
              {formik.isSubmitting
                ? "saving ..."
                : uploadingImage
                  ? "  uploading..."
                  : "Save Compound"}
            </button>
          </div>
        
        </form>
        {
          <AddDeveloperModal
            isOpen={showDeveloperModal}
            onClose={() => setShowDeveloperModal(false)}
            onSave={handleCustomDeveloperSave}
          />
        }
      </div>
    </div>
  );
};

export default AddCompoundModal;
