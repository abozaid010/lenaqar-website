"use client";

import { useRef } from "react";
import LenaTextField from "@/components/ui/inputs/lena-text-field";
import { PhoneField } from "@/components/phone/PhoneField";
import { useI18n } from "@/hooks/useI18n";
import { isAmountEntered, parseMoneyInput } from "@/utils/parse-amount";
import {
  computeDownPaymentFromPaidAndOver,
  computeRemainingFromPaid,
  isDownPaymentMatchingPaidAndOver,
} from "@/utils/sale-pricing-validation";

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
  // When false, remaining_amount tracks totalPrice − paid_amount automatically.
  const remainingManualRef = useRef(isAmountEntered(formData.remaining_amount));
  // When false, empty downPayment may be filled as paid_amount + over_price.
  // Never overwrite a value the user typed into downPayment.
  const downPaymentManualRef = useRef(isAmountEntered(formData.downPayment));

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

  const fieldErrorMessage = (name, fallbackKey) => {
    if (!invalidFields.includes(name)) return false;
    return fieldErrors[name] || (fallbackKey ? translate(fallbackKey) : false);
  };

  const maybeAutoFillDownPayment = (nextPaid, nextOver, patch) => {
    if (downPaymentManualRef.current) return;
    const computed = computeDownPaymentFromPaidAndOver(nextPaid, nextOver);
    if (computed == null) return;
    patch.downPayment = computed;
    clearFieldError("downPayment");
  };

  const handleChange = (e, type = "") => {
    const { name, value } = e.target;
    clearFieldError(name);

    if (type === "money") {
      const parsed = parseMoneyInput(value);

      if (name === "remaining_amount") {
        remainingManualRef.current = isAmountEntered(parsed);
        updateFormData({ remaining_amount: parsed });
        return;
      }

      if (name === "downPayment") {
        downPaymentManualRef.current = isAmountEntered(parsed);
        const next = { downPayment: parsed };
        // Cleared by user → allow helper math again and refill if paid+over exist.
        if (!downPaymentManualRef.current) {
          maybeAutoFillDownPayment(
            formData.paid_amount,
            formData.over_price,
            next
          );
        }
        if (!remainingManualRef.current) {
          const planLikely =
            isAmountEntered(formData.paid_amount) ||
            isAmountEntered(next.downPayment) ||
            isAmountEntered(formData.installment_years);
          if (planLikely) {
            const computed = computeRemainingFromPaid(
              formData.totalPrice,
              formData.paid_amount
            );
            if (computed != null) {
              next.remaining_amount = computed;
              clearFieldError("remaining_amount");
            }
          }
        }
        updateFormData(next);
        return;
      }

      if (
        name === "totalPrice" ||
        name === "paid_amount" ||
        name === "over_price"
      ) {
        const next = { [name]: parsed };
        const nextPaid =
          name === "paid_amount" ? parsed : formData.paid_amount;
        const nextOver =
          name === "over_price" ? parsed : formData.over_price;

        maybeAutoFillDownPayment(nextPaid, nextOver, next);

        if (!remainingManualRef.current && name !== "over_price") {
          const total =
            name === "totalPrice" ? parsed : formData.totalPrice;
          const paid = nextPaid;
          const down = next.downPayment ?? formData.downPayment;
          // Only auto-fill once a payment-plan signal exists — never from
          // totalPrice alone (that would turn a cash sale into installments).
          const planLikely =
            isAmountEntered(paid) ||
            isAmountEntered(down) ||
            isAmountEntered(formData.installment_years);
          if (planLikely) {
            const computed = computeRemainingFromPaid(total, paid);
            if (computed != null) {
              next.remaining_amount = computed;
              clearFieldError("remaining_amount");
            }
          }
        }
        updateFormData(next);
        return;
      }

      updateFormData({ [name]: parsed });
      return;
    }

    if (name === "deliveryDate") {
      const today = new Date().toISOString().split("T")[0];
      const deliveryStatus = value > today ? "off-plan" : "ready to move";
      updateFormData({ deliveryStatus, deliveryDate: value });
      return;
    }

    if (name === "installment_years" && !remainingManualRef.current) {
      const next = { installment_years: value };
      if (isAmountEntered(value)) {
        const computed = computeRemainingFromPaid(
          formData.totalPrice,
          formData.paid_amount
        );
        if (computed != null) {
          next.remaining_amount = computed;
          clearFieldError("remaining_amount");
        }
      }
      updateFormData(next);
      return;
    }

    updateFormData({ [name]: value });
  };

  const handleOwnerChange = (e) => {
    const { name, value } = e.target;
    clearFieldError(name);
    updateCommonFormData({ [name]: value });
  };

  const downPaymentMismatch =
    !isDownPaymentMatchingPaidAndOver(
      formData.downPayment,
      formData.paid_amount,
      formData.over_price
    );
  const downPaymentWarning = downPaymentMismatch
    ? translate(
        "saleDetails.downPaymentMismatchHint",
        "Down payment usually equals Paid Amount + Over Price. You can keep a different value."
      )
    : "";

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
          error={fieldErrorMessage(
            "deliveryDate",
            "unitFormValidation.deliveryDateRequired"
          )}
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
                  ? fieldErrors.owner_mobile ||
                    (!String(commonFormData.owner_mobile ?? "").trim()
                      ? translate("unitFormValidation.ownerMobileRequired")
                      : translate("unitFormValidation.ownerMobileInvalid"))
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
              "unitFormValidation.totalPriceRequired"
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
              "unitFormValidation.downPaymentRequiredInstallments"
            )}
            warning={downPaymentWarning}
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
              "unitFormValidation.remainingAmountRequiredInstallments"
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
              "unitFormValidation.installmentYearsRequiredInstallments"
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
