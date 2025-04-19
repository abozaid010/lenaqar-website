import React from "react";
import { Plus, X } from "lucide-react";
import propertyEnums from "../../data/propertyEnums.json";

const PricingSection = ({ 
  formData, 
  handleChange, 
  setIsPaymentPlanPopupOpen, 
  handleRemovePaymentPlan 
}) => {
  return (
    <div className="mb-8">
      <h3 className="text-xl font-semibold text-gray-700 mb-4">
        Pricing & Payment
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Total Price
          </label>
          <input
            type="number"
            name="totalPrice"
            value={formData.totalPrice}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Down Payment
          </label>
          <input
            type="number"
            name="downPayment"
            value={formData.downPayment}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Delivery Date
          </label>
          <input
            type="date"
            name="deliveryDate"
            value={formData.deliveryDate}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Delivery Status
          </label>
          <select
            name="deliveryStatus"
            value={formData.deliveryStatus || ""}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">Select Delivery Status</option>
            {propertyEnums.EnumPropertyStatus.map((status, index) => (
              <option
                key={index}
                value={status}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div> */}

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
          {console.log(formData.paymentPlans)}

          <div className="flex flex-wrap gap-2">
            {!formData.paymentPlans ? (
              <p className="text-sm text-gray-500 italic">
                No payment plans added yet.
              </p>
            ) : (
              <div className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm">
                <span>
                  {formData.paymentPlans.years} Years - 
                  {formData.paymentPlans.price} EGP - 
                  {formData.paymentPlans.maintenance} EGP Maintenance
                </span>
                <button
                  type="button"
                  onClick={() => handleRemovePaymentPlan()}
                  className="text-gray-500 hover:text-red-500 ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingSection;