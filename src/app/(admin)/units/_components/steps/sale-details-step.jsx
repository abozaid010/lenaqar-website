"use client";

import FormInput from "@/components/ui/inputs/form-input";
import { useI18n } from "@/context/translate-api";
import { convertArabicToEnglishNumbers } from "@/utils/formatters";
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
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-4">
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
                className="flex items-center py-1 border-b border-gray-300 pb-4"
              >
                <div className="flex-grow grid grid-cols-1 md:grid-cols-7 gap-1.5">
                  <FormInput
                    label={t.saleDetails.years}
                    placeholder={"1"}
                    name={`years-${index}`}
                    required
                    value={plan.years}
                    onChange={(e) =>
                      updatePaymentPlan(index, "years", e.target.value)
                    }
                    error={invalidFields.includes(`year-${index}`)}
                    type="number"
                  />

                  <div className="col-span-2">
                    <FormInput
                      label={t.saleDetails.price}
                      name={`price-${index}`}
                      required
                      value={plan.price}
                      onChange={(e) =>
                        updatePaymentPlan(index, "price", e.target.value)
                      }
                      placeholder="500000"
                      error={invalidFields.includes(`price-${index}`)}
                      type="money"
                      adornment="EGP"
                    />
                  </div>

                  <div className="col-span-2">
                    <FormInput
                      label={t.saleDetails.downPayment}
                      name={`downPayment-${index}`}
                      required
                      value={plan.downPayment}
                      onChange={(e) =>
                        updatePaymentPlan(index, "downPayment", e.target.value)
                      }
                      placeholder="20000"
                      error={invalidFields.includes(`downPayment-${index}`)}
                      type="money"
                      adornment="EGP"
                    />
                  </div>

                  <div className="col-span-2">
                    <FormInput
                      label={t.saleDetails.maintenance}
                      name={`maintenance-${index}`}
                      value={plan.maintenance}
                      onChange={(e) =>
                        updatePaymentPlan(index, "maintenance", e.target.value)
                      }
                      placeholder="2000"
                      type="money"
                      adornment="EGP"
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
    </>
  );
}
