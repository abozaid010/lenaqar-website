"use client";

import AddPaymentPlanDialog from "@/components/ui/add-payment-plan-dialog";
import { useI18n } from "@/context/translate-api";
import { Edit2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

export default function PaymentPlansList({
  plans = [],
  onChange,
  error,
  required = false,
}) {
  const { t } = useI18n();

  const [isAddPlanDialogOpen, setIsAddPlanDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);

  const handleOpenAddDialog = () => {
    setEditingPlan(null);
    setEditingIndex(null);
    setIsAddPlanDialogOpen(true);
  };

  const handleOpenEditDialog = (plan, index) => {
    setEditingPlan(plan);
    setEditingIndex(index);
    setIsAddPlanDialogOpen(true);
  };

  const handleDeletePlan = (index) => {
    const newPlans = [...plans];
    newPlans.splice(index, 1);
    onChange(newPlans);
  };

  const handleSavePlan = (plan, isEdit) => {
    let newPlans;

    if (isEdit) {
      // Update existing plan
      newPlans = [...plans];
      newPlans[editingIndex] = plan;
    } else {
      // Add new plan
      newPlans = [...plans, plan];
    }

    // Ensure only one payment plan can be default at a time
    if (plan.is_default === true) {
      newPlans = newPlans.map((p, index) => {
        // If this is the plan being saved, keep its is_default value
        if (isEdit && index === editingIndex) {
          return p;
        }
        if (!isEdit && index === newPlans.length - 1) {
          return p;
        }
        // Otherwise, set is_default to false
        return { ...p, is_default: false };
      });
    }

    onChange(newPlans);
  };

  const formatPercentage = (value) => {
    return (value * 100).toFixed(1) + "%";
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center mb-2">
        <label
          className={`block text-sm font-medium ${error ? "text-red-500" : "text-gray-700 dark:text-gray-300"}`}
        >
          {t.formLabels?.paymentPlans || "Payment Plans"}{" "}
          {required && <span className="text-red-500">*</span>}
        </label>
        <button
          type="button"
          onClick={handleOpenAddDialog}
          className="flex items-center text-blue-600 dark:text-blue-400 text-sm font-medium hover:text-blue-700 dark:hover:text-blue-300"
        >
          <Plus size={16} className="mr-1" />
          {t.buttons?.addNew || "Add Plan"}
        </button>
      </div>

      {plans.length === 0 ? (
        <div
          className={`border ${error ? "border-red-300 dark:border-red-700" : "border-gray-200 dark:border-gray-700"} rounded-md p-4 text-center text-gray-500 dark:text-gray-400 text-sm`}
        >
          {t.noPaymentPlans || "No payment plans added yet"}
        </div>
      ) : (
        <div
          className={`border ${error ? "border-red-300 dark:border-red-700" : "border-gray-200 dark:border-gray-700"} rounded-md overflow-hidden`}
        >
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {plans.map((plan, index) => (
              <li key={index} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">{plan.name}</h3>
                    <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                      <div>
                        <span className="font-medium">
                          {t.downPayment || "Down Payment"}:
                        </span>{" "}
                        {formatPercentage(plan.downpayment_percentage)}
                      </div>
                      <div>
                        <span className="font-medium">
                          {t.installmentYears || "Years"}:
                        </span>{" "}
                        {plan.installment_years}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEditDialog(plan, index)}
                      className="p-1 text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePlan(index)}
                      className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}

      <AddPaymentPlanDialog
        isOpen={isAddPlanDialogOpen}
        onClose={() => setIsAddPlanDialogOpen(false)}
        onSave={handleSavePlan}
        existingPlan={editingPlan}
      />
    </div>
  );
}
