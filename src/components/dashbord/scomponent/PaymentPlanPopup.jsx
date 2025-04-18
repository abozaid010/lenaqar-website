"use client";
import React, { useState } from "react";
import { X } from "lucide-react";

const PaymentPlanPopup = ({ isOpen, onClose, onAdd }) => {
  const [years, setYears] = useState("");
  const [amount, setAmount] = useState("");
  const [errors, setErrors] = useState({
    years: "",
    amount: ""
  });

  const validate = () => {
    const newErrors = {
      years: !years ? "Years is required" : "",
      amount: !amount ? "Amount is required" : ""
    };
    
    setErrors(newErrors);
    return !newErrors.years && !newErrors.amount;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validate()) return;

    onAdd(`${years}-Years Plan: ${amount} EGP`);
    setYears("");
    setAmount("");
    setErrors({ years: "", amount: "" });
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

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (EGP)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                if (e.target.value) setErrors({...errors, amount: ""});
              }}
              className={`w-full px-4 py-2 rounded-lg border ${
                errors.amount ? "border-red-500" : "border-gray-300"
              } focus:ring-2 focus:ring-primary focus:border-transparent`}
              placeholder="Monthly payment amount"
              min="1"
            />
            {errors.amount && (
              <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
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