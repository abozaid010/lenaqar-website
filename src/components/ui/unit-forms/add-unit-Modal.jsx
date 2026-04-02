"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";

import BasicDetailsStep from "@/components/ui/unit-forms/basic-details-step";
import ImagesStep from "@/components/ui/unit-forms/images-step";
import RentalDetailsStep from "@/components/ui/unit-forms/rental-details-step";
import SaleDetailsStep from "@/components/ui/unit-forms/sale-details-step";
import StepIndicator from "./step-indicator";

import { useI18n } from "@/context/translate-api";
import { useAdminSharedData } from "@/hooks/use-admin-shared-data";
import { addYears, isAfter, isBefore, subYears } from "date-fns";
import { LenaCookiesManager } from "@/lib/LenaCookiesManager";
import { ArrowLeft, ArrowRight } from "lucide-react";
import UnifiedDialog from "@/components/ui/UnifiedDialog";
import toast from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";

import { useAddUnit, useUpdateUnit } from "@/hooks/use-unit-mutations";
import { extractUnitsFromText, getClientid } from "@/utils/api";
import { UnitTextExtractor } from "@/utils/unit-text-extractor";
import FillFromTextDialog from "@/components/ui/unit-forms/FillFromTextDialog";

/** Parse value to number for API (strip commas/formatting). */
function toAmount(value) {
  if (value === "" || value === null || value === undefined) return 0;
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  const stripped = String(value).replace(/[^\d.]/g, "");
  const n = parseFloat(stripped);
  return Number.isNaN(n) ? 0 : n;
}

/** Clean source text for extra_info: normalize newlines, trim lines, drop empty. */
function cleanExtraInfo(text) {
  if (text == null || typeof text !== "string") return "";
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n")
    .trim();
}

/** Ensure all price/amount fields in form data are sent as numbers to the API. */
function sanitizeAmountsForApi(data) {
  const out = { ...data };
  const sellAmountFields = [
    "totalPrice",
    "downPayment",
    "paid_amount",
    "remaining_amount",
    "over_price",
  ];
  sellAmountFields.forEach((field) => {
    if (field in out && (out[field] !== "" || out[field] != null)) {
      out[field] = toAmount(out[field]);
    }
  });
  if (out.installment_years !== "" && out.installment_years != null) {
    out.installment_years = Math.floor(toAmount(out.installment_years)) || 0;
  }
  if (out.purpose === "rent" && out.rentDurationType && typeof out.rentDurationType === "object") {
    out.rentDurationType = { ...out.rentDurationType };
    Object.keys(out.rentDurationType).forEach((duration) => {
      const block = out.rentDurationType[duration];
      if (block && typeof block === "object" && "price" in block) {
        out.rentDurationType[duration] = {
          ...block,
          price: toAmount(block.price),
        };
      }
    });
  }
  return out;
}

