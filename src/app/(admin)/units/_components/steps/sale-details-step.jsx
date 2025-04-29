"use client";

import { Plus, Trash2Icon } from "lucide-react";

export default function SaleDetailsStep({
  formData,
  updateFormData,
  invalidFields = [],
  setInvalidFields = () => {},
}) {
  const handleChange = (e) => {
    const { name, value } = e.target;

    updateFormData({ [name]: value });
    if (invalidFields.includes(name)) {
      setInvalidFields((prev) => prev.filter((field) => field !== name));
    }

    if (name === "deliveryDate") {
      const today = new Date().toISOString().split("T")[0];
      const deliveryStatus = value > today ? "off-plan" : "ready to move";
      updateFormData({ deliveryStatus });
    }
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
    const updatedPlans = [...formData.paymentPlans];
    updatedPlans[index] = { ...updatedPlans[index], [field]: value };
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
        Financial Details
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-y-3 gap-x-4">
        {/* Total Price */}
        <div className="relative">
          <label
            className={`block text-sm font-medium mb-1 ${
              invalidFields.includes("totalPrice")
                ? "text-red-500"
                : "text-gray-700"
            }`}
          >
            Total Price <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="totalPrice"
            value={formData.totalPrice}
            onChange={handleChange}
            min="0"
            placeholder="5000000"
            className={`block w-full rounded-md border py-1 px-3 bg-white focus:outline-none focus:ring-1 appearance-none ${
              invalidFields.includes("totalPrice")
                ? "border-red-500 ring-red-500"
                : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            }`}
          />
          <span className="absolute bottom-1 right-1.5 text-gray-400">EGP</span>
        </div>

        {/* Delivery Date */}
        <div>
          <label
            className={`block text-sm font-medium mb-1 ${
              invalidFields.includes("deliveryDate")
                ? "text-red-500"
                : "text-gray-700"
            }`}
          >
            Delivery Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="deliveryDate"
            value={formData.deliveryDate}
            onChange={handleChange}
            className={`block w-full rounded-md border py-1 px-3 bg-white focus:outline-none focus:ring-1 appearance-none ${
              invalidFields.includes("deliveryDate")
                ? "border-red-500 ring-red-500"
                : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            }`}
          />
        </div>

        {/* Down Payment */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Down Payment
          </label>
          <input
            type="number"
            name="downPayment"
            value={formData.downPayment}
            onChange={handleChange}
            min="0"
            placeholder="200000"
            className="block w-full rounded-md border border-gray-300 py-1 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
          <span className="absolute bottom-1 right-1.5 text-gray-400">EGP</span>
        </div>
      </div>

      {/* Payment Plans */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-semibold text-slate-800">
            Payment Plans
          </h3>
          <button
            type="button"
            onClick={addPaymentPlan}
            className="flex items-center text-sm text-blue-600 hover:text-blue-800"
          >
            <Plus size={18} />
            Add Plan
          </button>
        </div>

        {formData.paymentPlans.length === 0 ? (
          <p className="text-gray-500 italic">No payment plans added yet.</p>
        ) : (
          <div className="space-y-3">
            {formData.paymentPlans.map((plan, index) => (
              <div
                key={index}
                className="flex items-center gap-4 py-1 border-b border-gray-300 pb-4"
              >
                <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Years
                    </label>
                    <input
                      type="number"
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
                      Price <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      placeholder="20000"
                      value={plan.price}
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
                      Maintenance
                    </label>
                    <input
                      type="number"
                      placeholder="2000"
                      value={plan.maintenance}
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
