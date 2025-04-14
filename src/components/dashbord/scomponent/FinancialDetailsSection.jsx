import React from "react";
import { Plus, X } from "lucide-react";

const FinancialDetailsSection = ({
  formik,
  setIsPaymentPlanPopupOpen,
  handleRemovePaymentPlan,
}) => {
  return (
    <div className="mb-8">
      <h3 className="text-xl font-semibold text-gray-700 mb-4">
        Financial Details
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Down Payment
          </label>
          <input
            type="number"
            name="downPayment"
            min="0"
            value={formik.values.downPayment}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              if (value < 0) e.target.value = 0;
              formik.handleChange(e);
            }}
            onBlur={formik.handleBlur}
            className={`w-full px-4 py-2 rounded-lg border ${
              formik.touched.downPayment && formik.errors.downPayment
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-primary"
            } focus:border-transparent`}
          />
          {formik.touched.downPayment && formik.errors.downPayment && (
            <p className="mt-1 text-sm text-red-500">
              {formik.errors.downPayment}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Delivery Date
          </label>
          <input
            type="date"
            name="deliveryDate"
            value={formik.values.deliveryDate}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className={`w-full px-4 py-2 rounded-lg border ${
              formik.touched.deliveryDate && formik.errors.deliveryDate
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-primary"
            } focus:border-transparent`}
          />
          {formik.touched.deliveryDate && formik.errors.deliveryDate && (
            <p className="mt-1 text-sm text-red-500">
              {formik.errors.deliveryDate}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Total Price
          </label>
          <input
            type="number"
            name="totalPrice"
            min="0"
            value={formik.values.totalPrice}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              if (value < 0) e.target.value = 0;
              formik.handleChange(e);
            }}
            onBlur={formik.handleBlur}
            className={`w-full px-4 py-2 rounded-lg border ${
              formik.touched.totalPrice && formik.errors.totalPrice
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-primary"
            } focus:border-transparent`}
          />
          {formik.touched.totalPrice && formik.errors.totalPrice && (
            <p className="mt-1 text-sm text-red-500">
              {formik.errors.totalPrice}
            </p>
          )}
        </div>

        <div className="md:col-span-3">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Payment Plans
            </label>
            <button
              type="button"
              onClick={() => setIsPaymentPlanPopupOpen(true)}
              className="flex items-center text-xs text-primary hover:text-primary/80"
            >
              <Plus className="w-3 h-3 mr-1" /> Add Plan
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {!formik.values.paymentPlans ? (
              <p className="text-sm text-gray-500 italic">
                No payment plans added yet.
              </p>
            ) : (
              formik.values.paymentPlans
                .split(", ")
                .map((plan, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm"
                  >
                    <span>{plan}</span>
                    <button
                      type="button"
                      onClick={() => handleRemovePaymentPlan(index)}
                      className="text-gray-500 hover:text-red-500 ml-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))
            )}
          </div>
          {formik.touched.paymentPlans && formik.errors.paymentPlans && (
            <p className="mt-1 text-sm text-red-500">
              {formik.errors.paymentPlans}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinancialDetailsSection;