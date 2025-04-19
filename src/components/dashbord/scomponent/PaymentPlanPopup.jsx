"use client";
import React, { useState } from "react";
import { X } from "lucide-react";

const PaymentPlanPopup = ({ isOpen, onClose, onAdd }) => {
  const [years, setYears] = useState("");
  const [price, setPrice] = useState("");
  const [maintenance, setMaintenance] = useState("");
  const [errors, setErrors] = useState({
    years: "",
    price: "",
    maintenance: ""
  });

  const validate = () => {
    const newErrors = {
      years: !years ? "Years is required" : "",
      price: !price ? "Price is required" : "",
      maintenance: !maintenance ? "Maintenance is required" : ""
    };
    
    setErrors(newErrors);
    return !newErrors.years && !newErrors.price && !newErrors.maintenance;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validate()) return;

    // Pass an object with the payment plan data
    onAdd({
      years: Number(years),
      price: Number(price),
      maintenance: Number(maintenance)
    });
    
    // Reset form
    setYears("");
    setPrice("");
    setMaintenance("");
    setErrors({ years: "", price: "", maintenance: "" });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Add Payment Plan</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Years
            </label>
            <input
              type="number"
              value={years}
              onChange={(e) => {
                setYears(e.target.value);
                if (e.target.value) setErrors({...errors, years: ""});
              }}
              className={`w-full px-4 py-2 rounded-lg border ${
                errors.years ? "border-red-500" : "border-gray-300"
              } focus:ring-2 focus:ring-primary focus:border-transparent`}
              placeholder="Number of years"
              min="1"
            />
            {errors.years && (
              <p className="text-red-500 text-sm mt-1">{errors.years}</p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price (EGP)
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => {
                setPrice(e.target.value);
                if (e.target.value) setErrors({...errors, price: ""});
              }}
              className={`w-full px-4 py-2 rounded-lg border ${
                errors.price ? "border-red-500" : "border-gray-300"
              } focus:ring-2 focus:ring-primary focus:border-transparent`}
              placeholder="Total price"
              min="1"
            />
            {errors.price && (
              <p className="text-red-500 text-sm mt-1">{errors.price}</p>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Maintenance (EGP)
            </label>
            <input
              type="number"
              value={maintenance}
              onChange={(e) => {
                setMaintenance(e.target.value);
                if (e.target.value) setErrors({...errors, maintenance: ""});
              }}
              className={`w-full px-4 py-2 rounded-lg border ${
                errors.maintenance ? "border-red-500" : "border-gray-300"
              } focus:ring-2 focus:ring-primary focus:border-transparent`}
              placeholder="Maintenance cost"
              min="0"
            />
            {errors.maintenance && (
              <p className="text-red-500 text-sm mt-1">{errors.maintenance}</p>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 mr-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              Add Plan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentPlanPopup;