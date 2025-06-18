"use client";

import FormInput from "@/components/ui/inputs/form-input";
import { useI18n } from "@/context/translate-api";
import { convertArabicToEnglishNumbers, formatPrice } from "@/utils/formatters";
import { Plus, Trash2Icon } from "lucide-react";

export default function SaleDetailsStep({
  formData,
  updateFormData,
  invalidFields = [],
  setInvalidFields = () => {},
}) {
  const { t } = useI18n();

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

  const addPaymentPlan = () => {
    updateFormData({
      paymentPlans: [
        ...formData.paymentPlans,
        { years: 1, price: "", maintenance: "" },
      ],
    });
  };

  const updatePaymentPlan = (index, field, value) => {
    const englishValue = convertArabicToEnglishNumbers(value);
    const rawValue = englishValue.replace(/\D/g, "");
    const updatedPlans = [...formData.paymentPlans];
    updatedPlans[index] = {
      ...updatedPlans[index],
      [field]: rawValue === "" ? "" : Number(rawValue),
    };
    updateFormData({ paymentPlans: updatedPlans });

    setInvalidFields((prev) => {
      if (field === "price" && value === "") {
        return [...prev, `price-${index}`];
      } else {
        return prev.filter((f) => f !== `price-${index}`);
      }
    });
  };

  const removePaymentPlan = (index) => {
    const updatedPlans = formData.paymentPlans.filter((_, i) => i !== index);
    updateFormData({ paymentPlans: updatedPlans });
  };

  return (
    <div>
      <h3 className="text-xl font-semibold mb-3 text-slate-800">
        {t.saleDetails.financialDetails}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-y-3 gap-x-4">
        {/* Total Price */}
        <FormInput
          label={t.saleDetails.totalPrice}
          name="totalPrice"
          required
          value={formData.totalPrice}
          onChange={(e) => handleChange(e, "money")}
          placeholder="5000000"
          error={invalidFields.includes("totalPrice")}
          type="money"
          adornment="EGP"
        />

        {/* Delivery Date */}
        <FormInput
          label={t.saleDetails.deliveryDate}
          name="deliveryDate"
          required
          value={formData.deliveryDate}
          onChange={handleChange}
          type="date"
          error={invalidFields.includes("deliveryDate")}
        />

        {/* Down Payment */}
        <FormInput
          label={t.saleDetails.downPayment}
          name="downPayment"
          value={formData.downPayment}
          onChange={(e) => handleChange(e, "money")}
          placeholder="200000"
          type="money"
          adornment="EGP"
        />
      </div>

      {/* Payment Plans */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-semibold text-slate-800">
            {t.saleDetails.paymentPlans}
          </h3>
          <button
            type="button"
            onClick={addPaymentPlan}
            className="flex items-center text-sm text-blue-600 hover:text-blue-800"
          >
            <Plus size={18} />
            {t.saleDetails.addPlan}
          </button>
        </div>

        {formData.paymentPlans.length === 0 ? (
          <p className="text-gray-500 italic">{t.saleDetails.noPlans}</p>
        ) : (
          <div className="space-y-3">
            {formData?.paymentPlans?.map((plan, index) => (
              <div
                key={index}
                className="flex items-center gap-4 py-1 border-b border-gray-300 pb-4"
              >
                <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t.saleDetails.years}
                    </label>
                    <input
                      type="text"
                      value={plan.years}
                      required
                      onChange={(e) =>
                        updatePaymentPlan(index, "years", e.target.value)
                      }
                      min="1"
                      className="block w-full rounded-md border border-gray-300 py-1 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label
                      className={`block text-sm font-medium mb-1 ${
                        invalidFields.includes(`price-${index}`)
                          ? "text-red-500"
                          : "text-gray-700"
                      }`}
                    >
                      {t.saleDetails.price}{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      data-format-price
                      placeholder="20000"
                      value={formatPrice(plan.price)}
                      onChange={(e) =>
                        updatePaymentPlan(index, "price", e.target.value)
                      }
                      className={`block w-full rounded-md border py-1 px-3 bg-white focus:outline-none focus:ring-1 appearance-none ${
                        invalidFields.includes(`price-${index}`)
                          ? "border-red-500 ring-red-500"
                          : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t.saleDetails.maintenance}
                    </label>
                    <input
                      type="text"
                      data-format-price
                      placeholder="2000"
                      value={formatPrice(plan.maintenance)}
                      onChange={(e) =>
                        updatePaymentPlan(index, "maintenance", e.target.value)
                      }
                      className="block w-full rounded-md border border-gray-300 py-1 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removePaymentPlan(index)}
                  className="text-red-500 hover:text-red-600 mx-3 mt-4"
                >
                  <Trash2Icon size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
