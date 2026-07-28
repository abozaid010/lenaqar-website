"use client";

import LenaTextField from "@/components/ui/inputs/lena-text-field";
import { PhoneField } from "@/components/phone/PhoneField";
import { useI18n } from "@/hooks/useI18n";
import { parseMoneyInput } from "@/utils/parse-amount";

export default function SaleDetailsStep({
  formData,
  commonFormData,
  clientType,
  showOwnerFields = true,
  ownerMobileRequired = true,
  updateFormData,
  updateCommonFormData,
  invalidFields = [],
  setInvalidFields = () => {},
  fieldErrors = {},
  setFieldErrors = () => {},
}) {
  const { t, translate, translateStrict } = useI18n();

  const clearFieldError = (name) => {
    if (invalidFields.includes(name)) {
      setInvalidFields((prev) => prev.filter((field) => field !== name));
    }
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const fieldErrorMessage = (name, fallbackKey, fallbackText) => {
    if (!invalidFields.includes(name)) return false;
    return fieldErrors[name] || translate(fallbackKey, fallbackText);
  };

  const handleChange = (e, type = "") => {
    const { name, value } = e.target;
    clearFieldError(name);

    if (type === "money") {
      updateFormData({ [name]: parseMoneyInput(value) });
      return;
    }

    if (name === "deliveryDate") {
      const today = new Date().toISOString().split("T")[0];
      const deliveryStatus = value > today ? "off-plan" : "ready to move";
      updateFormData({ deliveryStatus, deliveryDate: value });
      return;
    }

    updateFormData({ [name]: value });
  };

  const handleOwnerChange = (e) => {
    const { name, value } = e.target;
    clearFieldError(name);
    updateCommonFormData({ [name]: value });
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-4">
        {/* Delivery Date */}
        <LenaTextField
          label={t.saleDetails.deliveryDate}
          name="deliveryDate"
          required
          value={formData.deliveryDate}
          onChange={handleChange}
          type="date"
          error={invalidFields.includes("deliveryDate")}
        />
      </div>

      {/* Owner Details */}
      {showOwnerFields && (
        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-4 text-slate-800">
            {t.steps.ownerDetails || "Owner Details"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-4">
            {/* Owner Name */}
            <LenaTextField
              label={translateStrict("saleDetails.ownerName")}
              name="owner_name"
              value={commonFormData.owner_name}
              onChange={handleOwnerChange}
              placeholder={translateStrict("saleDetails.ownerName")}
              error={invalidFields.includes("owner_name")}
            />

            <PhoneField
              className="w-full"
              name="owner_mobile"
              label={translateStrict("saleDetails.ownerMobile")}
              required={ownerMobileRequired}
              defaultCountry="EG"
              value={commonFormData.owner_mobile ?? ""}
              onChange={(next) => {
                clearFieldError("owner_mobile");
                updateCommonFormData({ owner_mobile: next ?? "" });
              }}
              error={
                invalidFields.includes("owner_mobile")
                  ? !String(commonFormData.owner_mobile ?? "").trim()
                    ? translate("phoneField.required", "Phone number is required")
                    : translate("phoneField.invalid", "Invalid phone number")
                  : undefined
              }
            />
          </div>
        </div>
      )}

      {/* Payment Details */}
      <div className="mt-6">
        <h3 className="text-xl font-semibold text-slate-800 mb-4">
          {translateStrict("saleDetails.paymentPlans")}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-y-3 gap-x-4">
          <LenaTextField
            label={translateStrict("saleDetails.totalPrice")}
            name="totalPrice"
            value={formData.totalPrice}
            onChange={(e) => handleChange(e, "money")}
            placeholder="0"
            type="money"
            adornment="EGP"
            required
            error={fieldErrorMessage(
              "totalPrice",
              "saleDetails.totalPriceRequired",
              "Total price is required."
            )}
          />
          
          <LenaTextField
            label={translateStrict("saleDetails.downPayment")}
            name="downPayment"
            value={formData.downPayment}
            onChange={(e) => handleChange(e, "money")}
            placeholder="0"
            type="money"
            adornment="EGP"
            error={fieldErrorMessage(
              "downPayment",
              "saleDetails.downPaymentRequiredInstallments",
              "Down payment is required when using installments."
            )}
          />
          
          <LenaTextField
            label={translateStrict("saleDetails.paid_amount")}
            name="paid_amount"
            value={formData.paid_amount}
            onChange={(e) => handleChange(e, "money")}
            placeholder="0"
            type="money"
            adornment="EGP"
          />
          
          <LenaTextField
            label={translateStrict("saleDetails.remaining_amount")}
            name="remaining_amount"
            value={formData.remaining_amount}
            onChange={(e) => handleChange(e, "money")}
            placeholder="0"
            type="money"
            adornment="EGP"
            error={fieldErrorMessage(
              "remaining_amount",
              "saleDetails.remainingAmountRequiredInstallments",
              "Remaining amount is required when using installments."
            )}
          />
          
          <LenaTextField
            label={translateStrict("saleDetails.installment_years")}
            name="installment_years"
            value={formData.installment_years}
            onChange={handleChange}
            placeholder="0"
            type="number"
            error={fieldErrorMessage(
              "installment_years",
              "saleDetails.installmentYearsRequiredInstallments",
              "Installment years is required when using installments."
            )}
          />
          
          <LenaTextField
            label={translateStrict("saleDetails.over_price")}
            name="over_price"
            value={formData.over_price}
            onChange={(e) => handleChange(e, "money")}
            placeholder="0"
            type="money"
            adornment="EGP"
          />
        </div>
      </div>
    </>
  );
}
