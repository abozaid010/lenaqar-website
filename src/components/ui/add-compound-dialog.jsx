"use client";

import {
  addCompound,
  updatecompound,
} from "@/components/services/serviceFetching";
import AddDeveloperDialog from "@/components/ui/add-developer-dialog";
import Dialog from "@/components/ui/Dialog";
import FormInput from "@/components/ui/inputs/form-input";
import FormSelect from "@/components/ui/inputs/form-select";
import ImageUploader from "@/components/ui/inputs/image-uploader";
import MultiLangInput from "@/components/ui/inputs/multilang-input";
import SingleImageUploader from "@/components/ui/inputs/single-image-uploader";
import CitySelect from "@/components/ui/inputs/sorted-city-select";
import { useI18n } from "@/context/translate-api";
import { COUNTRIES } from "@/data/cities";
import { formatDistrictLabel } from "@/utils/formatters";
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

  const editMode = !!(compoundData && compoundData.id);

  const [isMasterPlanUploading, setIsMasterPlanUploading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [errors, setErrors] = useState({});
  const [missingLang, setMissingLang] = useState(null);
  const [isAddDeveloperDialogOpen, setIsAddDeveloperDialogOpen] =
    useState(false);

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
    master_plan: compoundData?.master_plan || { url: null, fileId: null },
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
          master_plan: compoundData?.master_plan || { url: null, fileId: null },
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
          master_plan: { url: null, fileId: null },
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
        master_plan: { url: null, fileId: null },
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
      setMissingLang("ar");
    }

    if (!formData.en_name.trim()) {
      newErrors.en_name = "English compound name is required";
      setMissingLang("en");
    }

    if (!formData.description.trim()) {
      newErrors.description =
        t.formValidation?.descriptionRequired || "Description is required";
    } else if (formData.description.trim().length < 300) {
      newErrors.description =
        t.formValidation?.descriptionMinLength ||
        "Description must be at least 300 characters";
    }

    if (!formData.city.trim()) {
      newErrors.city = t.formValidation?.cityRequired || "City is required";
    }

    if (!formData.country.trim()) {
      newErrors.country =
        t.formValidation?.countryRequired || "Country is required";
    }

    if (!formData.district.trim()) {
      newErrors.district =
        t.formValidation?.districtRequired || "District is required";
    }

    if (!formData.area || Number(formData.area) <= 0) {
      newErrors.area =
        t.formValidation?.areaRequired || "Area must be greater than 0";
    }

    setErrors(newErrors);
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
      const submissionData = {
        ...formData,
        area: Number(formData.area),
      };

      let res;
      if (editMode) {
        res = await updatecompound(submissionData, compoundData.id);
      } else {
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
        master_plan: { url: null, fileId: null },
        client_id: clientId || "ai",
      });
    } catch (error) {
      toast.error(
        editMode
          ? "Failed to update compound. Please try again."
          : "Failed to add compound. Please try again."
      );
      setErrors({
        submit:
          error.message ||
          (editMode
            ? "Failed to update compound. Please try again."
            : "Failed to add compound. Please try again."),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddDeveloper = (newDeveloper) => {
    setDevelopers([...developers, newDeveloper]);

    setFormData((prev) => {
      return {
        ...prev,
        developer_name: newDeveloper.en_name,
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
              <MultiLangInput
                label={t.formLabels?.compoundName || "Compound Name"}
                required
                arValue={formData.ar_name}
                enValue={formData.en_name}
                onChange={handleChange}
                errors={{
                  ar_name: errors.ar_name,
                  en_name: errors.en_name,
                }}
                placeholders={{
                  ar: "اسم المشروع (العربية)",
                  en: "Compound Name (English)",
                }}
                missingLang={missingLang}
              />
            </div>

            {/* Description */}
            <div>
              <label
                className={`block text-sm font-medium mb-1 ${errors.description ? "text-red-500" : "text-gray-700"}`}
              >
                {t.formLabels?.description || "Description"}{" "}
                <span className="text-red-500">*</span>
                <span className="text-xs text-gray-500 ml-2">
                  ({formData.description.length}/300 min)
                </span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={11}
                className={`block w-full rounded-md border py-1 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.description ? "border-red-500" : "border-gray-300"
                }`}
                placeholder={t.placeholders.projectDescription}
              />
              {errors.description && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.description}
                </p>
              )}
            </div>

            {/* Location */}
            <div className="grid grid-cols-2 gap-4">
              <CitySelect
                value={formData.city}
                onChange={handleChange}
                error={errors.city}
                required
              />

              <FormSelect
                name="country"
                label={t.formLabels?.country || "Country"}
                value={formData.country}
                onChange={handleChange}
                required
                error={errors.country}
                disabled={editMode}
              >
                {COUNTRIES.map((country) => (
                  <option key={country.value} value={country.value}>
                    {locale === "ar" ? country.ar_label : country.en_label}
                  </option>
                ))}
              </FormSelect>
            </div>

            <FormSelect
              name="district"
              label={t.formLabels?.district || "District"}
              value={formData.district}
              onChange={handleChange}
              required
              error={errors.district}
              disabled={!formData.city}
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
                    {formatDistrictLabel(dist.district, formData.city, locale)}
                  </option>
                ))}
            </FormSelect>

            {/* Details */}
            <div className="grid grid-cols-2 gap-4">
              <FormInput
                type="number"
                name="area"
                label={t.formLabels?.area || "Area (m²)"}
                value={formData.area}
                onChange={handleChange}
                required
                placeholder="1000"
                min="0"
                error={errors.area}
              />

              <div className="flex items-center gap-1 h-full pt-6">
                <input
                  type="checkbox"
                  id="gated"
                  name="gated"
                  checked={formData.gated}
                  onChange={handleChange}
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
              <FormSelect
                name="developer_name"
                label={t.formLabels?.developer || "Developer"}
                value={formData.developer_name}
                onChange={handleChange}
                required
                error={errors.developer_name}
              >
                <option value="">
                  {editMode
                    ? formData.developer_name
                    : t.formLabels?.selectDeveloper || "Select developer"}
                </option>
                {developers
                  ?.slice()
                  .sort((a, b) => {
                    const nameA = locale === "ar" ? a.ar_name : a.en_name;
                    const nameB = locale === "ar" ? b.ar_name : b.en_name;
                    return nameA.trim().localeCompare(nameB.trim(), locale, {
                      sensitivity: "base",
                    });
                  })
                  .map((d, idx) => (
                    <option key={idx} value={d.en_name}>
                      {locale === "ar" ? d.ar_name : d.en_name}
                    </option>
                  ))}
              </FormSelect>
              <button
                type="button"
                onClick={() => setIsAddDeveloperDialogOpen(true)}
                className={`absolute ${locale === "ar" ? "left-0" : "right-0"} top-0 text-blue-600 text-sm font-medium`}
              >
                + {t.buttons?.addNew || "Add New"}
              </button>
            </div>

            {/* Links */}
            <FormInput
              type="url"
              name="video_url"
              label={t.formLabels?.videoURL || "Video URL"}
              value={formData.video_url}
              onChange={handleChange}
              placeholder="https://example.com/video"
            />
            <FormInput
              type="url"
              name="google_map_link"
              label={t.formLabels?.googleMapsLink || "Google Maps Link"}
              value={formData.google_map_link}
              onChange={handleChange}
              placeholder="https://maps.google.com/..."
            />

            {/* Master Plan Image */}
            <SingleImageUploader
              label={t.formLabels.masterPlanImage || "Master Plan Image"}
              value={formData.master_plan.url || null}
              imageId={formData.master_plan.fileId || null}
              onChange={(url, id) =>
                setFormData((prev) => ({
                  ...prev,
                  master_plan: {
                    url,
                    fileId: id,
                  },
                }))
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
