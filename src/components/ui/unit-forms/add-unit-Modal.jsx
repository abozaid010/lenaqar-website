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
import { extractUnitsFromText } from "@/utils/api";
import LenaTextarea from "@/components/ui/inputs/lena-textarea";

export default function AddUnitModal({ isEdit, unitData, onClose, onUnitsExtracted }) {
  const clientId = LenaCookiesManager.getClientId() || null;

  if (!clientId) {
    return (
      <>
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3">
          <div className="bg-white rounded-md shadow-xl p-6">
            <h2 className="text-lg font-semibold">Client ID not found</h2>
            <p>Please ensure you are logged in with a valid client.</p>
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
  const rowDevelopers = sharedData.developers.data || [];

  const modalRef = useRef(null);
  const { t, locale } = useI18n();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  // Track over all upload statecl
  const [isUploading, setIsUploading] = useState(false);
  const [invalidFields, setInvalidFields] = useState([]); // New state for invalid fields
  const [showFillFromTextPanel, setShowFillFromTextPanel] = useState(false);
  const [fillFromTextValue, setFillFromTextValue] = useState("");
  const [extractingFromText, setExtractingFromText] = useState(false);
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
    view: unitData?.view || "",
    phase: unitData?.phase || "",
    city: unitData?.city || "",
    district: unitData?.district || "",
    developer: unitData?.developer || "",
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
    garageArea: unitData?.garageArea || "",
    images: unitData?.images || [],
    code: unitData?.code || "",
    model: unitData?.model || "",
    // Owner details (shown only for brokers)
    owner_name: unitData?.owner_name || "",
    owner_mobile: unitData?.owner_mobile || "",
  }));

  // specific sell form data
  const [SellFormData, setSellFormData] = useState(() => ({
    downPayment: unitData?.downPayment || "",
    totalPrice: unitData?.totalPrice || "",
    deliveryDate: unitData?.deliveryDate
      ? new Date(unitData.deliveryDate).toISOString().split("T")[0]
      : "",
    paymentPlans: unitData?.paymentPlans || [],
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

  /** Map API extracted unit to formData + SellFormData/rentFormData */
  const mapApiUnitToForm = (apiUnit) => {
    const formDataPartial = {
      ...(apiUnit.project != null && { project: String(apiUnit.project) }),
      ...(apiUnit.developer != null && { developer: String(apiUnit.developer) }),
      ...(apiUnit.unitTitle != null && { unitTitle: String(apiUnit.unitTitle) }),
      ...(apiUnit.bathroomCount != null && { bathroomCount: apiUnit.bathroomCount }),
      ...(apiUnit.roomsCount != null && { roomsCount: apiUnit.roomsCount }),
      ...(apiUnit.buildingType != null && { buildingType: String(apiUnit.buildingType) }),
      ...(apiUnit.landArea != null && { landArea: apiUnit.landArea }),
      ...(apiUnit.gardenSize != null && { gardenSize: apiUnit.gardenSize }),
      ...(apiUnit.garageArea != null && { garageArea: apiUnit.garageArea }),
      ...(apiUnit.furnishing != null && { furnishing: String(apiUnit.furnishing) }),
      ...(apiUnit.view != null && { view: String(apiUnit.view) }),
      ...(apiUnit.purpose != null && { purpose: String(apiUnit.purpose) }),
      ...(apiUnit.code != null && { code: String(apiUnit.code) }),
      ...(apiUnit.unitId != null && { unitId: apiUnit.unitId }),
      ...(apiUnit.clientId != null && { clientId: apiUnit.clientId }),
      ...(apiUnit.clientName != null && { clientName: apiUnit.clientName }),
      ...(apiUnit.dataSource != null && { dataSource: apiUnit.dataSource }),
      ...(apiUnit.images != null && Array.isArray(apiUnit.images) && { images: apiUnit.images }),
    };
    const sellPartial =
      apiUnit.purpose === "sell" && apiUnit.totalPrice != null
        ? { totalPrice: apiUnit.totalPrice }
        : {};
    return { formDataPartial, sellPartial };
  };

  const handleExtractFromText = async (e) => {
    e?.preventDefault?.();
    const text = (fillFromTextValue || "").trim();
    if (!text) {
      toast.error(t.modal?.fillFromText?.noUnitsFound || "Please paste some text.");
      return;
    }
    setExtractingFromText(true);
    try {
      const res = await extractUnitsFromText(text);
      if (!res?.status || !res?.data?.extracted_units?.length) {
        toast.error(
          res?.error_message || t.modal?.fillFromText?.failedExtract || "Failed to extract"
        );
        return;
      }
      const units = res.data.extracted_units;
      if (units.length === 1) {
        const { formDataPartial, sellPartial } = mapApiUnitToForm(units[0]);
        setFormData((prev) => ({ ...prev, ...formDataPartial }));
        if (Object.keys(sellPartial).length) {
          setSellFormData((prev) => ({ ...prev, ...sellPartial }));
        }
        setShowFillFromTextPanel(false);
        setFillFromTextValue("");
        setCurrentStep(1);
        toast.success(t.modal?.fillFromText?.extractButton || "Fields filled.");
      } else {
        onClose();
        if (typeof onUnitsExtracted === "function") {
          onUnitsExtracted(units);
        }
      }
    } catch (err) {
      toast.error(t.modal?.fillFromText?.failedExtract || "Failed to extract");
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
        "unitTitle",
        "project",
        "buildingType",
        "purpose",
        "city",
        "view",
        "district",
      ];
      // Add rooms and bathroom count only if building type is not office
      if (formData.buildingType !== "office") {
        requiredFields.push("roomsCount", "bathroomCount");
      }
      const zeroFields = [
        "floor",
        "landArea",
        "gardenSize",
        "garageArea",
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

      const missingFields = requiredFields.filter((field) => !formData[field]);

      if (missingFields.length > 0) {
        setInvalidFields(missingFields);
        return;
      }
    }

    // Validate required fields for step 2
    if (currentStep === 2) {
      if (formData.purpose === "sell") {
        const requiredFields = ["totalPrice", "deliveryDate"];
        const missingFields = requiredFields.filter(
          (field) => !SellFormData[field]
        );

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

        // Validate paymentPlans
        if (Array.isArray(SellFormData.paymentPlans) && SellFormData.paymentPlans.length > 0) {
          SellFormData.paymentPlans.forEach((plan, index) => {
            if (plan.years === "" || plan.years === 0) {
              missingFields.push(`years-${index}`);
            }
            if (!plan.price || plan.price === 0) {
              missingFields.push(`price-${index}`);
            }
            if (!plan.downPayment || plan.downPayment === 0) {
              missingFields.push(`downPayment-${index}`);
            }
            if (
              !plan.installment_amount_yearly ||
              plan.installment_amount_yearly === 0
            ) {
              missingFields.push(`installment_amount_yearly-${index}`);
            }
          });
        }

        if (missingFields.length > 0) {
          setInvalidFields(missingFields);
          return;
        }

        // INFO: This is a workaround to ensure that the zero fields are set to 0 if they are empty or undefined
        const zeroFields = ["downPayment"];
        const sanitizedData = { ...SellFormData };
        zeroFields.forEach((field) => {
          if (!sanitizedData[field] || sanitizedData[field] === "") {
            sanitizedData[field] = 0;
          }
        });
        const sanitizedPaymentPlans = Array.isArray(sanitizedData.paymentPlans)
          ? sanitizedData.paymentPlans.map((plan) => {
            return {
              years: plan.years === "" ? 0 : plan.years,
              price: plan.price === "" ? 0 : plan.price,
              maintenance: plan.maintenance === "" ? 0 : plan.maintenance,
              downPayment: plan.downPayment === "" ? 0 : plan.downPayment,
              installment_amount_yearly:
                plan.installment_amount_yearly === ""
                  ? 0
                  : plan.installment_amount_yearly,
            };
          })
          : [];

        setSellFormData((prev) => ({
          ...prev,
          downPayment: sanitizedData.downPayment,
          paymentPlans: sanitizedPaymentPlans,
        }));
      } else if (formData.purpose === "rent") {
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
      // Check if at least one image is uploaded
      if (formData.images.length === 0) {
        toast.error(t.toasts.uploadImage);
        return;
      }

      let requiredFields;
      if (formData.purpose === "sell") {
        requiredFields = ["finishing", "developer", "furnishing"];
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

      if (!isEdit) {
        // Use TanStack Query mutation for adding
        await addUnitMutation.mutateAsync(finalFormData);
        toast.success(t.toasts.unitAdded);
      } else {
        // Use TanStack Query mutation for updating
        await updateUnitMutation.mutateAsync(finalFormData);
        toast.success(t.toasts.unitUpdated);
      }

      onClose();
    } catch (error) {
      toast.error(`${t.toasts.errorProcessing}: ${error.message}`);
    } finally {
      setInvalidFields([]);
      setLoading(false);
    }
  };

  const modalTitle = isEdit ? t.modal.editUnit : t.modal.addNewUnit;

  // Add loading and error states to the modal
  if (sharedData.isSharedDataLoading) {
    return createPortal(
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3">
        <div className="bg-white rounded-md shadow-xl p-6 max-w-md w-full">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-lg">Loading form data...</span>
          </div>
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

  // Same header style as add-developer-dialog: primary bg, white text, cancel (leading) | title (center) | Fill from text + Next/Save (trailing)
  const headerLeading = showFillFromTextPanel ? (
    <button
      type="button"
      onClick={() => setShowFillFromTextPanel(false)}
      className="px-3 py-1.5 rounded-md border border-white/30 bg-white/10 text-white hover:bg-white/15 text-sm font-medium inline-flex items-center gap-2"
    >
      {locale === "ar" ? <ArrowRight size={17} /> : <ArrowLeft size={17} />}
      {t.modal?.fillFromText?.back || "Back"}
    </button>
  ) : currentStep > 1 ? (
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
        onClick={() => setShowFillFromTextPanel(true)}
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
    <UnifiedDialog
      isOpen={true}
      onClose={onClose}
      title={modalTitle}
      cancelLabel={t.cancel}
      onCancel={onClose}
      headerLeading={headerLeading}
      headerTrailing={headerTrailing}
      closeOnOutsideClick={false}
      closeOnEscape={false}
      bodyClassName="p-0"
    >
      {showFillFromTextPanel ? (
        /* Paste panel: LenaTextarea + Extract + Back */
        <div className="p-4 md:p-6 space-y-4">
          <button
            type="button"
            onClick={() => setShowFillFromTextPanel(false)}
            className="text-sm font-medium text-primary hover:underline"
          >
            {t.modal?.fillFromText?.back || "Back"}
          </button>
          <LenaTextarea
            name="fillFromText"
            value={fillFromTextValue}
            onChange={(e) => setFillFromTextValue(e.target.value)}
            placeholder={t.modal?.fillFromText?.placeholder || "Paste text here from WhatsApp/Facebook to auto-fill these fields"}
            helperText={t.modal?.fillFromText?.placeholder}
            rows={8}
            className="w-full"
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleExtractFromText}
              disabled={extractingFromText || !fillFromTextValue?.trim()}
              className="px-4 py-2 rounded-md bg-primary text-white font-medium disabled:opacity-70 disabled:pointer-events-none inline-flex items-center gap-2"
            >
              {extractingFromText ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t.modal?.fillFromText?.extracting || "Extracting..."}
                </>
              ) : (
                t.modal?.fillFromText?.extractButton || "Extract"
              )}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Step Indicator */}
          <div className="p-3 md:p-5">
            <StepIndicator
              currentStep={currentStep}
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

          {/* Step Content – Back / Next / Save Unit are in the dialog header only (no footer nav) */}
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
            />
          )}

          {currentStep === 3 && (
            <ImagesStep
              formData={formData}
              updateFormData={updateFormData}
              developersSet={rowDevelopers}
              invalidFields={invalidFields}
              setInvalidFields={setInvalidFields}
              isUploading={isUploading}
              setIsUploading={setIsUploading}
            />
          )}

        </form>
        </>
      )}
    </UnifiedDialog>,
    document.body
  );
}
