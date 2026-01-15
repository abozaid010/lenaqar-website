"use client";

import AddDeveloperDialog from "@/components/ui/add-developer-dialog";
import Dialog from "@/components/ui/Dialog";
import ExistingProjectPreviewDialog from "@/components/ui/existing-project-preview-dialog";
import FormInput from "@/components/ui/inputs/form-input";
import FormMultiSelect from "@/components/ui/inputs/form-multi-select";
import FormSelect from "@/components/ui/inputs/form-select";
import ImageUploader from "@/components/ui/inputs/image-uploader";
import MultiLangInput from "@/components/ui/inputs/multilang-input";
import PaymentPlansList from "@/components/ui/inputs/payment-plans-list";
import SearchableDropdownSelect from "@/components/ui/inputs/searchable-dropdown-select";
import SingleImageUploader from "@/components/ui/inputs/single-image-uploader";
import CitySelect from "@/components/ui/inputs/sorted-city-select";
import { useI18n } from "@/context/translate-api";
import { COUNTRIES } from "@/data/cities";
import { getBuildingTypes } from "@/data/constants";
import en from "../../../public/locales/en";
import ar from "../../../public/locales/ar";
import { useDevelopers } from "@/hooks/use-admin-shared-data";
import { useCitiesDistricts } from "@/hooks/use-cities-districts";
import { addCompound, updatecompound } from "@/utils/api";
import { parseExistingProjectData } from "@/utils/error-parser";
import { compoundKeys } from "@/utils/query-utils";
import { Loader2 } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export default function AddCompoundDialog({
  clientId,
  isOpen,
  onClose,
  compoundData,
  onAdd = () => {},
  defaultCity,
  defaultDistrict,
}) {
  const queryClient = useQueryClient();
  
  const { isLoading: delveloperLoading, data: developersData } =
    useDevelopers(clientId);

  const { getDistrictsWithLabels, isLoading: districtsLoading } = useCitiesDistricts();

  const [developers, setDevelopers] = useState(developersData || []);

  useEffect(() => {
    if (developersData) {
      setDevelopers(developersData);
    }
  }, [delveloperLoading]);

  const { t, locale } = useI18n();

  // Get building types with translations
  const BUILDING_TYPES = useMemo(() => {
    return getBuildingTypes({
      en: { buildingTypes: en.buildingTypes || {} },
      ar: { buildingTypes: ar.buildingTypes || {} },
    });
  }, []);

  const editMode = !!(compoundData && compoundData.id);

  const [isMasterPlanUploading, setIsMasterPlanUploading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [errors, setErrors] = useState({});
  const [missingLang, setMissingLang] = useState(null);
  const [isAddDeveloperDialogOpen, setIsAddDeveloperDialogOpen] =
    useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [existingProjectData, setExistingProjectData] = useState(null);

  const [formData, setFormData] = useState({
    ar_name: compoundData?.ar_name || compoundData?.project?.ar_name || "",
    en_name: compoundData?.en_name || compoundData?.project?.en_name || "",
    description: compoundData?.description || compoundData?.project?.description || "",
    developer_name: compoundData?.developer_name || compoundData?.project?.developer_name || "",
    city: compoundData?.city || compoundData?.project?.city || defaultCity || "",
    country: compoundData?.country || compoundData?.project?.country || "Egypt",
    district: compoundData?.district || compoundData?.project?.district || defaultDistrict || "",
    area: compoundData?.area || compoundData?.project?.area || "",
    gated: compoundData?.gated !== undefined && compoundData?.gated !== null 
      ? compoundData.gated 
      : (compoundData?.project?.gated !== undefined && compoundData?.project?.gated !== null 
        ? compoundData.project.gated 
        : true),
    is_active: compoundData?.is_active !== undefined && compoundData?.is_active !== null 
      ? compoundData.is_active 
      : (compoundData?.project?.is_active !== undefined && compoundData?.project?.is_active !== null 
        ? compoundData.project.is_active 
        : true),
    video_url: compoundData?.video_url || compoundData?.project?.video_url || "",
    google_map_link: compoundData?.google_map_link || compoundData?.project?.google_map_link || "",
    master_plan: compoundData?.master_plan || compoundData?.project?.master_plan || { url: null, fileId: null },
    client_id: compoundData?.client_id || compoundData?.project?.client_id || clientId || "",
    images: compoundData?.images || compoundData?.project?.images || [],
    properties_types: compoundData?.properties_types || compoundData?.project?.properties_types || [],
    payment_plans: compoundData?.payment_plans || compoundData?.project?.payment_plans || [],
    building_types_images: compoundData?.building_types_images || compoundData?.project?.building_types_images || {},
    delivery_date: compoundData?.delivery_date !== undefined && compoundData?.delivery_date !== null 
      ? compoundData.delivery_date 
      : (compoundData?.project?.delivery_date !== undefined && compoundData?.project?.delivery_date !== null 
        ? compoundData.project.delivery_date 
        : 4),
  });

  useEffect(() => {
    if (isOpen) {
      // When the dialog is opening
      if (editMode && compoundData) {
        // Load existing data for editing
        setFormData((prev) => ({
          ...prev,
          ar_name: compoundData?.ar_name || compoundData?.project?.ar_name || "",
          en_name: compoundData?.en_name || compoundData?.project?.en_name || "",
          description: compoundData.description || compoundData?.project?.description || "",
          developer_name: compoundData.developer_name || compoundData?.project?.developer_name || "",
          city: compoundData.city || compoundData?.project?.city || defaultCity || "",
          country: compoundData.country || compoundData?.project?.country || "Egypt",
          district: compoundData.district || compoundData?.project?.district || defaultDistrict || "",
          area: compoundData.area || compoundData?.project?.area || "",
          gated: compoundData.gated !== undefined && compoundData.gated !== null 
            ? compoundData.gated 
            : (compoundData?.project?.gated !== undefined && compoundData?.project?.gated !== null 
              ? compoundData.project.gated 
              : true),
          is_active: compoundData.is_active !== undefined && compoundData.is_active !== null 
            ? compoundData.is_active 
            : (compoundData?.project?.is_active !== undefined && compoundData?.project?.is_active !== null 
              ? compoundData.project.is_active 
              : true),
          video_url: compoundData.video_url || compoundData?.project?.video_url || "",
          google_map_link: compoundData.google_map_link || compoundData?.project?.google_map_link || "",
          master_plan: compoundData?.master_plan || compoundData?.project?.master_plan || { url: null, fileId: null },
          client_id: compoundData.client_id || compoundData?.project?.client_id || clientId || "",
          images: compoundData.images || compoundData?.project?.images || [],
          properties_types: compoundData.properties_types || compoundData?.project?.properties_types || [],
          payment_plans: compoundData.payment_plans || compoundData?.project?.payment_plans || [],
          building_types_images: compoundData?.building_types_images || compoundData?.project?.building_types_images || {},
          delivery_date: compoundData.delivery_date !== undefined && compoundData.delivery_date !== null 
            ? compoundData.delivery_date 
            : (compoundData?.project?.delivery_date !== undefined && compoundData?.project?.delivery_date !== null 
              ? compoundData.project.delivery_date 
              : 4),
        }));
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
          gated: true,
          is_active: true,
          video_url: "",
          google_map_link: "",
          master_plan: { url: null, fileId: null },
          client_id: clientId || "",
          images: [],
          properties_types: [],
          payment_plans: [],
          building_types_images: {},
          delivery_date: 4,
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
        gated: true,
        is_active: true,
        properties_types: [],
        payment_plans: [],
        video_url: "",
        google_map_link: "",
        master_plan: { url: null, fileId: null },
        client_id: clientId || "",
        images: [],
        building_types_images: {},
        delivery_date: 4,
      });

      setErrors({});
    }
  }, [isOpen, editMode, compoundData, defaultCity, defaultDistrict, clientId]);

  // Additional effect to update form when compoundData changes while dialog is open
  useEffect(() => {
    if (isOpen && editMode && compoundData) {
      // Update form data when compoundData changes
      setFormData((prev) => ({
        ...prev,
        ar_name: compoundData?.ar_name || compoundData?.project?.ar_name || prev.ar_name || "",
        en_name: compoundData?.en_name || compoundData?.project?.en_name || prev.en_name || "",
        description: compoundData?.description || compoundData?.project?.description || prev.description || "",
        developer_name: compoundData?.developer_name || compoundData?.project?.developer_name || prev.developer_name || "",
        city: compoundData?.city || compoundData?.project?.city || prev.city || defaultCity || "",
        country: compoundData?.country || compoundData?.project?.country || prev.country || "Egypt",
        district: compoundData?.district || compoundData?.project?.district || prev.district || defaultDistrict || "",
        area: compoundData?.area || compoundData?.project?.area || prev.area || "",
        gated: compoundData?.gated !== undefined && compoundData?.gated !== null 
          ? compoundData.gated 
          : (compoundData?.project?.gated !== undefined && compoundData?.project?.gated !== null 
            ? compoundData.project.gated 
            : prev.gated !== undefined ? prev.gated : true),
        is_active: compoundData?.is_active !== undefined && compoundData?.is_active !== null 
          ? compoundData.is_active 
          : (compoundData?.project?.is_active !== undefined && compoundData?.project?.is_active !== null 
            ? compoundData.project.is_active 
            : prev.is_active !== undefined ? prev.is_active : true),
        video_url: compoundData?.video_url || compoundData?.project?.video_url || prev.video_url || "",
        google_map_link: compoundData?.google_map_link || compoundData?.project?.google_map_link || prev.google_map_link || "",
        master_plan: compoundData?.master_plan || compoundData?.project?.master_plan || prev.master_plan || { url: null, fileId: null },
        client_id: compoundData?.client_id || compoundData?.project?.client_id || prev.client_id || clientId || "",
        images: compoundData?.images || compoundData?.project?.images || prev.images || [],
        properties_types: compoundData?.properties_types || compoundData?.project?.properties_types || prev.properties_types || [],
        payment_plans: compoundData?.payment_plans || compoundData?.project?.payment_plans || prev.payment_plans || [],
        building_types_images: compoundData?.building_types_images || compoundData?.project?.building_types_images || prev.building_types_images || {},
        delivery_date: compoundData?.delivery_date !== undefined && compoundData?.delivery_date !== null 
          ? compoundData.delivery_date 
          : (compoundData?.project?.delivery_date !== undefined && compoundData?.project?.delivery_date !== null 
            ? compoundData.project.delivery_date 
            : prev.delivery_date !== undefined ? prev.delivery_date : 4),
      }));
    }
  }, [compoundData, isOpen, editMode, defaultCity, defaultDistrict, clientId]);

  // Get districts for selected city
  const districtsWithLabels = formData.city 
    ? getDistrictsWithLabels(formData.city)
    : [];

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

    if (name === "city") {
      // Reset district when city changes
      setFormData({
        ...formData,
        city: value,
        district: "", // Reset district when city changes
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === "checkbox" ? checked : value,
      });
    }

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
    } else if (formData.description.trim().length < 30) {
      newErrors.description =
        t.formValidation?.descriptionMinLength ||
        "Description must be at least 30 characters";
    } else if (formData.description.trim().length > 1200) {
      newErrors.description =
        t.formValidation?.descriptionMaxLength ||
        "Description must be less than 1200 characters";
    }

    if (!formData.city.trim()) {
      newErrors.city = t.formValidation?.cityRequired || "City is required";
    }

    // Country is always "Egypt" (hidden field), no validation needed

    if (!formData.district.trim()) {
      newErrors.district =
        t.formValidation?.districtRequired || "District is required";
    }

    if (formData.delivery_date === undefined || formData.delivery_date === null || formData.delivery_date === "") {
      newErrors.delivery_date =
        t.formValidation?.deliveryDateRequired || "Delivery in years is required";
    } else {
      const deliveryValue = parseFloat(formData.delivery_date);
      if (isNaN(deliveryValue) || deliveryValue < 0) {
        newErrors.delivery_date =
          t.formValidation?.deliveryDateInvalid || "Delivery in years must be a valid number (0 or greater)";
      }
    }

    if (!formData.area || Number(formData.area) <= 0) {
      newErrors.area = "Area must be greater than 0";
    }

    if (!formData.properties_types || formData.properties_types.length === 0) {
      newErrors.properties_types =
        t.formValidation?.propertyTypesRequired ||
        "At least one property type is required";
    }

    if (!formData.payment_plans || formData.payment_plans.length === 0) {
      newErrors.payment_plans =
        t.formValidation?.paymentPlansRequired ||
        "At least one payment plan is required";
    } else if (formData.payment_plans.length > 1) {
      // If multiple plans, ensure one is marked as default
      const hasDefault = formData.payment_plans.some((plan) => plan.is_default === true);
      if (!hasDefault) {
        newErrors.payment_plans =
          t.formValidation?.defaultPaymentPlanRequired ||
          "Please select a default payment plan when multiple plans are selected";
      }
    } else if (formData.payment_plans.length === 1) {
      // If only one plan, automatically set it as default (update state)
      if (!formData.payment_plans[0].is_default) {
        setFormData((prev) => ({
          ...prev,
          payment_plans: [{ ...prev.payment_plans[0], is_default: true }],
        }));
      }
    }

    if (!formData.google_map_link || !formData.google_map_link.trim()) {
      newErrors.google_map_link =
        t.formValidation?.googleMapsLinkRequired ||
        "Google Maps Link is required";
    }

    if (!formData.master_plan || !formData.master_plan.url) {
      newErrors.master_plan =
        t.formValidation?.masterPlanRequired ||
        "Master plan image is required";
    }

    setErrors(newErrors);
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("[handleSubmit] Form submission started", {
      editMode,
      compoundDataId: compoundData?.id,
    });

    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      console.log("[handleSubmit] Validation errors:", formErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const submissionData = {
        ...formData,
        area: Number(formData.area),
        delivery_date: parseFloat(formData.delivery_date),
      };

      console.log("[handleSubmit] Submission data prepared:", {
        editMode,
        projectId: compoundData?.id,
        submissionDataKeys: Object.keys(submissionData),
        submissionDataSummary: {
          ar_name: submissionData.ar_name,
          en_name: submissionData.en_name,
          city: submissionData.city,
          district: submissionData.district,
          area: submissionData.area,
          delivery_date: submissionData.delivery_date,
          gated: submissionData.gated,
          is_active: submissionData.is_active,
          imagesCount: submissionData.images?.length || 0,
          paymentPlansCount: submissionData.payment_plans?.length || 0,
          propertiesTypesCount: submissionData.properties_types?.length || 0,
        },
      });

      let res;
      if (editMode) {
        if (!compoundData?.id) {
          console.error("[handleSubmit] Missing project ID for update:", {
            compoundData,
            compoundDataId: compoundData?.id,
          });
          toast.error("Project ID is missing. Cannot update project.");
          setIsSubmitting(false);
          return;
        }
        console.log("[handleSubmit] Calling updatecompound with ID:", compoundData.id);
        res = await updatecompound(submissionData, compoundData.id);
      } else {
        console.log("[handleSubmit] Calling addCompound...");
        res = await addCompound(submissionData);
      }

      console.log("[handleSubmit] API Response received:", {
        res,
        resType: typeof res,
        resKeys: res ? Object.keys(res) : [],
        hasStatus: res?.status !== undefined,
        status: res?.status,
        statusCode: res?.statusCode,
        hasData: res?.data !== undefined,
        hasError: res?.error !== undefined,
        error: res?.error,
        hasExistingProjectData: !!res?.existing_project_data,
        isArray: Array.isArray(res),
        hasId: res?.id !== undefined,
      });

      // Check for 400 status code with existing_project_data FIRST (before checking other errors)
      // This ensures we show preview dialog instead of toast
      if (res?.statusCode === 400 && res?.existing_project_data) {
        console.log("[handleSubmit] Project already exists, showing preview dialog:", {
          existingProjectData: res.existing_project_data,
          existingProjectDataKeys: res.existing_project_data ? Object.keys(res.existing_project_data) : null,
        });
        setExistingProjectData(res.existing_project_data);
        setPreviewDialogOpen(true);
        setIsSubmitting(false);
        return; // Don't show toast, just show preview
      }
      
      // Also check if res itself has existing_project_data (in case statusCode wasn't set)
      if (res?.existing_project_data && (res?.error || res?.error_message)) {
        console.log("[handleSubmit] Found existing_project_data in response (without statusCode), showing preview:", {
          existingProjectData: res.existing_project_data,
        });
        setExistingProjectData(res.existing_project_data);
        setPreviewDialogOpen(true);
        setIsSubmitting(false);
        return; // Don't show toast, just show preview
      }
      
      // Check for success - handle different response formats
      // Format 1: { status: true, data: {...} }
      // Format 2: { status: 200, data: {...} }
      // Format 3: { id: ..., name: ..., ... } (direct data object)
      // Format 4: { error: "..." } (error response)
      
      const hasError = res?.error || res?.error_message;
      const hasSuccessStatus = res?.status === true || res?.status === 200;
      const hasDataObject = res?.data && typeof res.data === 'object';
      const hasDirectData = res?.id || (res && !hasError && typeof res === 'object' && !res.status);
      
      if (hasError) {
        const errorMessage =
          res?.error || 
          res?.error_message ||
          res?.message ||
          "An error occurred while processing your request.";
        console.error("[handleSubmit] Update failed with error (no preview available):", {
          errorMessage,
          fullResponse: res,
          statusCode: res?.statusCode,
        });
        toast.error(errorMessage);
        setIsSubmitting(false);
        return;
      } else if (hasSuccessStatus || hasDataObject || hasDirectData) {
        // Success - extract the data
        const projectData = res?.data || res;
        console.log("[handleSubmit] Update successful, calling onAdd with:", projectData);
        onAdd(projectData);
        
        // Invalidate projects query cache to refetch from API
        queryClient.invalidateQueries({ queryKey: compoundKeys.all });
        
        toast.success(
          editMode
            ? t.compoundUpdated || "project updated successfully!"
            : t.compoundAdded || "project added successfully!"
        );
      } else {
        // Unknown response format
        console.warn("[handleSubmit] Unknown response format:", res);
        const errorMessage = "An error occurred while processing your request.";
        toast.error(errorMessage);
        return;
      }

      console.log("[handleSubmit] Closing dialog and resetting form");
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
        gated: true,
        is_active: true,
        video_url: "",
        google_map_link: "",
        master_plan: { url: null, fileId: null },
        client_id: clientId || "ai",
        properties_types: [],
        payment_plans: [],
        building_types_images: {},
        delivery_date: 4,
      });
    } catch (error) {
      console.error("[handleSubmit] Exception caught:", {
        error,
        errorMessage: error.message,
        errorStack: error.stack,
        errorResponse: error.response,
        errorResponseData: error.response?.data,
      });
      
      // Check if the error response contains existing_project_data
      const errorResponseData = error.response?.data;
      if (error.response?.status === 400 && errorResponseData?.error_message) {
        const existingProjectData = parseExistingProjectData(errorResponseData.error_message);
        if (existingProjectData) {
          console.log("[handleSubmit] Found existing_project_data in exception, showing preview:", {
            existingProjectData,
          });
          setExistingProjectData(existingProjectData);
          setPreviewDialogOpen(true);
          setIsSubmitting(false);
          return; // Don't show toast
        }
      }
      
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
      console.log("[handleSubmit] Form submission completed");
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

  const handlePaymentPlansChange = (newPlans) => {
    setFormData((prev) => ({
      ...prev,
      payment_plans: newPlans,
    }));

    // Clear error if any
    if (errors.payment_plans) {
      setErrors({
        ...errors,
        payment_plans: null,
      });
    }
  };

  const handleBuildingTypeImagesChange = (propertyType, images) => {
    setFormData((prev) => ({
      ...prev,
      building_types_images: {
        ...prev.building_types_images,
        [propertyType]: images,
      },
    }));
  };

  const getPropertyTypeLabel = (value) => {
    const type = BUILDING_TYPES.find((type) => type.value === value);
    return type ? (locale === "ar" ? type.ar_label : type.en_label) : value;
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
                  ({formData.description.length}/30-1200)
                </span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={5}
                className={`block w-full rounded-md border py-1 px-3 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
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

            {/* Gated Community and Sold Out Checkboxes */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-1">
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
              <div className="flex items-center gap-1">
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  checked={!formData.is_active}
                  onChange={(e) => {
                    handleChange({
                      target: {
                        name: "is_active",
                        type: "checkbox",
                        checked: !e.target.checked, // Invert: checked means sold out (is_active = false)
                      },
                    });
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="is_active"
                  className="ml-2 block text-sm text-gray-700"
                >
                  {t.formLabels?.soldOut || "Sold out"}
                </label>
              </div>
            </div>

            {/* Location - City and District on same line */}
            <div className="grid grid-cols-2 gap-4">
              <CitySelect
                value={formData.city}
                onChange={handleChange}
                error={errors.city}
                required
              />

              <SearchableDropdownSelect
                name="district"
                label={t.formLabels?.district || "District"}
                value={formData.district}
                onChange={handleChange}
                required
                error={!!errors.district}
                errorMessage={errors.district}
                disabled={!formData.city}
                isLoading={districtsLoading}
                options={districtsWithLabels}
                placeholder={
                  !formData.city
                    ? locale === "ar"
                      ? "الرجاء اختيار المدينة أولاً"
                      : "Please select a city first"
                    : locale === "ar"
                      ? t.formLabels?.district || "اختر المنطقة"
                      : "Select district"
                }
                getValue={(option) => option.value}
                getLabel={(option) => option.label}
                getKey={(option) => option.value}
                searchFields={["label"]}
                noResultsText={
                  districtsWithLabels.length === 0 && formData.city
                    ? locale === "ar"
                      ? `لا توجد مناطق لـ ${formData.city}`
                      : `No districts found for ${formData.city}`
                    : undefined
                }
              />
            </div>

            {/* Hidden country field - always set to Egypt */}
            <input
              type="hidden"
              name="country"
              value="Egypt"
            />

            {/* Delivery and Area on same line */}
            <div className="grid grid-cols-2 gap-4">
              <FormInput
                type="number"
                name="delivery_date"
                label={t.formLabels?.deliveryInYears || "Delivery in years:"}
                value={formData.delivery_date}
                onChange={handleChange}
                required
                placeholder="4"
                min="0"
                step="0.5"
                error={errors.delivery_date}
              />

              <FormInput
                type="number"
                name="area"
                label={t.formLabels?.area || "Area (fdan)"}
                value={formData.area}
                onChange={handleChange}
                required
                placeholder="1000"
                min="0"
                error={errors.area}
              />
            </div>

            {/* Payment Plans */}
            <PaymentPlansList
              plans={formData.payment_plans}
              onChange={handlePaymentPlansChange}
              error={errors.payment_plans}
              required={true}
            />

            {/* Developer */}
            <div className="relative">
              <div className="flex justify-between items-center mb-1">
                <label
                  className={`block text-sm font-medium ${
                    errors.developer_name ? "text-red-500" : "text-gray-700"
                  }`}
                >
                  {t.formLabels?.developer || "Developer"}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddDeveloperDialogOpen(true)}
                  className="text-blue-600 text-sm font-medium hover:text-blue-700"
                >
                  + {t.buttons?.addNew || "Add New"}
                </button>
              </div>
              <SearchableDropdownSelect
                name="developer_name"
                value={formData.developer_name}
                onChange={handleChange}
                required
                error={!!errors.developer_name}
                errorMessage={typeof errors.developer_name === "string" ? errors.developer_name : ""}
                placeholder={t.formLabels?.selectDeveloper || "Select developer"}
                options={developers || []}
                getValue={(developer) => developer.en_name || ""}
                getLabel={(developer, loc) => {
                  if (loc === "ar" && developer.ar_name) {
                    return developer.ar_name;
                  }
                  return developer.en_name || "";
                }}
                searchFields={["ar_name", "en_name"]}
                isLoading={delveloperLoading}
              />
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
              required
              error={errors.google_map_link}
            />

            {/* Master Plan Image - Now mandatory */}
            <SingleImageUploader
              label={t.formLabels.masterPlanImage || "Master Plan Image"}
              value={formData.master_plan.url || null}
              imageId={formData.master_plan.fileId || null}
              onChange={(url, id) => {
                setFormData((prev) => ({
                  ...prev,
                  master_plan: {
                    url,
                    fileId: id,
                  },
                }));
                // Clear error when image is uploaded
                if (errors.master_plan) {
                  setErrors((prev) => ({
                    ...prev,
                    master_plan: null,
                  }));
                }
              }}
              disabled={isMasterPlanUploading || isSubmitting}
              isUploading={isMasterPlanUploading}
              setIsUploading={setIsMasterPlanUploading}
              imageType="masterPlan"
              required={true}
              error={errors.master_plan}
            />

            {/* Property Types */}
            <FormMultiSelect
              name="properties_types"
              label={t.formLabels.propertyTypes || "Property Types"}
              placeholder={
                locale === "ar" ? "اختر أنواع العقارات" : "Select options"
              }
              value={formData.properties_types}
              onChange={handleChange}
              options={BUILDING_TYPES}
              locale={locale}
              required={true}
              error={errors.properties_types}
            />

            {/* Building Types Images */}
            {formData.properties_types && formData.properties_types.length > 0 && (
              <div className="space-y-4">
                {formData.properties_types.map((propertyType) => (
                  <div key={propertyType}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {getPropertyTypeLabel(propertyType)}
                      <span className="text-xs font-normal text-gray-500 ml-2">
                        (
                        {(formData.building_types_images[propertyType] || [])
                          .length}{" "}
                        / 4)
                      </span>
                    </label>
                    <ImageUploader
                      maxImages={4}
                      initialImages={
                        formData.building_types_images[propertyType] || []
                      }
                      onImagesChange={(images) =>
                        handleBuildingTypeImagesChange(propertyType, images)
                      }
                      isUploading={isUploading}
                      setIsUploading={setIsUploading}
                    />
                  </div>
                ))}
              </div>
            )}

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

      <ExistingProjectPreviewDialog
        isOpen={previewDialogOpen}
        onClose={() => {
          setPreviewDialogOpen(false);
          setExistingProjectData(null);
        }}
        projectData={existingProjectData}
      />
    </>
  );
}
