"use client";

import {
  addCompound,
  updatecompound,
} from "@/components/services/serviceFetching";
import AddDeveloperDialog from "@/components/ui/add-developer-dialog";
import Dialog from "@/components/ui/Dialog";
import ImageUploader from "@/components/ui/image-uploader";
import SingleImageUploader from "@/components/ui/single-image-uploader";
import { useI18n } from "@/context/translate-api";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function AddCompoundDialog({
  clientId,
  isOpen,
  onClose,
  compoundData,
  onAdd = () => {},
  developers = [],
  setDevelopers,
  Egypt_cities,
  defaultCity,
  defaultDistrict,
}) {
  const { t, locale } = useI18n();

  // Determine edit mode based on compoundData
  const editMode = !!(compoundData && compoundData.id);

  const [isMasterPlanUploading, setIsMasterPlanUploading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [errors, setErrors] = useState({});
  const [isAddDeveloperDialogOpen, setIsAddDeveloperDialogOpen] =
    useState(false);

  const [activeNameLang, setActiveNameLang] = useState("ar");

  const [formData, setFormData] = useState({
    ar_name: compoundData?.ar_name || "",
    en_name: compoundData?.en_name || "",
    description: compoundData?.description || "",
    developer_name: compoundData?.developer_name || "",
    city: defaultCity || "",
    country: "Egypt",
    district: defaultDistrict || "",
    area: "",
    gated: false,
    video_url: compoundData?.video_url || "",
    google_map_link: compoundData?.google_map_link || "",
    master_plan: compoundData?.master_plan || "",
    client_id: clientId || "",
    images: compoundData?.images || [],
  });

  useEffect(() => {
    if (isOpen) {
      // When the dialog is opening
      if (editMode && compoundData) {
        // Load existing data for editing
        setFormData({
          ar_name: compoundData?.ar_name || "",
          en_name: compoundData?.en_name || "",
          description: compoundData.description || "",
          developer_name: compoundData.developer_name || "",
          city: compoundData.city || defaultCity || "", // Still use default if compound data is missing city
          country: compoundData.country || "Egypt",
          district: compoundData.district || defaultDistrict || "", // Still use default if compound data is missing district
          area: compoundData.area || "",
          gated: compoundData.gated || false,
          video_url: compoundData.video_url || "",
          google_map_link: compoundData.google_map_link || "",
          master_plan: compoundData.master_plan || "",
          client_id: compoundData.client_id || clientId || "",
          images: compoundData.images || [],
        });
      } else if (!editMode) {
        // Reset form with defaults for adding
        setFormData({
          ar_name: "",
          en_name: "",
          description: "",
          developer_name: "",
          city: defaultCity || "",
          country: "Egypt",
          district: defaultDistrict || "",
          area: "",
          gated: false,
          video_url: "",
          google_map_link: "",
          master_plan: "",
          client_id: clientId || "",
          images: [],
        });
      }
      setErrors({});
    } else {
      setFormData({
        ar_name: "",
        en_name: "",
        description: "",
        developer_name: "",
        city: defaultCity || "",
        country: "Egypt",
        district: defaultDistrict || "",
        area: "",
        gated: false,
        video_url: "",
        google_map_link: "",
        master_plan: "",
        client_id: clientId || "",
        images: [],
      });

      setErrors({});
    }
  }, [isOpen, editMode]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Add validation for district selection
    if (name === "district" && !formData.city) {
      toast.error(
        locale === "ar"
          ? "الرجاء اختيار المدينة أولاً"
          : "Please select a city first"
      );
      return;
    }

    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });

    // Clear error for this field when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null,
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.ar_name.trim()) {
      newErrors.ar_name = "Arabic compound name is required";
      setActiveNameLang("ar");
      toast.error("Arabic compound name is required");
    }

    if (!formData.en_name.trim()) {
      newErrors.en_name = "English compound name is required";
      setActiveNameLang("en");
      toast.error("English compound name is required");
    }

    if (!formData.city.trim()) {
      newErrors.city = t.formValidation?.cityRequired || "City is required";
      toast.error(t.formValidation?.cityRequired || "City is required");
    }

    if (!formData.country.trim()) {
      newErrors.country =
        t.formValidation?.countryRequired || "Country is required";
      toast.error(t.formValidation?.countryRequired || "Country is required");
    }

    if (!formData.district.trim()) {
      newErrors.district =
        t.formValidation?.districtRequired || "District is required";
      toast.error(t.formValidation?.districtRequired || "District is required");
    }

    if (!formData.area || Number(formData.area) <= 0) {
      newErrors.area =
        t.formValidation?.areaRequired || "Area must be greater than 0";
      toast.error(
        t.formValidation?.areaRequired || "Area must be greater than 0"
      );
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      let submissionData;
      let res;

      if (editMode) {
        submissionData = {
          description: formData.description,
          master_plan: formData.master_plan,
          video_url: formData.video_url,
          images: formData.images,
        };
        res = await updatecompound(submissionData, compoundData.id);
      } else {
        submissionData = {
          ...formData,
          area: Number(formData.area),
        };
        res = await addCompound(submissionData);
      }

      if (res.status) {
        onAdd(res.data);
        toast.success(
          editMode
            ? t.compoundUpdated || "project updated successfully!"
            : t.compoundAdded || "project added successfully!"
        );
      } else {
        toast.error(
          editMode
            ? "Failed to update compound. Please try again."
            : "Failed to add compound. Please try again."
        );
        setErrors({
          submit:
            res.message ||
            (editMode
              ? "Failed to update compound. Please try again."
              : "Failed to add compound. Please try again."),
        });
        return;
      }

      onClose();
    } catch (error) {
      toast.error(
        editMode
          ? "Failed to update compound. Please try again."
          : "Failed to add compound. Please try again."
      );
      setErrors({
        // Consider adding a general error state or showing error message from backend if available
        submit:
          error.message ||
          (editMode
            ? "Failed to update compound. Please try again."
            : "Failed to add compound. Please try again."),
      });
    } finally {
      setIsSubmitting(false);
      setFormData({
        ar_name: "",
        en_name: "",
        description: "",
        developer_name: "",
        city: defaultCity || "",
        country: "Egypt",
        district: defaultDistrict || "",
        area: "",
        gated: false,
        video_url: "",
        google_map_link: "",
        master_plan: "",
        client_id: clientId || "ai",
      });
    }
  };

  const handleAddDeveloper = (newDeveloper) => {
    setDevelopers([...developers, newDeveloper]);

    setFormData((prev) => {
      return {
        ...prev,
        developer_name: newDeveloper.name,
      };
    });
  };

  return (
    <>
      <Dialog
        isOpen={isOpen}
        onClose={onClose}
        title={
          editMode
            ? t.updateProject
            : t.modal?.addNewProject || "Add New Project"
        }
      >
        <div>
          <div className="space-y-2">
            {/* Basic Information */}
            <div className="grid grid-cols-1 gap-2">
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1 flex items-center justify-between">
                  <label>
                    {t.formLabels?.compoundName || "Compound Name"}{" "}
                    <span className="text-red-500">*</span>
                  </label>

                  <div className="inline-flex rounded bg-gray-100 border border-gray-300 overflow-hidden">
                    <button
                      type="button"
                      className={`px-2 py-0.5 text-xs font-semibold ${
                        activeNameLang === "ar"
                          ? "bg-primary text-white border border-gray-300 rtl:rounded-r ltr:rounded-l"
                          : "text-gray-700"
                      }`}
                      onClick={() => setActiveNameLang("ar")}
                    >
                      AR
                    </button>
                    <button
                      type="button"
                      className={`px-2 py-0.5 text-xs font-semibold ${
                        activeNameLang === "en"
                          ? "bg-primary text-white border border-gray-300 rtl:rounded-l ltr:rounded-r"
                          : "text-gray-700"
                      }`}
                      onClick={() => setActiveNameLang("en")}
                    >
                      EN
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  name={activeNameLang === "ar" ? "ar_name" : "en_name"}
                  value={
                    activeNameLang === "ar"
                      ? formData.ar_name
                      : formData.en_name
                  }
                  onChange={handleChange}
                  disabled={editMode}
                  dir={activeNameLang === "ar" ? "rtl" : "ltr"}
                  className="block w-full rounded-md border border-gray-300 py-1 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={
                    activeNameLang === "ar"
                      ? t.placeholders.projectArName
                      : t.placeholders.projectEnName ||
                        "Compound Name (English)"
                  }
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.formLabels?.description || "Description"}
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="block w-full rounded-md border border-gray-300 py-1 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              ></textarea>
            </div>

            {/* Location */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.formLabels?.city || "City"}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <select
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  disabled={editMode}
                  className="block w-full rounded-md border border-gray-300 py-1 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">
                    {editMode ? formData.city : t.formLabels?.selectCity}
                  </option>
                  {Egypt_cities?.map((gov) => (
                    <option key={gov?.governorate} value={gov?.governorate}>
                      {gov?.governorate}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.formLabels?.country || "Country"}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  disabled={editMode}
                  className="block w-full rounded-md border border-gray-300 py-1 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.formLabels?.district || "District"}{" "}
                <span className="text-red-500">*</span>
              </label>
              <select
                name="district"
                value={formData.district}
                onChange={handleChange}
                disabled={!formData.city || editMode}
                className="block w-full rounded-md border border-gray-300 py-1 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">
                  {!formData.city
                    ? locale === "ar"
                      ? "الرجاء اختيار المدينة أولاً"
                      : "Please select a city first"
                    : editMode
                      ? formData.district
                      : locale === "ar"
                        ? t.formLabels?.district
                        : "Select district"}
                </option>
                {formData?.city &&
                  Egypt_cities.find(
                    (gov) => gov.governorate === formData.city
                  )?.districts.map((dist) => (
                    <option key={dist.district} value={dist.district}>
                      {dist.district}
                    </option>
                  ))}
              </select>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.formLabels?.area || "Area (m²)"}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="area"
                  value={formData.area}
                  placeholder="1000"
                  onChange={handleChange}
                  min="0"
                  disabled={editMode}
                  className="block w-full rounded-md border border-gray-300 py-1 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center h-full pt-6">
                <input
                  type="checkbox"
                  id="gated"
                  name="gated"
                  checked={formData.gated}
                  onChange={handleChange}
                  disabled={editMode}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="gated"
                  className="ml-2 block text-sm text-gray-700"
                >
                  {t.formLabels?.gatedCommunity || "Gated Community"}
                </label>
              </div>
            </div>

            {/* Developer */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.formLabels?.developer || "Developer"}{" "}
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  name="developer_name"
                  value={formData.developer_name}
                  onChange={handleChange}
                  disabled={editMode}
                  className="block w-full rounded-md border border-gray-300 py-1 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">
                    {editMode
                      ? formData.developer_name
                      : t.formLabels?.selectDeveloper || "Select developer"}
                  </option>
                  {developers?.map((d, idx) => (
                    <option key={idx} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                {/* <div
                  className={`absolute inset-y-0 ${locale === "ar" ? "left-0" : "right-0"} flex items-center px-2 pointer-events-none`}
                >
                  <svg
                    className="h-5 w-5 text-gray-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div> */}
              </div>
              {!editMode && (
                <button
                  type="button"
                  onClick={() => setIsAddDeveloperDialogOpen(true)}
                  className={`absolute ${locale === "ar" ? "left-0" : "right-0"} top-0 text-blue-600 text-sm font-medium`}
                >
                  + {t.buttons?.addNew || "Add New"}
                </button>
              )}
            </div>

            {/* Links */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.formLabels?.videoURL || "Video URL"}
              </label>
              <input
                type="url"
                name="video_url"
                value={formData.video_url}
                onChange={handleChange}
                placeholder="https://example.com/video"
                className="block w-full rounded-md border border-gray-300 py-1 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.formLabels?.googleMapsLink || "Google Maps Link"}
              </label>
              <input
                type="url"
                name="google_map_link"
                value={formData.google_map_link}
                onChange={handleChange}
                placeholder="https://maps.google.com/..."
                disabled={editMode}
                className="block w-full rounded-md border border-gray-300 py-1 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Master Plan Image */}
            <SingleImageUploader
              label={t.formLabels.masterPlanImage || "Master Plan Image"}
              value={formData.master_plan}
              onChange={(url) =>
                setFormData((prev) => ({ ...prev, master_plan: url }))
              }
              disabled={isMasterPlanUploading || isSubmitting}
              isUploading={isMasterPlanUploading}
              setIsUploading={setIsMasterPlanUploading}
            />

            {/* Project Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.formLabels?.projectImages || "Project Images"}
                <span className="text-xs font-normal text-gray-500">
                  ({formData.images?.length || 0} / 8)
                </span>
              </label>
              <ImageUploader
                maxImages={8}
                initialImages={editMode ? compoundData?.images || [] : []}
                onImagesChange={(images) =>
                  setFormData((prev) => ({ ...prev, images }))
                }
                isUploading={isUploading}
                setIsUploading={setIsUploading}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {t.buttons?.cancel || "Cancel"}
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`px-4 py-1.5 w-42 bg-primary rounded-md text-sm font-medium text-white focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  isSubmitting || isUploading || isMasterPlanUploading
                    ? "pointer-events-none opacity-80"
                    : "hover:bg-primary/90"
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <Loader2 size={20} className="animate-spin mr-2" />
                    {editMode ? t.updating : t.buttons?.saving || "Saving..."}
                  </div>
                ) : editMode ? (
                  t.updateProject
                ) : (
                  t.buttons?.saveProject || "Save Project"
                )}
              </button>
            </div>
          </div>
        </div>
      </Dialog>

      <AddDeveloperDialog
        client_id={clientId}
        isOpen={isAddDeveloperDialogOpen}
        onClose={() => setIsAddDeveloperDialogOpen(false)}
        onAdd={handleAddDeveloper}
      />
    </>
  );
}