export default function AddUnitModal({ isEdit, unitData, onClose, onUnitsExtracted }) {
  // Temp: fallback to client ID from access token when unit/cookie is missing clientId
  const clientId =
    LenaCookiesManager.getClientId() || getClientid() || null;

  if (!clientId) {
    return (
      <>
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3">
          <div className="bg-white rounded-md shadow-xl p-6 max-w-md w-full relative">

            <h2 className="text-lg font-semibold pr-8">Client ID not found</h2>
            <p className="text-gray-600 mt-2 mb-4">Please ensure you are logged in with a valid client.</p>
            <button
              type="button"
              onClick={onClose}
              className="w-full px-4 py-2 bg-primary text-white rounded-md hover:opacity-90 transition-opacity"
            >
              Close
            </button>
          </div>
        </div>
      </>
    );
  }

  const clientInfo = LenaCookiesManager.getClientInfo();
  const clientName = clientInfo?.client_name;
  const clientType = clientInfo?.client_type;

  // Add the mutation hooks
  const addUnitMutation = useAddUnit();
  const updateUnitMutation = useUpdateUnit();

  const sharedData = useAdminSharedData();

  const modalRef = useRef(null);
  const { t, locale } = useI18n();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  // Track over all upload statecl
  const [isUploading, setIsUploading] = useState(false);
  const [invalidFields, setInvalidFields] = useState([]); // New state for invalid fields
  const [showFillFromTextDialog, setShowFillFromTextDialog] = useState(false);
  const [extractingFromText, setExtractingFromText] = useState(false);
  const [useLocalExtractor, setUseLocalExtractor] = useState(true);
  const [extractedSourceText, setExtractedSourceText] = useState(() =>
    unitData?.extra_info != null ? String(unitData.extra_info).trim() : ""
  );
  // common form data for both sell and rent
  const [formData, setFormData] = useState(() => ({
    clientId: unitData?.clientId || clientId,
    clientName: unitData?.clientName || clientName,
    country: unitData?.country || "Egypt",
    dataSource: unitData?.dataSource || "website",
    buildingType: unitData?.buildingType || "apartment",
    purpose: unitData?.purpose || "",
    project: unitData?.project || "",
    project_ar: unitData?.project_ar || "",
    project_id: unitData?.project_id || unitData?.projectId || "",
    view: unitData?.view || "",
    phase: unitData?.phase || "",
    city: unitData?.city || "",
    district: unitData?.district || "",
    developer: unitData?.developer || "",
    developer_id: unitData?.developer_id || unitData?.developerId || "",
    unitId: unitData?.unitId || uuidv4(),
    unitTitle: unitData?.unitTitle || "",
    deliveryStatus: unitData?.deliveryStatus || "",
    bathroomCount: unitData?.bathroomCount || "",
    floor: unitData?.floor || "",
    roomsCount: unitData?.roomsCount || "",
    landArea: unitData?.landArea || "",
    gardenSize: unitData?.gardenSize || "",
    finishing: unitData?.finishing || "",
    furnishing: unitData?.furnishing || "",
    outdoor_area: unitData?.outdoor_area || "",
    images: unitData?.images || [],
    code: unitData?.code || "",
    model: unitData?.model || "",
    // Owner details (shown only for brokers)
    owner_name: unitData?.owner_name || "",
    owner_mobile: unitData?.owner_mobile || "",
  }));

  // specific sell form data
  const [SellFormData, setSellFormData] = useState(() => ({
    totalPrice: unitData?.totalPrice || "",
    downPayment: unitData?.downPayment || "",
    deliveryDate: unitData?.deliveryDate
      ? new Date(unitData.deliveryDate).toISOString().split("T")[0]
      : "",
    paid_amount: unitData?.paid_amount || "",
    remaining_amount: unitData?.remaining_amount || "",
    installment_years: unitData?.installment_years || "",
    over_price: unitData?.over_price || "",
  }));

  // specific rent form data
  const [rentFormData, setRentFormData] = useState(() => ({
    isAvailable: true,
    availabilityDate: unitData?.availabilityDate
      ? new Date(unitData.availabilityDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    rentDurationType: unitData?.rentDurationType || {
      daily: {
        price: "",
        securityDeposit: "",
        cleaningFee: "",
        serviceFee: "",
        currency: "EGP",
      },
      weekly: {
        price: "",
        securityDeposit: "",
        cleaningFee: "",
        serviceFee: "",
        currency: "EGP",
      },
      monthly: {
        price: "",
        securityDeposit: "",
        cleaningFee: "",
        serviceFee: "",
        currency: "EGP",
      },
    },
    amenities: unitData?.amenities || [],
  }));

  const updateFormData = (newData) => {
    setFormData((prev) => ({ ...prev, ...newData }));
  };

  /** Build unit title from area, bedroom, type, project when extracting from text */
  const buildTitleFromExtracted = (apiUnit) => {
    const parts = [
      apiUnit.project != null ? String(apiUnit.project).trim() : null,
      apiUnit.buildingType != null ? String(apiUnit.buildingType).trim() : null,
      apiUnit.roomsCount != null ? `${apiUnit.roomsCount} bed` : null,
      apiUnit.landArea != null ? `${apiUnit.landArea} m²` : null,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(" · ") : null;
  };

  /** Map API extracted unit to formData + SellFormData/rentFormData */
  const mapApiUnitToForm = (apiUnit) => {
    const purpose =
      apiUnit.purpose != null
        ? String(apiUnit.purpose)
        : apiUnit.totalPrice != null
          ? "sell"
          : undefined;
    const builtTitle = buildTitleFromExtracted(apiUnit);
    const formDataPartial = {
      ...(apiUnit.country != null && { country: String(apiUnit.country) }),
      ...(apiUnit.city != null && { city: String(apiUnit.city) }),
      ...(apiUnit.district != null && { district: String(apiUnit.district) }),
      ...(apiUnit.project != null && { project: String(apiUnit.project) }),
      ...(apiUnit.project_id != null && { project_id: String(apiUnit.project_id) }),
      ...(apiUnit.projectId != null && { project_id: String(apiUnit.projectId) }),
      ...(apiUnit.developer != null && { developer: String(apiUnit.developer) }),
      ...(apiUnit.developer_id != null && { developer_id: String(apiUnit.developer_id) }),
      ...(apiUnit.developerId != null && { developer_id: String(apiUnit.developerId) }),
      ...(builtTitle != null && { unitTitle: builtTitle }),
      ...(builtTitle == null && apiUnit.unitTitle != null && { unitTitle: String(apiUnit.unitTitle) }),
      ...(apiUnit.bathroomCount != null && { bathroomCount: apiUnit.bathroomCount }),
      ...(apiUnit.roomsCount != null && { roomsCount: apiUnit.roomsCount }),
      ...(apiUnit.buildingType != null && { buildingType: String(apiUnit.buildingType) }),
      ...(apiUnit.landArea != null && { landArea: apiUnit.landArea }),
      ...(apiUnit.gardenSize != null && { gardenSize: apiUnit.gardenSize }),
      ...(apiUnit.outdoor_area != null && { outdoor_area: apiUnit.outdoor_area }),
      ...(apiUnit.furnishing != null && { furnishing: String(apiUnit.furnishing) }),
      ...(apiUnit.finishing != null && { finishing: String(apiUnit.finishing) }),
      ...(apiUnit.view != null && { view: String(apiUnit.view) }),
      ...(apiUnit.floor != null && { floor: apiUnit.floor }),
      ...(purpose != null && { purpose }),
      ...(apiUnit.code != null && { code: String(apiUnit.code) }),
      ...(apiUnit.phase != null && { phase: String(apiUnit.phase) }),
      ...(apiUnit.model != null && { model: String(apiUnit.model) }),
      ...(apiUnit.owner_name != null && { owner_name: String(apiUnit.owner_name) }),
      ...(apiUnit.owner_mobile != null && { owner_mobile: String(apiUnit.owner_mobile) }),
      ...(apiUnit.deliveryStatus != null && { deliveryStatus: String(apiUnit.deliveryStatus) }),
      ...(apiUnit.unitId != null && { unitId: apiUnit.unitId }),
      ...(apiUnit.clientId != null && { clientId: apiUnit.clientId }),
      ...(apiUnit.clientName != null && { clientName: apiUnit.clientName }),
      ...(apiUnit.dataSource != null && { dataSource: apiUnit.dataSource }),
      ...(apiUnit.images != null && Array.isArray(apiUnit.images) && { images: apiUnit.images }),
    };
    const sellPartial = {};
    if ((purpose === "sell" || apiUnit.totalPrice != null) && apiUnit.totalPrice != null) {
      sellPartial.totalPrice = apiUnit.totalPrice;
    }
    if (apiUnit.downPayment != null) sellPartial.downPayment = apiUnit.downPayment;
    if (apiUnit.remaining_amount != null) sellPartial.remaining_amount = apiUnit.remaining_amount;
    if (apiUnit.deliveryDate != null) sellPartial.deliveryDate = apiUnit.deliveryDate;
    if (apiUnit.installment_years != null) sellPartial.installment_years = apiUnit.installment_years;
    if (apiUnit.over_price != null) sellPartial.over_price = apiUnit.over_price;
    return { formDataPartial, sellPartial };
  };

  const applyExtractedUnit = (unit, sourceText) => {
    const { formDataPartial, sellPartial } = mapApiUnitToForm(unit);
    setFormData((prev) => ({ ...prev, ...formDataPartial }));
    if (Object.keys(sellPartial).length) {
      setSellFormData((prev) => ({ ...prev, ...sellPartial }));
    }
    if (sourceText) setExtractedSourceText(sourceText);
    setCurrentStep(1);
    toast.success(t.modal?.fillFromText?.extractButton || "Fields filled.");
  };

  /** @param {React.BaseSyntheticEvent} [e] @param {string} [textOverride] @returns {Promise<boolean>} success */
  const handleExtractFromText = async (e, textOverride) => {
    e?.preventDefault?.();
    const text = (textOverride ?? "").trim();
    if (!text) {
      toast.error(t.modal?.fillFromText?.noUnitsFound || "Please paste some text.");
      return false;
    }
    setExtractingFromText(true);
    try {
      if (useLocalExtractor) {
        const extracted = UnitTextExtractor.extractFlat(text);
        if (extracted && Object.keys(extracted).length > 0) {
          applyExtractedUnit(extracted, text);
          return true;
        }
        // Zero extracted keys — fallback to API
      }

      const res = await extractUnitsFromText(text);
      if (!res?.status) {
        toast.error(
          res?.error_message || "Failed to extract"
        );
        return false;
      }
      const data = res?.data ?? {};
      const singleExtracted = data.extracted_data;
      if (singleExtracted != null && typeof singleExtracted === "object") {
        applyExtractedUnit(singleExtracted, text);
        return true;
      }
      const units = data.extracted_units;
      if (!Array.isArray(units) || units.length === 0) {
        toast.error(
          res?.error_message || " Array Failed to extract"
        );
        return false;
      }
      if (units.length === 1) {
        applyExtractedUnit(units[0], text);
        return true;
      }
      onClose();
      if (typeof onUnitsExtracted === "function") {
        onUnitsExtracted(units);
      }
      return true;
    } catch (err) {
      console.error("[ExtractFromText] extraction failed:", err);
      toast.error("Exception: Failed to extract");
      return false;
    } finally {
      setExtractingFromText(false);
    }
  };

  const validateDeliveryDate = (dateString) => {
    if (!dateString) return false;

    const deliveryDate = new Date(dateString);
    const currentDate = new Date();

    // Check if date is valid
    if (isNaN(deliveryDate.getTime())) return false;

    // Calculate date ranges
    const minDate = subYears(currentDate, 30);
    const maxDate = addYears(currentDate, 10);

    // Check if delivery date is within valid range
    return !isBefore(deliveryDate, minDate) && !isAfter(deliveryDate, maxDate);
  };

  const handleNext = (e) => {
    e.preventDefault();
    // Validate required fields for step 1
    if (currentStep === 1) {
      const requiredFields = [
        "project",
        "buildingType",
        "purpose",
        "landArea", // area
      ];
      // Add rooms and bathroom count only if building type is not office
      if (formData.buildingType !== "office") {
        requiredFields.push("roomsCount", "bathroomCount");
      }
      const zeroFields = [
        "floor",
        "landArea",
        "gardenSize",
        "outdoor_area",
        "roomsCount",
        "bathroomCount",
      ];
      const sanitizedData = { ...formData };

      // INFO: This is a workaround to ensure that the zero fields are set to 0 if they are empty or undefined
      zeroFields.forEach((field) => {
        if (!sanitizedData[field] || sanitizedData[field] === "") {
          sanitizedData[field] = 0;
        }
      });

      setFormData(sanitizedData);

      // 0 is valid for numeric fields (landArea, roomsCount, bathroomCount)
      const missingFields = requiredFields.filter(
        (field) => formData[field] !== 0 && !formData[field]
      );

      if (missingFields.length > 0) {
        setInvalidFields(missingFields);
        return;
      }
    }

    // Validate required fields for step 2
    if (currentStep === 2) {
      if (formData.purpose === "sell") {
        const requiredFields = ["deliveryDate", "totalPrice"]; // price
        // 0 is valid for totalPrice (edge case; downPayment etc. can be 0)
        const missingFields = requiredFields.filter(
          (field) => SellFormData[field] !== 0 && !SellFormData[field]
        );

        // Phone number (owner_mobile) is required
        if (!formData.owner_mobile || String(formData.owner_mobile).trim() === "") {
          missingFields.push("owner_mobile");
        }

        if (
          SellFormData.deliveryDate &&
          !validateDeliveryDate(SellFormData.deliveryDate)
        ) {
          missingFields.push("deliveryDate");
          toast.error(
            t.saleDetails.deleveryError ||
            "Delivery date must be between 30 years ago and 10 years from now",
            {
              duration: 5000,
            }
          );
        }

        // Validate payment plan fields
        if (SellFormData.installment_years && SellFormData.installment_years <= 0) {
          missingFields.push("installment_years");
        }

        if (missingFields.length > 0) {
          setInvalidFields(missingFields);
          return;
        }

        // INFO: This is a workaround to ensure that the zero fields are set to 0 if they are empty or undefined
        const zeroFields = ["totalPrice", "downPayment", "paid_amount", "remaining_amount", "installment_years", "over_price"];
        const sanitizedData = { ...SellFormData };
        zeroFields.forEach((field) => {
          if (!sanitizedData[field] || sanitizedData[field] === "") {
            sanitizedData[field] = 0;
          }
        });
      } else if (formData.purpose === "rent") {
        // Phone number (owner_mobile) is required
        if (!formData.owner_mobile || String(formData.owner_mobile).trim() === "") {
          setInvalidFields(["owner_mobile"]);
          return;
        }

        // Check if at least one rentDurationType has a price > 0
        const hasValidPrice = Object.values(rentFormData.rentDurationType).some(
          (duration) => duration.price > 0
        );

        if (!hasValidPrice) {
          toast.error(t.toasts.enterValidPrice);
          return;
        }

        // INFO: This is a workaround to ensure that the zero fields are set to 0 if they are empty or undefined
        const sanitizedRentDurationType = { ...rentFormData.rentDurationType };
        Object.keys(sanitizedRentDurationType).forEach((duration) => {
          Object.keys(sanitizedRentDurationType[duration]).forEach((field) => {
            if (sanitizedRentDurationType[duration][field] === "") {
              sanitizedRentDurationType[duration][field] = 0;
            }
          });
        });

        setRentFormData((prev) => ({
          ...prev,
          rentDurationType: sanitizedRentDurationType,
        }));
      }
    }

    setInvalidFields([]);
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate step 3 fields
    if (currentStep === 3) {
      // Images are optional; send empty array to API if none uploaded
      // Furnishing required only for rent; for sell only finishing (developer is optional)
      let requiredFields;
      if (formData.purpose === "sell") {
        requiredFields = ["finishing"];
      } else {
        requiredFields = ["finishing", "furnishing"];
      }
      const missingFields = requiredFields.filter((field) => !formData[field]);
      if (missingFields.length > 0) {
        setInvalidFields(missingFields);
        return;
      }
    }

    try {
      setLoading(true);
      let finalFormData = { ...formData };

      // Merge form data based on purpose
      if (formData.purpose === "sell") {
        finalFormData = { ...finalFormData, ...SellFormData };
      } else if (formData.purpose === "rent") {
        finalFormData = { ...finalFormData, ...rentFormData };
      }

      let payload = sanitizeAmountsForApi(finalFormData);
      const cleanedExtra = cleanExtraInfo(extractedSourceText);
      if (cleanedExtra) {
        payload = { ...payload, extra_info: cleanedExtra };
      }

      if (!isEdit) {
        await addUnitMutation.mutateAsync(payload);
        toast.success(t.toasts.unitAdded);
      } else {
        await updateUnitMutation.mutateAsync(payload);
        toast.success(t.toasts.unitUpdated);
      }

      setExtractedSourceText("");
      onClose();
    } catch (error) {
      toast.error(`${t.toasts.errorProcessing}: ${error.message}`);
    } finally {
      setInvalidFields([]);
      setLoading(false);
    }
  };

  const modalTitle = isEdit ? t.modal.editUnit : t.modal.addNewUnit;

  const handleClose = () => {
    setExtractedSourceText("");
    onClose();
  };

  // Add loading and error states to the modal
  if (sharedData.isSharedDataLoading) {
    return createPortal(
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3">
        <div className="bg-white rounded-md shadow-xl p-6 max-w-md w-full relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="flex items-center justify-center pr-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-lg">Loading form data...</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="mt-4 w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>,
      document.body
    );
  }

  if (sharedData.hasSharedDataErrors) {
    return createPortal(
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3">
        <div className="bg-white rounded-md shadow-xl p-6 max-w-md w-full">
          <h2 className="text-lg font-semibold text-red-600 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-4">{sharedData.sharedDataErrorMessage}</p>
          <div className="flex gap-2">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  const headerLeading =
    currentStep > 1 ? (
      <button
        type="button"
        onClick={handleBack}
        className="px-3 py-1.5 rounded-md border border-white/30 bg-white/10 text-white hover:bg-white/15 text-sm font-medium inline-flex items-center gap-2 disabled:opacity-70 disabled:pointer-events-none"
      >
        {locale === "ar" ? (
          <ArrowRight size={17} />
        ) : (
          <ArrowLeft size={17} />
        )}
        {t.buttons.back}
      </button>
    ) : undefined;

  const headerTrailing = (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setShowFillFromTextDialog(true)}
        className="px-3 py-1.5 rounded-md border border-white/30 bg-white/10 text-white hover:bg-white/15 text-sm font-medium disabled:opacity-70 disabled:pointer-events-none"
      >
        {t.modal?.fillFromText?.buttonLabel || "Fill from text"}
      </button>
      <button
        type="button"
        onClick={currentStep < 3 ? handleNext : handleSubmit}
        disabled={currentStep === 3 && (loading || isUploading)}
        className="px-3 py-1.5 rounded-md bg-white text-primary hover:bg-white/90 text-sm font-medium disabled:opacity-70 disabled:pointer-events-none inline-flex items-center justify-center gap-2"
      >
        {currentStep === 3 && (loading || isUploading) ? (
          <>
            <span className="inline-block w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            {currentStep < 3 ? t.buttons.next : t.buttons.saveUnit}
          </>
        ) : currentStep < 3 ? (
          t.buttons.next
        ) : (
          t.buttons.saveUnit
        )}
      </button>
    </div>
  );

  return createPortal(
    <>
      <UnifiedDialog
        isOpen={true}
        onClose={handleClose}
        title={modalTitle}
        cancelLabel={t.cancel}
        onCancel={handleClose}
        headerLeading={headerLeading}
        headerTrailing={headerTrailing}
        closeOnOutsideClick={false}
        closeOnEscape={false}
        bodyClassName="p-0"
      >
        {/* Step Indicator — right below header */}
        <div className="px-3 py-2 md:px-4 md:py-2 border-b border-gray-100">
          <StepIndicator
            currentStep={currentStep}
            onStepClick={(stepNumber) => setCurrentStep(stepNumber)}
            steps={[
              { number: 1, label: t.steps.basicDetails },
              {
                number: 2,
                label:
                  formData.purpose === "sell"
                    ? t.steps.financialDetails
                    : t.steps.rentalDetails,
              },
              { number: 3, label: t.steps.imagesInfo },
            ]}
          />
        </div>

        {/* Source text reference (when filled from text or editing unit with extra_info) */}
        {extractedSourceText && (
          <div className="px-2 pt-2 md:px-3 md:pt-2">
            <div className="rounded-lg border border-amber-200 bg-amber-50/90 p-2 shadow-sm">
              <div className="min-h-[120px] max-h-40 overflow-y-auto rounded border border-amber-200/80 bg-white/80 px-2 py-1.5 text-xs text-gray-700 whitespace-pre-wrap">
                {cleanExtraInfo(extractedSourceText)}
              </div>
            </div>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          ref={modalRef}
          className="mt-3 px-3 md:p-5 pb-5 overflow-y-auto max-h-[70vh]"
        >
          {currentStep === 1 && (
            <BasicDetailsStep
              clientId={clientId}
              formData={formData}
              updateFormData={updateFormData}
              invalidFields={invalidFields}
              setInvalidFields={setInvalidFields}
              developers={sharedData.developers?.data ?? []}
              developersLoading={sharedData.developers?.isLoading ?? false}
            />
          )}

          {currentStep === 2 && formData.purpose === "sell" && (
            <SaleDetailsStep
              formData={SellFormData}
              commonFormData={formData}
              clientType={clientType}
              updateFormData={(newData) =>
                setSellFormData((prev) => ({ ...prev, ...newData }))
              }
              updateCommonFormData={updateFormData}
              invalidFields={invalidFields}
              setInvalidFields={setInvalidFields}
            />
          )}

          {currentStep === 2 && formData.purpose === "rent" && (
            <RentalDetailsStep
              formData={rentFormData}
              commonFormData={formData}
              clientType={clientType}
              updateFormData={(newData) =>
                setRentFormData((prev) => ({ ...prev, ...newData }))
              }
              updateCommonFormData={updateFormData}
              invalidFields={invalidFields}
              setInvalidFields={setInvalidFields}
            />
          )}

          {currentStep === 3 && (
            <ImagesStep
              formData={formData}
              updateFormData={updateFormData}
              invalidFields={invalidFields}
              setInvalidFields={setInvalidFields}
              isUploading={isUploading}
              setIsUploading={setIsUploading}
            />
          )}
        </form>
      </UnifiedDialog>

      <FillFromTextDialog
        isOpen={showFillFromTextDialog}
        onClose={() => setShowFillFromTextDialog(false)}
        onExtract={(text) => handleExtractFromText(null, text)}
        extracting={extractingFromText}
        useLocalExtractor={useLocalExtractor}
        onUseLocalExtractorChange={setUseLocalExtractor}
        t={t}
      />
    </>,
    document.body
  );
}
