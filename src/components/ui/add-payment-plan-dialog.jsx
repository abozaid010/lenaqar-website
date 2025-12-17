"use client";

import Dialog from "@/components/ui/Dialog";
import FormInput from "@/components/ui/inputs/form-input";
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
    maintenance_fee: "",
    installment_increasing_percentage: "",
    extra_payments: {
      delivery_fee: "",
      contract_fee: "",
    },
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
          installment_years: existingPlan.installment_years || "",
          maintenance_fee: existingPlan.maintenance_fee
            ? (existingPlan.maintenance_fee * 100).toString()
            : "",
          installment_increasing_percentage:
            existingPlan.installment_increasing_percentage
              ? (
                  existingPlan.installment_increasing_percentage * 100
                ).toString()
              : "",
          extra_payments: {
            delivery_fee: existingPlan.extra_payments?.delivery_fee
              ? (existingPlan.extra_payments.delivery_fee * 100).toString()
              : "",
            contract_fee: existingPlan.extra_payments?.contract_fee || "",
          },
        });
      } else {
        // Reset form with empty values for all fields
        setFormData({
          name: "",
          description: "",
          downpayment_percentage: "",
          reservation_amount_percentage: "",
          installment_years: "",
          maintenance_fee: "",
          installment_increasing_percentage: "",
          extra_payments: {
            delivery_fee: "",
            contract_fee: "",
          },
        });
      }
      setErrors({});
    }
  }, [isOpen, editMode, existingPlan]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Check if this is a percentage field that needs range validation
    const percentageFields = [
      "downpayment_percentage",
      "reservation_amount_percentage",
      "maintenance_fee",
      "installment_increasing_percentage",
      "extra_payments.delivery_fee",
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

    // Handle nested extra_payments properties
    if (name.startsWith("extra_payments.")) {
      const extraPaymentField = name.split(".")[1];

      // Special handling for percentage fields in extra_payments
      if (extraPaymentField === "delivery_fee" && value !== "") {
        const numValue = parseFloat(value);
        if (isNaN(numValue) || numValue < 0 || numValue > 100) {
          // Allow only empty string, decimal point, or 0.
          if (value !== "" && value !== "." && value !== "0.") {
            return; // Exit without updating state
          }
        }
      }

      setFormData({
        ...formData,
        extra_payments: {
          ...formData.extra_payments,
          [extraPaymentField]: value,
        },
      });
    } else {
      // Handle regular fields
      setFormData({
        ...formData,
        [name]: value,
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

    if (!formData.name.trim()) {
      newErrors.name = t.formValidation?.nameRequired || "Name is required";
    }

    // Description is optional, no validation needed

    // Validate percentages are between 0 and 100
    const percentageFields = [
      "downpayment_percentage",
      "reservation_amount_percentage",
      "maintenance_fee",
      "installment_increasing_percentage",
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

    // Validate delivery fee percentage only if provided
    if (
      formData.extra_payments &&
      formData.extra_payments.delivery_fee !== undefined &&
      formData.extra_payments.delivery_fee !== ""
    ) {
      const deliveryFee = parseFloat(formData.extra_payments.delivery_fee);
      if (isNaN(deliveryFee)) {
        newErrors["extra_payments.delivery_fee"] =
          t.formValidation?.percentageInvalid ||
          "Delivery fee must be a valid number";
      } else if (deliveryFee < 0 || deliveryFee > 100) {
        newErrors["extra_payments.delivery_fee"] =
          t.formValidation?.percentageInvalid ||
          "Delivery fee must be between 0 and 100";
      }
    }

    // Validate contract fee is a positive number only if provided
    if (
      formData.extra_payments &&
      formData.extra_payments.contract_fee !== undefined &&
      formData.extra_payments.contract_fee !== ""
    ) {
      const contractFee = parseFloat(formData.extra_payments.contract_fee);
      if (isNaN(contractFee) || contractFee < 0) {
        newErrors["extra_payments.contract_fee"] =
          "Contract fee must be a positive number";
      }
    }

    // Validate installment years is a positive integer
    const installmentYears = parseInt(formData.installment_years);
    if (
      isNaN(installmentYears) ||
      installmentYears <= 0 ||
      !Number.isInteger(parseFloat(formData.installment_years))
    ) {
      newErrors.installment_years =
        "Installment years must be a positive integer";
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
        ...formData,
        downpayment_percentage:
          parseFloat(formData.downpayment_percentage) / 100,
        reservation_amount_percentage:
          parseFloat(formData.reservation_amount_percentage) / 100,
        installment_years: parseInt(formData.installment_years),
        maintenance_fee: parseFloat(formData.maintenance_fee) / 100,
        installment_increasing_percentage:
          parseFloat(formData.installment_increasing_percentage) / 100,
      };

      // Handle extra_payments if they exist
      if (formData.extra_payments) {
        processedData.extra_payments = {};

        if (
          formData.extra_payments.delivery_fee !== undefined &&
          formData.extra_payments.delivery_fee !== ""
        ) {
          processedData.extra_payments.delivery_fee =
            parseFloat(formData.extra_payments.delivery_fee) / 100; // Convert from 0-100 to 0-1
        }

        if (
          formData.extra_payments.contract_fee !== undefined &&
          formData.extra_payments.contract_fee !== ""
        ) {
          processedData.extra_payments.contract_fee = parseFloat(
            formData.extra_payments.contract_fee
          );
        }
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
      title={
        editMode
          ? t.modal.updatePaymentPlan || "Edit Payment Plan"
          : t.modal.addPaymentPlan || "Add Payment Plan"
      }
    >
      <div className="space-y-3">
        {/* Basic Information */}
        <FormInput
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

        <div>
          <label
            className={`block text-sm font-medium mb-1 ${errors.description ? "text-red-500" : "text-gray-700"}`}
          >
            {t.formLabels?.description || "Description"}
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className={`block w-full rounded-md border py-1 px-3 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
              errors.description ? "border-red-500" : "border-gray-300"
            }`}
            placeholder={
              locale === "ar"
                ? "وصف الخطة (اختياري)"
                : "Plan description (optional)"
            }
          />
          {errors.description && (
            <p className="text-xs text-red-500 mt-1">{errors.description}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <FormInput
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

          <FormInput
            type="number"
            name="reservation_amount_percentage"
            label={
              t.formLabels?.reservationPercentage || "Reservation Amount (%)"
            }
            value={formData.reservation_amount_percentage}
            onChange={handleChange}
            required
            placeholder="5"
            min="0"
            max="100"
            step="0.1"
            error={errors.reservation_amount_percentage}
          />
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <FormInput
            type="number"
            name="installment_years"
            label={t.formLabels?.installmentYears || "Installment Years"}
            value={formData.installment_years}
            onChange={handleChange}
            required
            placeholder="8"
            min="1"
            error={errors.installment_years}
          />

          <FormInput
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

        <FormInput
          type="number"
          name="installment_increasing_percentage"
          label={
            t.formLabels?.installmentIncreaseRate ||
            "Annual Installment Increase Rate (%)"
          }
          value={formData.installment_increasing_percentage}
          onChange={handleChange}
          required
          placeholder="0"
          min="0"
          max="100"
          step="0.1"
          error={errors.installment_increasing_percentage}
        />

        <div className="pt-2 border-t border-gray-100">
          <h3 className="text-sm font-medium mb-2">
            {t.formLabels?.extraPayments || "Extra Payments"}{" "}
            <span className="text-xs text-gray-500">(Optional)</span>
          </h3>

          <div className="grid grid-cols-2 gap-1.5">
            <FormInput
              type="number"
              name="extra_payments.delivery_fee"
              label={t.formLabels?.deliveryFee || "Delivery Fee (%)"}
              value={formData.extra_payments.delivery_fee}
              onChange={handleChange}
              placeholder="10"
              min="0"
              max="100"
              step="0.1"
              error={errors["extra_payments.delivery_fee"]}
            />

            <FormInput
              type="number"
              name="extra_payments.contract_fee"
              label={t.formLabels?.contractFee || "Contract Fee (EGP)"}
              value={formData.extra_payments.contract_fee}
              onChange={handleChange}
              placeholder="5000"
              min="0"
              error={errors["extra_payments.contract_fee"]}
            />
          </div>
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
            className={`px-4 py-1.5 bg-primary rounded-md text-sm font-medium text-white focus:outline-none focus:ring-1 focus:ring-blue-500 ${
              isSubmitting
                ? "pointer-events-none opacity-80"
                : "hover:bg-primary/90"
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <Loader2 size={20} className="animate-spin mr-2" />
                {t.buttons?.saving || "Saving..."}
              </div>
            ) : editMode ? (
              t.buttons?.update || "Update"
            ) : (
              t.buttons?.save || "Save"
            )}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
