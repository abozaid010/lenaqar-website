"use client";

import LenaTextField from "@/components/ui/inputs/lena-text-field";
import { useI18n } from "@/hooks/useI18n";
import { convertArabicToEnglishNumbers } from "@/utils/formatters";
import { Trash2Icon } from "lucide-react";

export default function SaleDetailsStep({
  formData,
  commonFormData,
  clientType,
  updateFormData,
  updateCommonFormData,
  invalidFields = [],
  setInvalidFields = () => {},
}) {
  const { t, translateStrict } = useI18n();

  const handleChange = (e, type = "") => {
    const { name, value } = e.target;

    if (invalidFields.includes(name)) {
      setInvalidFields((prev) => prev.filter((field) => field !== name));
    }

    if (type === "money") {
      const englishValue = String(convertArabicToEnglishNumbers(value));
      const rawValue = englishValue.replace(/\D/g, "");
      updateFormData({ [name]: rawValue === "" ? "" : Number(rawValue) });
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

    if (invalidFields.includes(name)) {
      setInvalidFields((prev) => prev.filter((field) => field !== name));
    }

    // For mobile number, ensure it's numeric
    if (name === "owner_mobile") {
      const englishValue = String(convertArabicToEnglishNumbers(value));
      const numericValue = englishValue.replace(/\D/g, "");
      updateCommonFormData({ [name]: numericValue });
      return;
    }

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
      {(
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

            {/* Owner Mobile */}
            <LenaTextField
              label={translateStrict("saleDetails.ownerMobile")}
              name="owner_mobile"
              value={commonFormData.owner_mobile}
              onChange={handleOwnerChange}
              placeholder="2012 34567890"
              error={invalidFields.includes("owner_mobile")}
              type="tel"
              required
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
            onChange={handleChange}
            placeholder="0"
            type="money"
            adornment="EGP"
            required
            error={invalidFields.includes("totalPrice")}
          />
          
          <LenaTextField
            label={translateStrict("saleDetails.downPayment")}
            name="downPayment"
            value={formData.downPayment}
            onChange={handleChange}
            placeholder="0"
            type="money"
            adornment="EGP"
          />
          
          <LenaTextField
            label={translateStrict("saleDetails.paid_amount")}
            name="paid_amount"
            value={formData.paid_amount}
            onChange={handleChange}
            placeholder="0"
            type="money"
            adornment="EGP"
          />
          
          <LenaTextField
            label={translateStrict("saleDetails.remaining_amount")}
            name="remaining_amount"
            value={formData.remaining_amount}
            onChange={handleChange}
            placeholder="0"
            type="money"
            adornment="EGP"
          />
          
          <LenaTextField
            label={translateStrict("saleDetails.installment_years")}
            name="installment_years"
            value={formData.installment_years}
            onChange={handleChange}
            placeholder="0"
            type="number"
            error={invalidFields.includes("installment_years")}
          />
          
          <LenaTextField
            label={translateStrict("saleDetails.over_price")}
            name="over_price"
            value={formData.over_price}
            onChange={handleChange}
            placeholder="0"
            type="money"
            adornment="EGP"
          />
        </div>
      </div>
    </>
  );
}
