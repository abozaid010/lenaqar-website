"use client";

import Dialog from "@/components/ui/Dialog";
import FormInput from "@/components/ui/inputs/form-input";
import LenaTextField from "@/components/ui/inputs/lena-text-field";
import { useI18n } from "@/hooks/useI18n";
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
  const [extraPayments, setExtraPayments] = useState([]);

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

  // Resolve delivery years from model/API (support both delivery_in_years and delivery_years)
  const getDeliveryInYears = (plan) => {
    const raw = plan?.delivery_in_years ?? plan?.delivery_years;
    if (raw === undefined || raw === null) return "";
    const num = Number(raw);
    return Number.isFinite(num) ? String(raw) : "";
  };

  // Escalation percentage: API fields vary (installment_ vs installments_)
  const getInstallmentsIncreasingPercentage = (plan) => {
    const raw =
      plan?.installments_increasing_percentage ??
      plan?.installment_increasing_percentage ??
      null;
    if (raw === undefined || raw === null) return "";
    const num = Number(raw);
    return Number.isFinite(num) ? (num * 100).toString() : "";
  };

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
          delivery_in_years: getDeliveryInYears(existingPlan),
          maintenance_fee: existingPlan.maintenance_fee
            ? (existingPlan.maintenance_fee * 100).toString()
            : "",
          cache_discount:
            existingPlan.cache_discount !== undefined &&
            existingPlan.cache_discount !== null
              ? (existingPlan.cache_discount * 100).toString()
              : "40",
          installments_increasing_percentage: getInstallmentsIncreasingPercentage(existingPlan),
          delivery_payment_percentage:
            existingPlan.delivery_payment_percentage !== undefined &&
            existingPlan.delivery_payment_percentage !== null
              ? (existingPlan.delivery_payment_percentage * 100).toString()
              : "",
          is_default: existingPlan.is_default || false,
        });

        // Load existing extra payments (custom installments) if present
        let existingExtra = existingPlan.extra_payments;
        if (existingExtra && !Array.isArray(existingExtra) && typeof existingExtra === "object") {
          existingExtra = Object.values(existingExtra);
        }
        if (Array.isArray(existingExtra)) {
          setExtraPayments(
            existingExtra.map((p) => ({
              id: p.id,
              name: p.name || "",
              percentage:
                typeof p.percentage === "number"
                  ? (p.percentage * 100).toString()
                  : "",
              after_months:
                p.after_months !== undefined && p.after_months !== null
                  ? String(p.after_months)
                  : "",
            }))
          );
        } else {
          setExtraPayments([]);
        }
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
        setExtraPayments([]);
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

  const handleExtraPaymentChange = (index, field, value) => {
    const updated = [...extraPayments];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setExtraPayments(updated);

    if (errors.extra_payments) {
      setErrors({
        ...errors,
        extra_payments: null,
      });
    }
  };

  const handleAddExtraPayment = () => {
    setExtraPayments([
      ...extraPayments,
      {
        id: undefined,
        name: "",
        percentage: "",
        after_months: "",
      },
    ]);
  };

  const handleRemoveExtraPayment = (index) => {
    setExtraPayments(extraPayments.filter((_, i) => i !== index));
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

    // Validate custom extra payments (optional section)
    const nonEmptyExtraPayments = extraPayments.filter(
      (p) =>
        (p.name && p.name.trim() !== "") ||
        (p.percentage !== "" && p.percentage !== null && p.percentage !== undefined) ||
        (p.after_months !== "" && p.after_months !== null && p.after_months !== undefined)
    );

    if (nonEmptyExtraPayments.length > 0) {
      for (const payment of nonEmptyExtraPayments) {
        if (!payment.name || payment.name.trim() === "") {
          newErrors.extra_payments =
            t.formValidation?.extraPaymentsNameRequired ||
            "Custom payment name is required for all rows.";
          break;
        }

        const percentValue = parseFloat(payment.percentage);
        if (
          !Number.isFinite(percentValue) ||
          percentValue < 0 ||
          percentValue > 100
        ) {
          newErrors.extra_payments =
            t.formValidation?.extraPaymentsPercentageInvalid ||
            "Custom payment percentage must be between 0 and 100.";
          break;
        }

        const monthsValue = parseFloat(payment.after_months);
        if (
          !Number.isFinite(monthsValue) ||
          monthsValue < 0 ||
          monthsValue > 200
        ) {
          newErrors.extra_payments =
            t.formValidation?.extraPaymentsMonthsInvalid ||
            "Custom payment months must be between 0 and 200.";
          break;
        }
      }
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
      // delivery_in_years is always sent for create/update (0 when empty)
      const deliveryInYearsNum =
        formData.delivery_in_years === "" ||
        isNaN(parseFloat(formData.delivery_in_years))
          ? 0
          : parseFloat(formData.delivery_in_years);

      const processedData = {
        name: formData.name,
        description: "", // Always send empty string
        downpayment_percentage:
          parseFloat(formData.downpayment_percentage) / 100,
        installment_years: parseFloat(formData.installment_years),
        delivery_in_years: deliveryInYearsNum,
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

      // Normalize custom extra payments
      const normalizedExtraPayments = extraPayments
        .filter(
          (p) =>
            p &&
            p.name &&
            p.name.trim() !== "" &&
            p.percentage !== "" &&
            p.after_months !== ""
        )
        .map((p) => ({
          id: p.id,
          name: p.name.trim(),
          percentage: parseFloat(p.percentage) / 100,
          after_months: parseFloat(p.after_months),
        }));

      processedData.extra_payments = normalizedExtraPayments;

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
          e.stopPropagation(); // prevent React component-tree bubbling into parent <form id="add-project-form">
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
          min="-1"
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
            min="-1"
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
            min="-1"
            max="100"
            step="0.1"
            error={errors.installments_increasing_percentage}
          />
        </div>







        <div className="grid grid-cols-2 gap-1.5">
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
            min="-1"
            max="100"
            step="0.1"
            error={errors.cache_discount}
          />
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <LenaTextField
            type="number"
            name="delivery_payment_percentage"
            label={t.formLabels?.deliveryPaymentPercentage || "Delivery Payment (%)"}
            value={formData.delivery_payment_percentage}
            onChange={handleChange}
            required
            placeholder="8"
            min="-1"
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
            min="-1"
            max="100"
            step="0.1"
            error={errors.maintenance_fee}
          />
        </div>

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

        {/* Custom Payments (extra_payments) */}
        <div className="pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-gray-700 uppercase tracking-wide">
              {t.formLabels?.customPayments || "Custom Payments"}
            </span>
            <button
              type="button"
              onClick={handleAddExtraPayment}
              className="text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              {t.buttons?.addCustomPayment ?? "+ Add payment"}
            </button>
          </div>

          {extraPayments.length > 0 && (
            <div className="space-y-1.5">
              {extraPayments.map((payment, index) => (
                <div
                  key={payment.id ?? index}
                  className="flex flex-nowrap items-start gap-2"
                >
                  <div className="flex-[2] min-w-0">
                    <LenaTextField
                      name={`extra_payment_name_${index}`}
                      label={
                        t.formLabels?.customPaymentName ??
                        "Name (e.g. after 3 months)"
                      }
                      value={payment.name}
                      onChange={(e) =>
                        handleExtraPaymentChange(index, "name", e.target.value)
                      }
                      placeholder={
                        t.formLabels?.customPaymentNamePlaceholder ?? "after 3 months"
                      }
                    />
                  </div>
                  <div className="flex-1 min-w-0 max-w-[7rem]">
                    <LenaTextField
                      type="number"
                      name={`extra_payment_percentage_${index}`}
                      label={
                        t.formLabels?.customPaymentPercentage ?? "Percentage (%)"
                      }
                      value={payment.percentage}
                      onChange={(e) =>
                        handleExtraPaymentChange(
                          index,
                          "percentage",
                          e.target.value
                        )
                      }
                      placeholder="5"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>
                  <div className="flex-1 min-w-0 max-w-[7rem]">
                    <LenaTextField
                      type="number"
                      name={`extra_payment_months_${index}`}
                      label={
                        t.formLabels?.customPaymentMonths ?? "After (months)"
                      }
                      value={payment.after_months}
                      onChange={(e) =>
                        handleExtraPaymentChange(
                          index,
                          "after_months",
                          e.target.value
                        )
                      }
                      placeholder="3"
                      min="0"
                      max="200"
                      step="0.1"
                    />
                  </div>
                  <div className="shrink-0 flex items-center pt-6">
                    <button
                      type="button"
                      onClick={() => handleRemoveExtraPayment(index)}
                      className="text-xs text-gray-400 hover:text-red-500"
                      title={t.buttons?.remove ?? "Remove"}
                    >
                      {t.buttons?.remove ?? "✕"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {errors.extra_payments && (
            <p className="mt-1 text-xs text-red-500">
              {errors.extra_payments}
            </p>
          )}
        </div>

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
