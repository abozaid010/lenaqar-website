"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";

import StepIndicator from "./step-indicator";
import BasicDetailsStep from "./steps/basic-details-step";
import ImagesStep from "./steps/images-step";
import RentalDetailsStep from "./steps/rental-details-step";
import SaleDetailsStep from "./steps/sale-details-step";

import { useI18n } from "@/context/translate-api";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";

import {
  addUnit,
  addUnitRent,
  updateUnit,
  updateUnitRent,
} from "@/components/services/serviceFetching";

export default function AddUnitModal({
  isEdit,
  unitData,
  onClose,
  clientId,
  clientName,
  developersData,
  citiesAndDistricts,
}) {
  const modalRef = useRef(null);
  const { t } = useI18n();
  const isRTL = t.direction === "rtl";
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  // Track over all upload statecl
  const [isUploading, setIsUploading] = useState(false);
  const [invalidFields, setInvalidFields] = useState([]); // New state for invalid fields
  const [developers, setDevelopers] = useState(developersData || []);
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
        "roomsCount",
        "bathroomCount",
        "district",
      ];
      const zeroFields = ["floor", "landArea", "gardenSize", "garageArea"];
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

        // Validate paymentPlans
        if (SellFormData.paymentPlans.length > 0) {
          SellFormData.paymentPlans.forEach((plan, index) => {
            if (!plan.price || plan.price === 0) {
              missingFields.push(`price-${index}`);
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
        const sanitizedPaymentPlans = sanitizedData.paymentPlans.map((plan) => {
          return {
            years: plan.years === "" ? 0 : plan.years,
            price: plan.price === "" ? 0 : plan.price,
            maintenance: plan.maintenance === "" ? 0 : plan.maintenance,
          };
        });

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

    if (!formData.purpose) {
      toast.error(t("toasts.selectPurpose"));
      return;
    }

    try {
      let res;
      setLoading(true);
      if (!isEdit) {
        if (formData.purpose === "sell") {
          const finalFormData = { ...formData, ...SellFormData };
          res = await addUnit(finalFormData);
        } else if (formData.purpose === "rent") {
          const finalFormData = { ...formData, ...rentFormData };
          res = await addUnitRent(finalFormData);
        }
      } else {
        if (formData.purpose === "sell") {
          const finalFormData = { ...formData, ...SellFormData };
          res = await updateUnit(finalFormData);
        } else if (formData.purpose === "rent") {
          const finalFormData = { ...formData, ...rentFormData };
          res = await updateUnitRent(finalFormData);
        }
      }

      if (!res || !res.status) {
        toast.error(
          "An error occurred while processing your request. Please try again."
        );
        return;
      }
      onClose();
      window.location.reload();
    } catch (error) {
      toast.error(`${t.toasts.errorProcessing}: ${error.message}`);
    } finally {
      setInvalidFields([]);
      setLoading(false);
    }
  };

  const modalTitle = isEdit ? t.modal.editUnit : t.modal.addNewUnit;
  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3">
      <div
        ref={modalRef}
        className="rounded-md bg-white shadow-xl w-full max-w-4xl"
      >
        {/* Header */}
        <div className="bg-primary rounded-t-md text-white py-4 px-6 flex justify-between items-center">
          <h2 className="text-xl font-semibold">{modalTitle}</h2>
          <button onClick={onClose} className="text-white hover:text-gray-200">
            <X size={21} />
          </button>
        </div>

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

        {/* Step Content */}
        <form
          onSubmit={handleSubmit}
          className="mt-3 px-3 md:p-5 pb-5 overflow-y-auto max-h-[85vh]"
        >
          {currentStep === 1 && (
            <BasicDetailsStep
              clientId={clientId}
              formData={formData}
              updateFormData={updateFormData}
              developers={developers}
              setDevelopers={setDevelopers}
              invalidFields={invalidFields}
              setInvalidFields={setInvalidFields}
              citiesAndDistricts={citiesAndDistricts}
            />
          )}

          {currentStep === 2 && formData.purpose === "sell" && (
            <SaleDetailsStep
              formData={SellFormData}
              updateFormData={(newData) =>
                setSellFormData((prev) => ({ ...prev, ...newData }))
              }
              invalidFields={invalidFields}
              setInvalidFields={setInvalidFields}
            />
          )}

          {currentStep === 2 && formData.purpose === "rent" && (
            <RentalDetailsStep
              formData={rentFormData}
              updateFormData={(newData) =>
                setRentFormData((prev) => ({ ...prev, ...newData }))
              }
            />
          )}

          {currentStep === 3 && (
            <ImagesStep
              formData={formData}
              updateFormData={updateFormData}
              developersSet={developers}
              invalidFields={invalidFields}
              setInvalidFields={setInvalidFields}
              isUploading={isUploading}
              setIsUploading={setIsUploading}
            />
          )}

          {/* Navigation Buttons */}
          <div className="mt-5 flex justify-between">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-6 rounded-md transition-colors"
              >
                {isRTL ? t.buttons.back : ""}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                {isRTL ? "" : t.buttons.back}
              </button>
            ) : (
              <div></div>
            )}

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2 bg-primary hover:opacity-95 text-white font-medium py-2 px-6 rounded-md transition-colors"
              >
                {isRTL ? "" : t.buttons.next}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                {isRTL ? t.buttons.next : ""}
              </button>
            ) : (
              <button
                disabled={loading && isUploading}
                className={`flex items-center gap-2 bg-primary hover:opacity-95 text-white font-medium py-2 px-6 rounded-md transition-colors ${loading || isUploading ? "opacity-50 pointer-events-none" : ""}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                {t.buttons.saveUnit}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
