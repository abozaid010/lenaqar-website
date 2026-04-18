"use client";

import AddDeveloperDialog from "@/components/ui/add-developer-dialog";
import Dialog from "@/components/ui/Dialog";
import ExistingProjectPreviewDialog from "@/components/ui/existing-project-preview-dialog";
import { LenaTextField, LenaTextarea } from "@/components/ui/inputs";
import FormMultiSelect from "@/components/ui/inputs/form-multi-select";
import ImageUploader from "@/components/ui/inputs/image-uploader";
import MultiLangInput from "@/components/ui/inputs/multilang-input";
import PaymentPlansList from "@/components/ui/inputs/payment-plans-list";
import SearchableDropdownSelect from "@/components/ui/inputs/searchable-dropdown-select";
import SingleImageUploader from "@/components/ui/inputs/single-image-uploader";
import CitySelect from "@/components/ui/inputs/sorted-city-select";
import { useI18n } from "@/context/translate-api";
import { COUNTRIES } from "@/data/cities";
import { getBuildingTypes, getFinishingTypes } from "@/data/constants";
import en from "../../../public/locales/en";
import ar from "../../../public/locales/ar";
import { useDevelopers } from "@/hooks/use-admin-shared-data";
import { useCitiesDistricts } from "@/hooks/use-cities-districts";
import {
  addCompound as addProject,
  updatecompound as updateProject,
  getClientid,
} from "@/utils/api";
import {
  parseExistingProjectData,
  parseValidationErrors,
} from "@/utils/error-parser";
import { compoundKeys as projectKeys } from "@/utils/query-utils";
import { Loader2 } from "lucide-react";
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export default function AddCompoundDialog({
  clientId,
  isOpen,
  onClose,
  compoundData: projectData,
  onAdd = () => {},
  defaultCity,
  defaultDistrict,
}) {
  const GOOGLE_MAPS_REQUIRED_PREFIX = "https://maps.app.goo.gl";
  const queryClient = useQueryClient();

  const { isLoading: delveloperLoading, data: developersData } =
    useDevelopers(clientId);

  const { getDistrictsWithLabels } = useCitiesDistricts();

  const [developers, setDevelopers] = useState(developersData || []);
  const [districtsWithLabels, setDistrictsWithLabels] = useState([]);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);

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

  // Get finishing types with translations
  const FINISHING_TYPES = useMemo(() => {
    return getFinishingTypes({
      en: { finishingTypes: en.unitDetails?.finishingTypes || {} },
      ar: { finishingTypes: ar.unitDetails?.finishingTypes || {} },
    });
  }, []);

  const editMode = !!(projectData && projectData.id);

  // Helper function to normalize finishing_type to always be an array
  const normalizeFinishingType = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    return [value];
  };

  const [isMasterPlanUploading, setIsMasterPlanUploading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  
  // Ref to track submission state and prevent duplicate submissions
  const isSubmittingRef = useRef(false);
  const lastSubmitTimeRef = useRef(0);

  const [errors, setErrors] = useState({});
  const [missingLang, setMissingLang] = useState(null);
  const [isAddDeveloperDialogOpen, setIsAddDeveloperDialogOpen] =
    useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [existingProjectData, setExistingProjectData] = useState(null);

  // Refs for form fields to enable scrolling to errors
  const fieldRefs = useRef({
    ar_name: null,
    en_name: null,
    description: null,
    city: null,
    district: null,
    delivery_date: null,
    area: null,
    latitude: null,
    longitude: null,
    location_landmark: null,
    payment_plans: null,
    developer_id: null,
    video_url: null,
    google_map_link: null,
    master_plan: null,
    properties_types: null,
    building_types_images: null,
    finishing_type: null,
  });

  const [formData, setFormData] = useState({
    ar_name: projectData?.ar_name || projectData?.project?.ar_name || "",
    en_name: projectData?.en_name || projectData?.project?.en_name || "",
    description:
      projectData?.description || projectData?.project?.description || "",
    developer_id:
      projectData?.developer_id || projectData?.project?.developer_id || "",
    developer_name:
      projectData?.developer_name || projectData?.project?.developer_name || "",
    city: projectData?.city || projectData?.project?.city || defaultCity || "",
    country: projectData?.country || projectData?.project?.country || "Egypt",
    district:
      projectData?.district ||
      projectData?.project?.district ||
      defaultDistrict ||
      "",
    area: projectData?.area || projectData?.project?.area || "",
    gated:
      projectData?.gated !== undefined && projectData?.gated !== null
        ? projectData.gated
        : projectData?.project?.gated !== undefined &&
            projectData?.project?.gated !== null
          ? projectData.project.gated
          : true,
    is_active:
      projectData?.is_active !== undefined && projectData?.is_active !== null
        ? projectData.is_active
        : projectData?.project?.is_active !== undefined &&
            projectData?.project?.is_active !== null
          ? projectData.project.is_active
          : true,
    video_url: projectData?.video_url || projectData?.project?.video_url || "",
    google_map_link:
      projectData?.google_map_link ||
      projectData?.project?.google_map_link ||
      "",
    master_plan: projectData?.master_plan ||
      projectData?.project?.master_plan || { url: null, fileId: null },
    client_id:
      projectData?.client_id ||
      projectData?.project?.client_id ||
      clientId ||
      "",
    images: projectData?.images || projectData?.project?.images || [],
    properties_types:
      projectData?.properties_types ||
      projectData?.project?.properties_types ||
      [],
    payment_plans:
      projectData?.payment_plans || projectData?.project?.payment_plans || [],
    building_types_images:
      projectData?.building_types_images ||
      projectData?.project?.building_types_images ||
      {},
    finishing_type: normalizeFinishingType(
      projectData?.finishing_type || projectData?.project?.finishing_type
    ),
    facility_management:
      projectData?.facility_management ||
      projectData?.project?.facility_management ||
      null,
    orientation_url:
      projectData?.orientation_url ||
      projectData?.project?.orientation_url ||
      "",
    delivery_date:
      projectData?.delivery_date !== undefined &&
      projectData?.delivery_date !== null
        ? projectData.delivery_date
        : projectData?.project?.delivery_date !== undefined &&
            projectData?.project?.delivery_date !== null
          ? projectData.project.delivery_date
          : 4,
    latitude: projectData?.latitude || projectData?.project?.latitude || "",
    longitude: projectData?.longitude || projectData?.project?.longitude || "",
    location_landmark: projectData?.location_landmark || projectData?.project?.location_landmark || "",
  });

  useEffect(() => {
    if (isOpen) {
      // When the dialog is opening
      if (editMode && projectData) {
        // Load existing data for editing
        setFormData((prev) => ({
          ...prev,
          ar_name: projectData?.ar_name || projectData?.project?.ar_name || "",
          en_name: projectData?.en_name || projectData?.project?.en_name || "",
          description:
            projectData.description || projectData?.project?.description || "",
          developer_id:
            projectData.developer_id ||
            projectData?.project?.developer_id ||
            "",
          developer_name:
            projectData.developer_name ||
            projectData?.project?.developer_name ||
            "",
          city:
            projectData.city || projectData?.project?.city || defaultCity || "",
          country:
            projectData.country || projectData?.project?.country || "Egypt",
          district:
            projectData.district ||
            projectData?.project?.district ||
            defaultDistrict ||
            "",
          area: projectData.area || projectData?.project?.area || "",
          gated:
            projectData.gated !== undefined && projectData.gated !== null
              ? projectData.gated
              : projectData?.project?.gated !== undefined &&
                  projectData?.project?.gated !== null
                ? projectData.project.gated
                : true,
          is_active:
            projectData.is_active !== undefined &&
            projectData.is_active !== null
              ? projectData.is_active
              : projectData?.project?.is_active !== undefined &&
                  projectData?.project?.is_active !== null
                ? projectData.project.is_active
                : true,
          video_url:
            projectData.video_url || projectData?.project?.video_url || "",
          google_map_link:
            projectData.google_map_link ||
            projectData?.project?.google_map_link ||
            "",
          master_plan: projectData?.master_plan ||
            projectData?.project?.master_plan || { url: null, fileId: null },
          client_id:
            projectData.client_id ||
            projectData?.project?.client_id ||
            clientId ||
            "",
          images: projectData.images || projectData?.project?.images || [],
          properties_types:
            projectData.properties_types ||
            projectData?.project?.properties_types ||
            [],
          payment_plans:
            projectData.payment_plans ||
            projectData?.project?.payment_plans ||
            [],
          building_types_images:
            projectData?.building_types_images ||
            projectData?.project?.building_types_images ||
            {},
          finishing_type:
            projectData.finishing_type ||
            projectData?.project?.finishing_type ||
            [],
          facility_management:
            projectData.facility_management ||
            projectData?.project?.facility_management ||
            null,
          orientation_url:
            projectData.orientation_url ||
            projectData?.project?.orientation_url ||
            "",
          delivery_date:
            projectData.delivery_date !== undefined &&
            projectData.delivery_date !== null
              ? projectData.delivery_date
              : projectData?.project?.delivery_date !== undefined &&
                  projectData?.project?.delivery_date !== null
                ? projectData.project.delivery_date
                : 4,
        }));
      } else if (!editMode) {
        // Reset form with defaults for adding
        // Ensure client_id is extracted from token for new projects
        const tokenClientId = getClientid();
        const initClientId = tokenClientId || clientId || "";
        console.log(
          "[useEffect] Initializing new project form with client_id:",
          {
            tokenClientId,
            propClientId: clientId,
            initClientId,
          }
        );

        setFormData({
          ar_name: "",
          en_name: "",
          description: "",
          developer_id: "",
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
          client_id: initClientId,
          images: [],
          properties_types: [],
          payment_plans: [],
          building_types_images: {},
          finishing_type: [],
          facility_management: null,
          orientation_url: "",
          delivery_date: "",
          latitude: "",
          longitude: "",
          location_landmark: "",
        });
      }
      setErrors({});
      setIsDirty(false);
    } else {
      // Ensure client_id is set from token when resetting form
      const resetClientId = getClientid() || clientId || "";
      setFormData({
        ar_name: "",
        en_name: "",
        description: "",
        developer_id: "",
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
        client_id: resetClientId,
        images: [],
        building_types_images: {},
        finishing_type: [],
        facility_management: null,
        orientation_url: "",
        delivery_date: "",
        latitude: "",
        longitude: "",
        location_landmark: "",
      });

      setErrors({});
      setIsDirty(false);
    }
  }, [isOpen, editMode, projectData, defaultCity, defaultDistrict, clientId]);

  // Additional effect to update form when compoundData changes while dialog is open
  useEffect(() => {
    if (isOpen && editMode && projectData) {
      // Update form data when compoundData changes
      setFormData((prev) => ({
        ...prev,
        ar_name:
          projectData?.ar_name ||
          projectData?.project?.ar_name ||
          prev.ar_name ||
          "",
        en_name:
          projectData?.en_name ||
          projectData?.project?.en_name ||
          prev.en_name ||
          "",
        description:
          projectData?.description ||
          projectData?.project?.description ||
          prev.description ||
          "",
        developer_id:
          projectData?.developer_id ||
          projectData?.project?.developer_id ||
          prev.developer_id ||
          "",
        developer_name:
          projectData?.developer_name ||
          projectData?.project?.developer_name ||
          prev.developer_name ||
          "",
        city:
          projectData?.city ||
          projectData?.project?.city ||
          prev.city ||
          defaultCity ||
          "",
        country:
          projectData?.country ||
          projectData?.project?.country ||
          prev.country ||
          "Egypt",
        district:
          projectData?.district ||
          projectData?.project?.district ||
          prev.district ||
          defaultDistrict ||
          "",
        area:
          projectData?.area || projectData?.project?.area || prev.area || "",
        gated:
          projectData?.gated !== undefined && projectData?.gated !== null
            ? projectData.gated
            : projectData?.project?.gated !== undefined &&
                projectData?.project?.gated !== null
              ? projectData.project.gated
              : prev.gated !== undefined
                ? prev.gated
                : true,
        is_active:
          projectData?.is_active !== undefined &&
          projectData?.is_active !== null
            ? projectData.is_active
            : projectData?.project?.is_active !== undefined &&
                projectData?.project?.is_active !== null
              ? projectData.project.is_active
              : prev.is_active !== undefined
                ? prev.is_active
                : true,
        video_url:
          projectData?.video_url ||
          projectData?.project?.video_url ||
          prev.video_url ||
          "",
        google_map_link:
          projectData?.google_map_link ||
          projectData?.project?.google_map_link ||
          prev.google_map_link ||
          "",
        master_plan: projectData?.master_plan ||
          projectData?.project?.master_plan ||
          prev.master_plan || { url: null, fileId: null },
        client_id:
          projectData?.client_id ||
          projectData?.project?.client_id ||
          prev.client_id ||
          clientId ||
          "",
        images:
          projectData?.images ||
          projectData?.project?.images ||
          prev.images ||
          [],
        properties_types:
          projectData?.properties_types ||
          projectData?.project?.properties_types ||
          prev.properties_types ||
          [],
        payment_plans:
          projectData?.payment_plans ||
          projectData?.project?.payment_plans ||
          prev.payment_plans ||
          [],
        building_types_images:
          projectData?.building_types_images ||
          projectData?.project?.building_types_images ||
          prev.building_types_images ||
          {},
        finishing_type:
          projectData?.finishing_type ||
          projectData?.project?.finishing_type ||
          prev.finishing_type ||
          [],
        facility_management:
          projectData?.facility_management !== undefined
            ? projectData.facility_management
            : projectData?.project?.facility_management !== undefined
              ? projectData.project.facility_management
              : prev.facility_management,
        orientation_url:
          projectData?.orientation_url ||
          projectData?.project?.orientation_url ||
          prev.orientation_url ||
          "",
        delivery_date:
          projectData?.delivery_date !== undefined &&
          projectData?.delivery_date !== null
            ? projectData.delivery_date
            : projectData?.project?.delivery_date !== undefined &&
                projectData?.project?.delivery_date !== null
              ? projectData.project.delivery_date
              : prev.delivery_date !== undefined
                ? prev.delivery_date
                : 4,
        latitude: projectData?.latitude || projectData?.project?.latitude || prev.latitude || "",
        longitude: projectData?.longitude || projectData?.project?.longitude || prev.longitude || "",
        location_landmark: projectData?.location_landmark || projectData?.project?.location_landmark || prev.location_landmark || "",
      }));
    }
  }, [projectData, isOpen, editMode, defaultCity, defaultDistrict, clientId]);

  // Load districts when city changes
  useEffect(() => {
    const loadDistricts = async () => {
      if (!formData.city) {
        setDistrictsWithLabels([]);
        return;
      }

      try {
        setIsLoadingDistricts(true);
        const districts = await getDistrictsWithLabels(formData.city);
        setDistrictsWithLabels(districts || []);
      } catch (error) {
        console.error("Failed to load districts:", error);
        setDistrictsWithLabels([]);
      } finally {
        setIsLoadingDistricts(false);
      }
    };

    loadDistricts();
  }, [formData.city, getDistrictsWithLabels]);

  const handleChange = (e) => {
    setIsDirty(true);
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

    // Clear video_url error when user types
    if (name === "video_url") {
      setErrors((prev) =>
        prev.video_url ? { ...prev, video_url: null } : prev
      );
    }

    // Validate Google Maps link prefix while typing
    if (name === "google_map_link") {
      const trimmed = (value || "").trim();
      const isValid =
        trimmed.length === 0 || trimmed.startsWith(GOOGLE_MAPS_REQUIRED_PREFIX);

      if (!isValid) {
        setErrors((prev) => ({
          ...prev,
          google_map_link:
            t.formValidation?.googleMapsLinkMustStartWith ||
            `Google Maps link must start with ${GOOGLE_MAPS_REQUIRED_PREFIX}`,
        }));
      } else if (errors.google_map_link) {
        setErrors((prev) => ({ ...prev, google_map_link: null }));
      }
    }

    if (name === "city") {
      // Reset district when city changes
      setFormData({
        ...formData,
        city: value,
        district: "", // Reset district when city changes
      });
    }
    if (name === "developer_id") {
      // When developer changes, set both developer_id and developer_name for API
      const selectedDeveloper = developers?.find((dev) => dev.id === value);
      const developerName = selectedDeveloper?.en_name || "";
      setFormData({
        ...formData,
        developer_id: value,
        developer_name: developerName,
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

    // Clear submit-level error once user edits anything
    if (errors.submit) {
      setErrors((prev) => ({ ...prev, submit: null }));
    }
  };

  // Function to scroll to first error field and animate it
  const scrollToFirstError = (errors) => {
    const errorFields = Object.keys(errors).filter((key) => errors[key]);
    if (errorFields.length === 0) return;

    // Priority order for error fields (top to bottom)
    const fieldOrder = [
      "ar_name",
      "en_name",
      "description",
      "city",
      "district",
      "delivery_date",
      "area",
      "latitude",
      "longitude",
      "location_landmark",
      "payment_plans",
      "developer_id",
      "video_url",
      "google_map_link",
      "master_plan",
      "properties_types",
      "building_types_images",
      "finishing_type",
    ];

    // Find first error field in priority order
    const firstErrorField = fieldOrder.find((field) =>
      errorFields.includes(field)
    );
    if (!firstErrorField) return;

    const fieldRef = fieldRefs.current[firstErrorField];
    if (!fieldRef) return;

    // Try to find the actual input/textarea/select element within the container
    let targetElement = fieldRef;

    // Check if the container has a child component with ref methods (LenaTextField, LenaTextarea)
    const inputSelectors = [
      "input",
      "textarea",
      "select",
      '[role="button"]', // For custom dropdowns
      'button[type="button"]', // For custom selects
    ];

    for (const selector of inputSelectors) {
      const element = fieldRef.querySelector(selector);
      if (element) {
        targetElement = element;
        break;
      }
    }

    // Scroll to the field with smooth behavior
    targetElement.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    // The LenaTextField and LenaTextarea components handle their own animations
    // via useEffect when error prop changes, so we don't need to manually add classes
    // But we can add a visual indicator to the container
    fieldRef.classList.add("ring-2", "ring-red-500", "rounded-md", "p-1");

    // Remove ring after animation completes
    setTimeout(() => {
      if (fieldRef) {
        fieldRef.classList.remove(
          "ring-2",
          "ring-red-500",
          "rounded-md",
          "p-1"
        );
      }
    }, 1000);
  };

  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.ar_name.trim()) {
      newErrors.ar_name = "Arabic project name is required";
      setMissingLang("ar");
    }

    if (!formData.en_name.trim()) {
      newErrors.en_name = "English project name is required";
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

    if (
      formData.delivery_date === undefined ||
      formData.delivery_date === null ||
      formData.delivery_date === ""
    ) {
      newErrors.delivery_date =
        t.formValidation?.deliveryDateRequired ||
        "Delivery in years is required";
    } else {
      const deliveryValue = parseFloat(formData.delivery_date);
      if (isNaN(deliveryValue) || deliveryValue < 0) {
        newErrors.delivery_date =
          t.formValidation?.deliveryDateInvalid ||
          "Delivery in years must be a valid number (0 or greater)";
      }
    }

    if (!formData.area || Number(formData.area) <= 0) {
      newErrors.area = "Area must be greater than 0";
    }

    // Validate latitude - handle both string and number types
    const latString = formData.latitude != null ? String(formData.latitude).trim() : "";
    if (!latString) {
      newErrors.latitude = "Latitude is required";
    } else {
      const latValue = parseFloat(latString);
      if (isNaN(latValue)) {
        newErrors.latitude = "Latitude must be a valid number";
      }
    }

    // Validate longitude - handle both string and number types
    const lngString = formData.longitude != null ? String(formData.longitude).trim() : "";
    if (!lngString) {
      newErrors.longitude = "Longitude is required";
    } else {
      const lngValue = parseFloat(lngString);
      if (isNaN(lngValue)) {
        newErrors.longitude = "Longitude must be a valid number";
      }
    }

    // Validate location_landmark - handle null/undefined safely
    const landmarkString = formData.location_landmark != null ? String(formData.location_landmark).trim() : "";
    if (!landmarkString) {
      newErrors.location_landmark = "Location landmark is required";
    }

    if (!formData.properties_types || formData.properties_types.length === 0) {
      newErrors.properties_types =
        t.formValidation?.propertyTypesRequired ||
        "At least one property type is required";
    }

    if (!formData.finishing_type || formData.finishing_type.length === 0) {
      newErrors.finishing_type =
        t.formValidation?.finishingTypeRequired ||
        "At least one finishing type is required";
    }

    // Require at least one image for EACH selected building type
    if (formData.properties_types && formData.properties_types.length > 0) {
      const buildingTypeImagesErrors = {};
      for (const propertyType of formData.properties_types) {
        const imgs = formData.building_types_images?.[propertyType] || [];
        if (!Array.isArray(imgs) || imgs.length === 0) {
          buildingTypeImagesErrors[propertyType] =
            locale === "ar"
              ? "الرجاء رفع صورة واحدة على الأقل لهذا النوع"
              : "Please upload at least one image for this building type";
        }
      }

      if (Object.keys(buildingTypeImagesErrors).length > 0) {
        newErrors.building_types_images = buildingTypeImagesErrors;
      }
    }

    if (!formData.payment_plans || formData.payment_plans.length === 0) {
      newErrors.payment_plans =
        t.formValidation?.paymentPlansRequired ||
        "At least one payment plan is required";
    } else if (formData.payment_plans.length > 1) {
      // If multiple plans, ensure one is marked as default
      const hasDefault = formData.payment_plans.some(
        (plan) => plan.is_default === true
      );
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

    if (!formData.developer_id || !formData.developer_id.trim()) {
      newErrors.developer_id =
        t.formValidation?.developerRequired || "Developer is required";
    }

    if (!formData.video_url || !formData.video_url.trim()) {
      newErrors.video_url =
        t.formValidation?.videoURLRequired || "Video URL is required";
    }

    if (!formData.google_map_link || !formData.google_map_link.trim()) {
      newErrors.google_map_link =
        t.formValidation?.googleMapsLinkRequired ||
        "Google Maps Link is required";
    } else if (
      !formData.google_map_link.trim().startsWith(GOOGLE_MAPS_REQUIRED_PREFIX)
    ) {
      newErrors.google_map_link =
        t.formValidation?.googleMapsLinkMustStartWith ||
        `Google Maps link must start with ${GOOGLE_MAPS_REQUIRED_PREFIX}`;
    }

    if (!formData.master_plan || !formData.master_plan.url) {
      newErrors.master_plan =
        t.formValidation?.masterPlanRequired || "Master plan image is required";
    }

    setErrors(newErrors);
    return newErrors;
  }, [
    formData,
    t,
    locale,
    developers,
    GOOGLE_MAPS_REQUIRED_PREFIX
  ]);

  const handleSubmit = useCallback(async (e) => {
    // Prevent default form submission if event exists
    e?.preventDefault();
    
    // Prevent duplicate submissions using ref
    if (isSubmittingRef.current || isSubmitting) {
      console.log("[handleSubmit] Already submitting, ignoring duplicate");
      return;
    }

    // Debounce: prevent submissions within 500ms of each other
    const now = Date.now();
    if (now - lastSubmitTimeRef.current < 500) {
      console.log("[handleSubmit] Debounced: submission too soon after previous");
      return;
    }
    
    console.log("[handleSubmit] Form submission started", {
      editMode,
      compoundDataId: projectData?.id,
    });

    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      console.log("[handleSubmit] Validation errors:", formErrors);
      setErrors((prev) => ({
        ...prev,
        submit:
          locale === "ar"
            ? "يرجى تصحيح الحقول المحددة باللون الأحمر ثم المحاولة مرة أخرى."
            : "Please fix the highlighted fields and try again.",
      }));
      // Scroll to first error and animate it
      setTimeout(() => {
        scrollToFirstError(formErrors);
      }, 100);
      return;
    }

    // Only lock submission AFTER validation passes
    isSubmittingRef.current = true;
    lastSubmitTimeRef.current = now;
    setIsSubmitting(true);

    try {
      const imagesForApi = (formData.images || []).map(({ url, fileId }) => ({
        url,
        fileId,
      }));
      const buildingTypesImagesForApi = formData.building_types_images
        ? Object.fromEntries(
            Object.entries(formData.building_types_images).map(([key, arr]) => [
              key,
              (arr || []).map(({ url, fileId }) => ({ url, fileId })),
            ])
          )
        : {};

      // Ensure client_id is extracted from token and validated
      const tokenClientId = getClientid();
      let finalClientId;

      if (editMode) {
        // For edit mode, use existing client_id but validate it's not empty
        // If existing client_id is empty, fall back to token
        finalClientId = formData.client_id || tokenClientId || clientId;
      } else {
        // For new projects, prioritize token extraction
        finalClientId = tokenClientId || formData.client_id || clientId;
      }

      // API expects both developer_id and developer_name
      const selectedDeveloper = developers?.find(
        (dev) => dev.id === formData.developer_id
      );
      const developerName =
        formData.developer_name || selectedDeveloper?.en_name || "";

      // API expects extra_payments to be a list; normalize null/undefined to []
      const paymentPlansForApi = (formData.payment_plans || []).map((plan) => ({
        ...plan,
        extra_payments: Array.isArray(plan.extra_payments)
          ? plan.extra_payments
          : [],
      }));

      // Only include facility_management when name is provided
      const facilityManagementForApi = formData.facility_management?.name?.trim()
        ? {
            name: formData.facility_management.name,
            ...(formData.facility_management.description?.trim() && {
              description: formData.facility_management.description,
            }),
            ...(formData.facility_management.rating !== "" &&
              formData.facility_management.rating !== undefined && {
                rating: parseFloat(formData.facility_management.rating),
              }),
          }
        : null;

      // Safely convert fields to strings for submission
      const latValue = formData.latitude != null ? String(formData.latitude).trim() : "";
      const lngValue = formData.longitude != null ? String(formData.longitude).trim() : "";
      const landmarkValue = formData.location_landmark != null ? String(formData.location_landmark).trim() : "";

      const submissionData = {
        ...formData,
        developer_id: formData.developer_id,
        developer_name: developerName,
        client_id: finalClientId,
        images: imagesForApi,
        building_types_images: buildingTypesImagesForApi,
        area: Number(formData.area),
        delivery_date: parseFloat(formData.delivery_date),
        latitude: latValue ? parseFloat(latValue) : null,
        longitude: lngValue ? parseFloat(lngValue) : null,
        location_landmark: landmarkValue || null,
        payment_plans: paymentPlansForApi,
        facility_management: facilityManagementForApi,
        orientation_url: formData.orientation_url?.trim() || null,
      };

      console.log("[handleSubmit] Client ID info:", {
        editMode,
        tokenClientId,
        propClientId: clientId,
        formClientId: formData.client_id,
        finalClientId,
        clientIdSource: editMode
          ? formData.client_id
            ? "existing_form"
            : tokenClientId
              ? "token_fallback"
              : "prop_fallback"
          : tokenClientId
            ? "token"
            : formData.client_id
              ? "form"
              : "prop",
        submissionDataKeys: Object.keys(submissionData),
      });

      console.log("[handleSubmit] Submission data prepared:", {
        editMode,
        projectId: projectData?.id,
        submissionDataKeys: Object.keys(submissionData),
        submissionDataSummary: {
          ar_name: submissionData.ar_name,
          en_name: submissionData.en_name,
          developer_id: submissionData.developer_id,
          developer_name: submissionData.developer_name,
          city: submissionData.city,
          district: submissionData.district,
          area: submissionData.area,
          delivery_date: submissionData.delivery_date,
          gated: submissionData.gated,
          is_active: submissionData.is_active,
          client_id: submissionData.client_id,
          imagesCount: submissionData.images?.length || 0,
          paymentPlansCount: submissionData.payment_plans?.length || 0,
          propertiesTypesCount: submissionData.properties_types?.length || 0,
        },
      });

      let res;
      if (editMode) {
        if (!projectData?.id) {
          console.error("[handleSubmit] Missing project ID for update:", {
            projectData: projectData,
            projectDataId: projectData?.id,
          });
          toast.error("Project ID is missing. Cannot update project.");
          setIsSubmitting(false);
          return;
        }
        console.log(
          "[handleSubmit] Calling updatecompound with ID:",
          projectData.id
        );
        res = await updateProject(submissionData, projectData.id);
      } else {
        console.log("[handleSubmit] Calling addCompound...");
        res = await addProject(submissionData);
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
        console.log(
          "[handleSubmit] Project already exists, showing preview dialog:",
          {
            existingProjectData: res.existing_project_data,
            existingProjectDataKeys: res.existing_project_data
              ? Object.keys(res.existing_project_data)
              : null,
          }
        );
        setExistingProjectData(res.existing_project_data);
        setPreviewDialogOpen(true);
        setIsSubmitting(false);
        return; // Don't show toast, just show preview
      }

      // Check for validation errors from API
      if (res?.statusCode === 400 && res?.validation_errors) {
        console.log(
          "[handleSubmit] Found validation errors in response:",
          res.validation_errors
        );
        // Convert translation keys to actual error messages
        const validationErrors = {};
        Object.keys(res.validation_errors).forEach((fieldName) => {
          const translationKey = res.validation_errors[fieldName];
          // Check if it's a translation key (string without spaces or with camelCase)
          if (translationKey && /^[a-z][a-zA-Z0-9]*$/.test(translationKey)) {
            validationErrors[fieldName] =
              t.formValidation?.[translationKey] || translationKey;
          } else {
            // It's already a message, use it as-is
            validationErrors[fieldName] = translationKey;
          }
        });
        setErrors(validationErrors);
        setIsSubmitting(false);
        // Scroll to first error and animate it
        setTimeout(() => {
          scrollToFirstError(validationErrors);
        }, 100);
        return; // Don't show generic toast
      }

      // Also check if res itself has existing_project_data (in case statusCode wasn't set)
      if (res?.existing_project_data && (res?.error || res?.error_message)) {
        console.log(
          "[handleSubmit] Found existing_project_data in response (without statusCode), showing preview:",
          {
            existingProjectData: res.existing_project_data,
          }
        );
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
      const hasDataObject = res?.data && typeof res.data === "object";
      const hasDirectData =
        res?.id || (res && !hasError && typeof res === "object" && !res.status);

      if (hasError) {
        const errorMessage =
          res?.error ||
          res?.error_message ||
          res?.message ||
          "An error occurred while processing your request.";

        // Check for validation errors in the error message
        const validationErrorKeys = parseValidationErrors(errorMessage);
        if (Object.keys(validationErrorKeys).length > 0) {
          console.log(
            "[handleSubmit] Found validation errors in response:",
            validationErrorKeys
          );
          // Convert translation keys to actual error messages
          const validationErrors = {};
          Object.keys(validationErrorKeys).forEach((fieldName) => {
            const translationKey = validationErrorKeys[fieldName];
            // Check if it's a translation key (string without spaces or with camelCase)
            if (translationKey && /^[a-z][a-zA-Z0-9]*$/.test(translationKey)) {
              validationErrors[fieldName] =
                t.formValidation?.[translationKey] || translationKey;
            } else {
              // It's already a message, use it as-is
              validationErrors[fieldName] = translationKey;
            }
          });
          setErrors(validationErrors);
          setIsSubmitting(false);
          // Scroll to first error and animate it
          setTimeout(() => {
            scrollToFirstError(validationErrors);
          }, 100);
          return; // Don't show generic toast
        }

        console.error(
          "[handleSubmit] Update failed with error (no preview available):",
          {
            errorMessage,
            fullResponse: res,
            statusCode: res?.statusCode,
          }
        );
        toast.error(errorMessage);
        setIsSubmitting(false);
        return;
      } else if (hasSuccessStatus || hasDataObject || hasDirectData) {
        // Success - extract the data
        const projectData = res?.data || res;
        console.log(
          "[handleSubmit] Update successful, calling onAdd with:",
          projectData
        );
        onAdd(projectData);

        // Invalidate projects query cache to refetch from API
        queryClient.invalidateQueries({ queryKey: projectKeys.all });

        setIsDirty(false);
        toast.success(
          editMode
            ? t.projectUpdated || "project updated successfully!"
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
      // Ensure client_id is set from token when resetting form
      const resetClientId = getClientid() || clientId || "";
      setFormData({
        ar_name: "",
        en_name: "",
        description: "",
        developer_id: "",
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
        client_id: resetClientId,
        properties_types: [],
        payment_plans: [],
        building_types_images: {},
        finishing_type: [],
        facility_management: null,
        orientation_url: "",
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
        // First check for existing project data
        const existingProjectData = parseExistingProjectData(
          errorResponseData.error_message
        );
        if (existingProjectData) {
          console.log(
            "[handleSubmit] Found existing_project_data in exception, showing preview:",
            {
              existingProjectData,
            }
          );
          setExistingProjectData(existingProjectData);
          setPreviewDialogOpen(true);
          setIsSubmitting(false);
          return; // Don't show toast
        }

        // Check for validation errors
        const validationErrorKeys = parseValidationErrors(
          errorResponseData.error_message
        );
        if (Object.keys(validationErrorKeys).length > 0) {
          console.log(
            "[handleSubmit] Found validation errors:",
            validationErrorKeys
          );
          // Convert translation keys to actual error messages
          const validationErrors = {};
          Object.keys(validationErrorKeys).forEach((fieldName) => {
            const translationKey = validationErrorKeys[fieldName];
            // Check if it's a translation key (string without spaces or with camelCase)
            if (translationKey && /^[a-z][a-zA-Z0-9]*$/.test(translationKey)) {
              validationErrors[fieldName] =
                t.formValidation?.[translationKey] || translationKey;
            } else {
              // It's already a message, use it as-is
              validationErrors[fieldName] = translationKey;
            }
          });
          setErrors(validationErrors);
          setIsSubmitting(false);
          // Scroll to first error and animate it
          setTimeout(() => {
            scrollToFirstError(validationErrors);
          }, 100);
          return; // Don't show generic toast
        }
      }

      // If we have error response data with error_message, try to parse it
      if (error.response?.data?.error_message) {
        const validationErrorKeys = parseValidationErrors(
          error.response.data.error_message
        );
        if (Object.keys(validationErrorKeys).length > 0) {
          console.log(
            "[handleSubmit] Found validation errors in error_message:",
            validationErrorKeys
          );
          // Convert translation keys to actual error messages
          const validationErrors = {};
          Object.keys(validationErrorKeys).forEach((fieldName) => {
            const translationKey = validationErrorKeys[fieldName];
            // Check if it's a translation key (string without spaces or with camelCase)
            if (translationKey && /^[a-z][a-zA-Z0-9]*$/.test(translationKey)) {
              validationErrors[fieldName] =
                t.formValidation?.[translationKey] || translationKey;
            } else {
              // It's already a message, use it as-is
              validationErrors[fieldName] = translationKey;
            }
          });
          setErrors(validationErrors);
          setIsSubmitting(false);
          // Scroll to first error and animate it
          setTimeout(() => {
            scrollToFirstError(validationErrors);
          }, 100);
          return;
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
      isSubmittingRef.current = false;
      console.log("[handleSubmit] Form submission completed");
    }
  }, [
    editMode,
    projectData,
    formData,
    developers,
    clientId,
    t,
    locale,
    onAdd,
    onClose,
    queryClient,
    GOOGLE_MAPS_REQUIRED_PREFIX,
    validateForm,
    isSubmitting
  ]);

  const handleClose = useCallback(() => {
    if (isDirty) {
      const message =
        locale === "ar"
          ? "لديك تغييرات غير محفوظة. هل أنت متأكد من الإغلاق؟"
          : "You have unsaved changes. Are you sure you want to close?";
      if (!window.confirm(message)) return;
    }
    onClose();
  }, [isDirty, onClose, locale]);

  const handleAddDeveloper = (newDeveloper) => {
    setDevelopers([...developers, newDeveloper]);

    setFormData((prev) => {
      return {
        ...prev,
        developer_id: newDeveloper.id,
        developer_name: newDeveloper.en_name || "",
      };
    });
  };

  const handlePaymentPlansChange = (newPlans) => {
    setIsDirty(true);
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
    setIsDirty(true);
    setFormData((prev) => ({
      ...prev,
      building_types_images: {
        ...prev.building_types_images,
        [propertyType]: images,
      },
    }));

    // Clear error for this building type when user uploads images
    setErrors((prev) => {
      if (
        !prev?.building_types_images ||
        !prev.building_types_images[propertyType]
      ) {
        return prev;
      }

      const nextTypeErrors = { ...prev.building_types_images };
      delete nextTypeErrors[propertyType];

      return {
        ...prev,
        building_types_images:
          Object.keys(nextTypeErrors).length > 0 ? nextTypeErrors : null,
      };
    });
  };

  const getPropertyTypeLabel = (value) => {
    const type = BUILDING_TYPES.find((type) => type.value === value);
    return type ? (locale === "ar" ? type.ar_label : type.en_label) : value;
  };

  return (
    <>
      <Dialog
        isOpen={isOpen}
        onClose={handleClose}
        closeOnOutsideClick={false}
        closeOnEscape={false}
        showCloseButton={false}
        headerLeading={
          <button
            type="button"
            onClick={handleClose}
            className="px-3 py-1.5 rounded-md border border-white/30 bg-white/10 text-white hover:bg-white/15 text-sm disabled:opacity-70 disabled:pointer-events-none"
            disabled={isSubmitting}
          >
            {t.buttons?.cancel || "Cancel"}
          </button>
        }
        headerActions={
          <div className="flex items-center gap-2">
            {isDirty && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-400/20 border border-yellow-400/40 text-yellow-200 text-xs rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse inline-block" />
                {locale === "ar" ? "تغييرات غير محفوظة" : "Unsaved changes"}
              </span>
            )}
            <button
              type="submit"
              form="add-project-form"
              disabled={isSubmitting || isUploading || isMasterPlanUploading}
              className="px-3 py-1.5 rounded-md bg-white text-primary hover:bg-white/90 text-sm disabled:opacity-70 disabled:cursor-not-allowed relative"
              style={{
                minWidth: '120px',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  {editMode ? t.updating : t.buttons?.saving || "Saving..."}
                </span>
              ) : editMode ? (
                t.updateProject || "Update Project"
              ) : (
                t.buttons?.saveProject || "Save Project"
              )}
            </button>
          </div>
        }
        title={
          editMode
            ? t.updateProject
            : t.modal?.addNewProject || "Add New Project"
        }
      >
        <form id="add-project-form" onSubmit={handleSubmit} className="contents">
          <div className="space-y-2">
            {errors.submit && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {errors.submit}
              </div>
            )}
            {/* Basic Information */}
            <div
              className="grid grid-cols-1 gap-2"
              ref={(el) => (fieldRefs.current.ar_name = el)}
            >
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
            <div ref={(el) => (fieldRefs.current.description = el)}>
              <LenaTextarea
                label={
                  <>
                    {t.formLabels?.description || "Description"}{" "}
                    <span className="text-xs text-gray-500 ml-2">
                      ({formData.description.length}/30-1200)
                    </span>
                  </>
                }
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={5}
                placeholder={t.placeholders.projectDescription}
                error={errors.description}
                errorMessage={errors.description}
              />
            </div>

            {/* Gated Community, Sold Out Checkboxes, and Finishing Type */}
            <div className="flex items-center gap-6 flex-wrap">
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
              <div
                ref={(el) => (fieldRefs.current.finishing_type = el)}
                className="flex items-center gap-2 flex-1 min-w-[200px]"
              >
                <label
                  htmlFor="finishing_type"
                  className={`text-sm font-medium whitespace-nowrap ${
                    errors.finishing_type ? "text-red-500" : "text-gray-700"
                  }`}
                >
                  {t.formLabels?.finishingType ||
                    t.finishingType ||
                    "Finishing Type"}
                  <span className="text-red-500">*</span>
                </label>
                <div className="flex-1">
                  <FormMultiSelect
                    name="finishing_type"
                    placeholder={
                      locale === "ar"
                        ? "اختر نوع التشطيب"
                        : "Select finishing type"
                    }
                    value={formData.finishing_type}
                    onChange={handleChange}
                    options={FINISHING_TYPES}
                    locale={locale}
                    required={true}
                    error={errors.finishing_type}
                    errorMessage={errors.finishing_type}
                  />
                </div>
              </div>
            </div>

            {/* Location - City and District on same line */}
            <div className="grid grid-cols-2 gap-4">
              <div ref={(el) => (fieldRefs.current.city = el)}>
                <CitySelect
                  value={formData.city}
                  onChange={handleChange}
                  error={errors.city}
                  required
                />
              </div>

              <div ref={(el) => (fieldRefs.current.district = el)}>
                <SearchableDropdownSelect
                  name="district"
                  label={t.formLabels?.district || "District"}
                  value={formData.district}
                  onChange={handleChange}
                  required
                  error={!!errors.district}
                  errorMessage={errors.district}
                  disabled={!formData.city}
                  isLoading={isLoadingDistricts}
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
            </div>

            {/* Hidden country field - always set to Egypt */}
            <input type="hidden" name="country" value="Egypt" />

            {/* Delivery and Area on same line */}
            <div className="grid grid-cols-2 gap-4">
              <div ref={(el) => (fieldRefs.current.delivery_date = el)}>
                <LenaTextField
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
                  errorMessage={errors.delivery_date}
                />
              </div>

              <div ref={(el) => (fieldRefs.current.area = el)}>
                <LenaTextField
                  type="number"
                  name="area"
                  label={t.formLabels?.area || "Area (fdan)"}
                  value={formData.area}
                  onChange={handleChange}
                  required
                  placeholder="1000"
                  min="0.0"
                  step="0.01"
                  error={errors.area}
                  errorMessage={errors.area}
                />
              </div>

            {/* Location Fields */}
            <div className="grid grid-cols-1 gap-4">
              <div ref={(el) => (fieldRefs.current.latitude = el)}>
                <LenaTextField
                  type="number"
                  name="latitude"
                  label="Latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                  required
                  placeholder="30.0444"
                  step="any"
                  error={errors.latitude}
                  errorMessage={errors.latitude}
                />
              </div>
              
              <div ref={(el) => (fieldRefs.current.longitude = el)}>
                <LenaTextField
                  type="number"
                  name="longitude"
                  label="Longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                  required
                  placeholder="31.2357"
                  step="any"
                  error={errors.longitude}
                  errorMessage={errors.longitude}
                />
              </div>
              
              <div ref={(el) => (fieldRefs.current.location_landmark = el)}>
                <LenaTextarea
                  name="location_landmark"
                  label="Location Landmark"
                  value={formData.location_landmark}
                  onChange={handleChange}
                  required
                  rows={3}
                  placeholder="Nearby landmarks, famous places, or reference points..."
                  error={errors.location_landmark}
                  errorMessage={errors.location_landmark}
                />
              </div>
            </div>
            </div>

            {/* Payment Plans */}
            <div ref={(el) => (fieldRefs.current.payment_plans = el)}>
              <PaymentPlansList
                plans={formData.payment_plans}
                onChange={handlePaymentPlansChange}
                error={errors.payment_plans}
                required={true}
              />
            </div>

            {/* Developer */}
            <div
              className="relative"
              ref={(el) => (fieldRefs.current.developer_id = el)}
            >
              <div className="flex justify-between items-center mb-1">
                <label
                  className={`block text-sm font-medium ${
                    errors.developer_id ? "text-red-500" : "text-gray-700"
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
                name="developer_id"
                value={formData.developer_id}
                onChange={handleChange}
                required
                error={!!errors.developer_id}
                errorMessage={
                  typeof errors.developer_id === "string"
                    ? errors.developer_id
                    : ""
                }
                placeholder={
                  t.formLabels?.selectDeveloper || "Select developer"
                }
                options={developers || []}
                getValue={(developer) => developer.id || ""}
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
            <div ref={(el) => (fieldRefs.current.video_url = el)}>
              <LenaTextField
                type="url"
                name="video_url"
                label={t.formLabels?.videoURL || "Video URL"}
                value={formData.video_url}
                onChange={handleChange}
                placeholder="https://example.com/video"
                required
                error={errors.video_url}
                errorMessage={errors.video_url}
              />
            </div>
            <div ref={(el) => (fieldRefs.current.google_map_link = el)}>
              <LenaTextField
                type="url"
                name="google_map_link"
                label={t.formLabels?.googleMapsLink || "Google Maps Link"}
                value={formData.google_map_link}
                onChange={handleChange}
                placeholder="https://maps.app.goo.gl/..."
                required
                error={errors.google_map_link}
                errorMessage={errors.google_map_link}
              />
            </div>

            {/* Master Plan Image - Now mandatory */}
            <div ref={(el) => (fieldRefs.current.master_plan = el)}>
              {console.log(formData?.master_plan)}
              <SingleImageUploader
                label={t.formLabels.masterPlanImage || "Master Plan Image"}
                value={formData.master_plan.url || null}
                imageId={formData.master_plan.fileId || null}
                onChange={(url, id) => {
                  setIsDirty(true);
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
            </div>

            {/* Property Types */}
            <div ref={(el) => (fieldRefs.current.properties_types = el)}>
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
            </div>

            {/* Building Types Images */}
            {formData.properties_types &&
              formData.properties_types.length > 0 && (
                <div
                  className="space-y-4"
                  ref={(el) => (fieldRefs.current.building_types_images = el)}
                >
                  {formData.properties_types.map((propertyType) => (
                    <div key={propertyType}>
                      <label
                        className={`block text-sm font-medium mb-1 ${
                          errors.building_types_images?.[propertyType]
                            ? "text-red-600"
                            : "text-gray-700"
                        }`}
                      >
                        {getPropertyTypeLabel(propertyType)}
                        <span className="text-xs font-normal text-gray-500 ml-2">
                          (
                          {
                            (formData.building_types_images[propertyType] || [])
                              .length
                          }{" "}
                          / 4)
                        </span>
                      </label>
                      {errors.building_types_images?.[propertyType] && (
                        <p className="text-xs text-red-600 mb-2">
                          {errors.building_types_images[propertyType]}
                        </p>
                      )}
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

            {/* Orientation URL */}
            <div>
              <LenaTextField
                type="url"
                name="orientation_url"
                label={t.formLabels?.orientationUrl || "Orientation Video URL"}
                value={formData.orientation_url}
                onChange={handleChange}
                placeholder="https://example.com/orientation-image.jpg"
              />
            </div>

            {/* Facility Management */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                  {t.formLabels?.facilityManagement || "Facility Management"}
                </label>
                {formData.facility_management ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsDirty(true);
                      setFormData((prev) => ({
                        ...prev,
                        facility_management: null,
                      }));
                    }}
                    className="text-red-500 text-sm hover:text-red-600"
                  >
                    {t.buttons?.remove || "Remove"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsDirty(true);
                      setFormData((prev) => ({
                        ...prev,
                        facility_management: { name: "", description: "", rating: "" },
                      }));
                    }}
                    className="text-blue-600 text-sm hover:text-blue-700"
                  >
                    + {t.buttons?.addNew || "Add"}
                  </button>
                )}
              </div>
              {formData.facility_management && (
                <div className="space-y-2 p-3 border border-gray-200 rounded-md">
                  <LenaTextField
                    type="text"
                    name="facility_management_name"
                    label={t.formLabels?.facilityManagementName || "Company Name"}
                    value={formData.facility_management.name}
                    onChange={(e) => {
                      setIsDirty(true);
                      setFormData((prev) => ({
                        ...prev,
                        facility_management: {
                          ...prev.facility_management,
                          name: e.target.value,
                        },
                      }));
                    }}
                    placeholder="Elite Facility Management"
                    required
                  />
                  <LenaTextarea
                    name="facility_management_description"
                    label={t.formLabels?.facilityManagementDescription || "Description"}
                    value={formData.facility_management.description}
                    onChange={(e) => {
                      setIsDirty(true);
                      setFormData((prev) => ({
                        ...prev,
                        facility_management: {
                          ...prev.facility_management,
                          description: e.target.value,
                        },
                      }));
                    }}
                    rows={3}
                    placeholder="Describe facility management services..."
                  />
                  <LenaTextField
                    type="number"
                    name="facility_management_rating"
                    label={t.formLabels?.facilityManagementRating || "Rating (0–5)"}
                    value={formData.facility_management.rating}
                    onChange={(e) => {
                      setIsDirty(true);
                      setFormData((prev) => ({
                        ...prev,
                        facility_management: {
                          ...prev.facility_management,
                          rating: e.target.value,
                        },
                      }));
                    }}
                    placeholder="4.5"
                    min="0"
                    max="5"
                    step="0.1"
                  />
                </div>
              )}
            </div>

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
                initialImages={formData.images || []}
                onImagesChange={(images) => {
                  setIsDirty(true);
                  setFormData((prev) => ({ ...prev, images }));
                }}
                isUploading={isUploading}
                setIsUploading={setIsUploading}
              />
            </div>
          </div>
        </form>
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
