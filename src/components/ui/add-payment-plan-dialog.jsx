"use client";

import Dialog from "@/components/ui/Dialog";
import FormInput from "@/components/ui/inputs/form-input";
import LenaTextField from "@/components/ui/inputs/lena-text-field";
import { useI18n } from "@/context/translate-api";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function AddPaymentPlanDialog({
  isOpen,
  onClose,
  onSave,
  existingPlan = null,
}) {
  const { t, locale } = useI18n();
  const editMode = !!existingPlan;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    downpayment_percentage: "",
    reservation_amount_percentage: "",
    installment_years: "",
    delivery_in_years: "",
    maintenance_fee: "",
    cache_discount: "40",
    installments_increasing_percentage: "",
    delivery_payment_percentage: "",
    is_default: false,
  });

  useEffect(() => {
    if (isOpen) {
      if (editMode && existingPlan) {
        // Load existing data for editing and convert percentages from 0-1 to 0-100
        setFormData({
          name: existingPlan.name || "",
          description: existingPlan.description || "",
          downpayment_percentage: existingPlan.downpayment_percentage
            ? (existingPlan.downpayment_percentage * 100).toString()
            : "",
          reservation_amount_percentage:
            existingPlan.reservation_amount_percentage
              ? (existingPlan.reservation_amount_percentage * 100).toString()
              : "",
          installment_years:
            existingPlan.installment_years !== undefined &&
            existingPlan.installment_years !== null
              ? String(existingPlan.installment_years)
              : "",
          delivery_in_years:
            existingPlan.delivery_in_years !== undefined &&
            existingPlan.delivery_in_years !== null
              ? String(existingPlan.delivery_in_years)
              : "",
          maintenance_fee: existingPlan.maintenance_fee
            ? (existingPlan.maintenance_fee * 100).toString()
            : "",
          cache_discount:
            existingPlan.cache_discount !== undefined &&
            existingPlan.cache_discount !== null
              ? (existingPlan.cache_discount * 100).toString()
              : "40",
          installments_increasing_percentage:
            existingPlan.installments_increasing_percentage !== undefined &&
            existingPlan.installments_increasing_percentage !== null
              ? (existingPlan.installments_increasing_percentage * 100).toString()
              : "",
          delivery_payment_percentage:
            existingPlan.delivery_payment_percentage !== undefined &&
            existingPlan.delivery_payment_percentage !== null
              ? (existingPlan.delivery_payment_percentage * 100).toString()
              : "",
          is_default: existingPlan.is_default || false,
        });
      } else {
        // Reset form with empty values for all fields
        setFormData({
          name: "",
          description: "",
          downpayment_percentage: "",
          reservation_amount_percentage: "",
          installment_years: "",
          delivery_in_years: "",
          maintenance_fee: "",
          cache_discount: "40",
          installments_increasing_percentage: "",
          delivery_payment_percentage: "",
          is_default: false,
        });
      }
      setErrors({});
    }
  }, [isOpen, editMode, existingPlan]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Check if this is a percentage field that needs range validation
    const percentageFields = [
      "downpayment_percentage",
      "maintenance_fee",
      "cache_discount",
      "installments_increasing_percentage",
      "delivery_payment_percentage",
    ];

    // Validate percentage inputs to stay within 0-100 range
    if (percentageFields.includes(name) && value !== "") {
      const numValue = parseFloat(value);
      // If the value is not a number or outside the valid range, don't update
      if (isNaN(numValue) || numValue < 0 || numValue > 100) {
        // If backspacing to empty or typing a decimal point, allow it
        if (value === "" || value === "." || value === "0.") {
          // Allow these values to pass through
        } else {
          // Otherwise restrict to valid range
          return; // Exit without updating state
        }
      }
    }

    // Validate delivery_in_years: positive float >= 0 and <= 10
    if (name === "delivery_in_years" && value !== "") {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue < 0 || numValue > 10) {
        if (value !== "" && value !== "." && value !== "0.") {
          return;
        }
      }
    }

    // Handle regular fields (including checkbox for is_default)
    const updatedFormData = {
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    };

    // Auto-generate plan name when downpayment or years change
    if (name === "downpayment_percentage" || name === "installment_years") {
      const downpayment = updatedFormData.downpayment_percentage || "";
      const years = updatedFormData.installment_years || "";
      
      if (downpayment && years) {
        updatedFormData.name = `${downpayment} downpayment, ${years} years`;
      } else if (downpayment) {
        updatedFormData.name = `${downpayment} downpayment`;
      } else if (years) {
        updatedFormData.name = `${years} years`;
      }
    }

    setFormData(updatedFormData);

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

    if (!formData.name.trim()) {
      newErrors.name = t.formValidation?.nameRequired || "Name is required";
    }

    // Description is optional, no validation needed

    // Validate percentages are between 0 and 100
    const percentageFields = [
      "downpayment_percentage",
      "maintenance_fee",
      "cache_discount",
      "installments_increasing_percentage",
      "delivery_payment_percentage",
    ];

    percentageFields.forEach((field) => {
      const value = parseFloat(formData[field]);
      if (isNaN(value)) {
        newErrors[field] =
          t.formValidation?.percentageRequired ||
          `${field.replace(/_/g, " ")} is required`;
      } else if (value < 0 || value > 100) {
        newErrors[field] =
          t.formValidation?.percentageInvalid ||
          `${field.replace(/_/g, " ")} must be between 0 and 100`;
      }
    });

    // Validate installment years is a positive number (float allowed)
    const installmentYears = parseFloat(formData.installment_years);
    if (!Number.isFinite(installmentYears) || installmentYears <= 0) {
      newErrors.installment_years =
        "Installment years must be a positive number";
    }

    // Validate delivery_in_years: positive float >= 0 and <= 10
    const deliveryInYears = parseFloat(formData.delivery_in_years);
    if (
      formData.delivery_in_years !== "" &&
      (!Number.isFinite(deliveryInYears) ||
        deliveryInYears < 0 ||
        deliveryInYears > 10)
    ) {
      newErrors.delivery_in_years =
        t.formValidation?.deliveryInYearsInvalid ||
        "Delivery (years) must be between 0 and 10";
    }

    setErrors(newErrors);

    // Show a single toast error if there are any validation errors
    if (Object.keys(newErrors).length > 0) {
      toast.error("Please fix the form errors before submitting");
    }

    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert string values to numbers and convert percentages from 0-100 to 0-1
      const processedData = {
        name: formData.name,
        description: "", // Always send empty string
        downpayment_percentage:
          parseFloat(formData.downpayment_percentage) / 100,
        installment_years: parseFloat(formData.installment_years),
        delivery_in_years:
          formData.delivery_in_years === "" ||
          isNaN(parseFloat(formData.delivery_in_years))
            ? 0
            : parseFloat(formData.delivery_in_years),
        maintenance_fee: parseFloat(formData.maintenance_fee) / 100,
        cache_discount:
          formData.cache_discount === "" ||
          isNaN(parseFloat(formData.cache_discount))
            ? 0.4
            : parseFloat(formData.cache_discount) / 100,
        installments_increasing_percentage:
          formData.installments_increasing_percentage === "" ||
          isNaN(parseFloat(formData.installments_increasing_percentage))
            ? 0
            : parseFloat(formData.installments_increasing_percentage) / 100,
        delivery_payment_percentage:
          formData.delivery_payment_percentage === "" ||
          isNaN(parseFloat(formData.delivery_payment_percentage))
            ? 0
            : parseFloat(formData.delivery_payment_percentage) / 100,
        is_default: formData.is_default,
      };

      // Add updated_at when updating a payment plan
      if (editMode) {
        processedData.updated_at = new Date().toISOString();
      }

      onSave(processedData, editMode);
      onClose();
    } catch (error) {
      toast.error("Failed to save payment plan. Please try again.");
      setErrors({
        submit:
          error.message || "Failed to save payment plan. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      closeOnOutsideClick={false}
      title={
        editMode
          ? t.modal.updatePaymentPlan || "Edit Payment Plan"
          : t.modal.addPaymentPlan || "Add Payment Plan"
      }
      showCloseButton={false}
      headerLeading={
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-1.5 rounded-md text-sm font-medium text-white/90 hover:text-white border border-white/50 hover:border-white focus:outline-none focus:ring-1 focus:ring-white/50"
        >
          {t.buttons?.cancel || "Cancel"}
        </button>
      }
      headerActions={
        <button
          type="submit"
          form="add-payment-plan-form"
          disabled={isSubmitting}
          className={`px-4 py-1.5 rounded-md text-sm font-medium focus:outline-none focus:ring-1 focus:ring-white/50 ${
            isSubmitting
              ? "pointer-events-none opacity-80 bg-white/80 text-primary"
              : "bg-white text-primary hover:bg-white/90"
          }`}
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 size={18} className="animate-spin" />
              {t.buttons?.saving || "Saving..."}
            </div>
          ) : editMode ? (
            t.buttons?.update || "Update"
          ) : (
            t.buttons?.save || "Save"
          )}
        </button>
      }
    >
      <form
        id="add-payment-plan-form"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(e);
        }}
        className="space-y-3 -mb-4"
      >
        {/* Basic Information */}
        <LenaTextField
          type="number"
          name="downpayment_percentage"
          label={t.formLabels?.downpaymentPercentage || "Down Payment (%)"}
          value={formData.downpayment_percentage}
          onChange={handleChange}
          required
          placeholder="5"
          min="0"
          max="100"
          step="0.1"
          error={errors.downpayment_percentage}
        />

        <div className="grid grid-cols-2 gap-1.5">
          <LenaTextField
            type="number"
            name="installment_years"
            label={t.formLabels?.installmentYears || "Installment Years"}
            value={formData.installment_years}
            onChange={handleChange}
            required
            placeholder="8"
            min="0"
            step="0.1"
            error={errors.installment_years}
          />

          <LenaTextField
            type="number"
            name="installments_increasing_percentage"
            label={t.formLabels?.installmentsIncreasingPercentage || "Installments Increasing (%)"}
            value={formData.installments_increasing_percentage}
            onChange={handleChange}
            required
            placeholder="5"
            min="0"
            max="100"
            step="0.1"
            error={errors.installments_increasing_percentage}
          />
        </div>







        <LenaTextField
          type="number"
          name="delivery_in_years"
          label={t.formLabels?.deliveryInYears || "Delivery (years)"}
          value={formData.delivery_in_years}
          onChange={handleChange}
          placeholder="0"
          min={0}
          max={10}
          step="0.1"
          error={errors.delivery_in_years}
          helperText={
            t.formValidation?.deliveryInYearsHelper ||
            "Value between 0 and 10 (e.g. 2.5)"
          }
        />

        <div className="grid grid-cols-2 gap-1.5">
          <LenaTextField
            type="number"
            name="delivery_payment_percentage"
            label={t.formLabels?.deliveryPaymentPercentage || "Delivery Payment (%)"}
            value={formData.delivery_payment_percentage}
            onChange={handleChange}
            required
            placeholder="8"
            min="0"
            max="100"
            step="0.1"
            error={errors.delivery_payment_percentage}
          />

          <LenaTextField
            type="number"
            name="maintenance_fee"
            label={t.formLabels?.maintenanceFee || "Maintenance Fee (%)"}
            value={formData.maintenance_fee}
            onChange={handleChange}
            required
            placeholder="5"
            min="0"
            max="100"
            step="0.1"
            error={errors.maintenance_fee}
          />
        </div>

        <LenaTextField
          type="number"
          name="cache_discount"
          label={
            t.formLabels?.cacheDiscount ||
            "Cache Discount (%)"
          }
          value={formData.cache_discount ?? ""}
          onChange={handleChange}
          required
          placeholder="40"
          min="0"
          max="100"
          step="0.1"
          error={errors.cache_discount}
        />

        <LenaTextField
          name="name"
          label={t.formLabels?.planName || "Plan Name"}
          value={formData.name}
          onChange={handleChange}
          required
          placeholder={
            locale === "ar" ? "خطة دفع 8 سنوات" : "8 Years Payment Plan"
          }
          error={errors.name}
        />

        <div className="pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_default"
              name="is_default"
              checked={formData.is_default}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label
              htmlFor="is_default"
              className="block text-sm font-medium text-gray-700"
            >
              {t.formLabels?.defaultPaymentPlan || "Set as Default Payment Plan"}
            </label>
          </div>
        </div>
      </form>
    </Dialog>
  );
}
