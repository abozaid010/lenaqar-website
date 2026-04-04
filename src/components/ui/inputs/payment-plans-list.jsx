"use client";

import AddPaymentPlanDialog from "@/components/ui/add-payment-plan-dialog";
import SearchableDropdownSelect from "@/components/ui/inputs/searchable-dropdown-select";
import { useI18n } from "@/context/translate-api";
import { createPaymentPlan, updatePaymentPlan, fetchPaymentPlans } from "@/utils/api";
import { Edit2, Plus, Trash2, Check } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import toast from "react-hot-toast";

/** Normalize years field: API uses installment_years, legacy used installments_years */
function getPlanYears(plan) {
  return plan?.installment_years ?? plan?.installments_years ?? 0;
}

/** Ensure extra_payments is always an array (API may return object/map keyed by id) */
function normalizePlanExtraPayments(plan) {
  if (!plan) return plan;
  let extra = plan.extra_payments;
  if (Array.isArray(extra)) return { ...plan, extra_payments: extra };
  if (extra && typeof extra === "object" && !Array.isArray(extra)) {
    extra = Object.values(extra);
    return { ...plan, extra_payments: Array.isArray(extra) ? extra : [] };
  }
  return { ...plan, extra_payments: [] };
}

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

  // Fetch default payment plans from backend
  const [defaultPlans, setDefaultPlans] = useState([]);
  const [defaultPlansLoading, setDefaultPlansLoading] = useState(true);
  const [defaultPlansError, setDefaultPlansError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setDefaultPlansLoading(true);
    setDefaultPlansError(null);
    fetchPaymentPlans({ is_common: true, limit: 100 })
      .then((res) => {
        if (cancelled) return;
        // API returns { data: { payment_plans: [...], count } }; each plan may have extra_payments as array or object
        const list = res?.data?.payment_plans;
        const all = Array.isArray(list) ? list : [];
        const commonOnly = all
          .map(normalizePlanExtraPayments);
        setDefaultPlans(commonOnly);
      })
      .catch((err) => {
        if (cancelled) return;
        setDefaultPlansError(err?.message || "Failed to load payment plans");
        setDefaultPlans([]);
      })
      .finally(() => {
        if (!cancelled) setDefaultPlansLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  // Check which default plans are already selected (by id)
  const selectedDefaultPlanIds = useMemo(() => {
    return new Set(plans.filter((plan) => plan.id).map((plan) => plan.id));
  }, [plans]);

  const handleOpenAddDialog = () => {
    setEditingPlan(null);
    setEditingIndex(null);
    setIsAddPlanDialogOpen(true);
  };

  const handleOpenEditDialog = (plan, index) => {
    // When editing a legacy default plan (default_ prefix), remove the ID so it becomes a custom plan
    const planToEdit = plan.id && String(plan.id).startsWith("default_")
      ? { ...plan, id: undefined }
      : plan;
    setEditingPlan(planToEdit);
    setEditingIndex(index);
    setIsAddPlanDialogOpen(true);
  };

  const handleDeletePlan = (index) => {
    const newPlans = [...plans];
    newPlans.splice(index, 1);
    onChange(newPlans);
  };

  const handleSavePlan = async (plan, isEdit) => {
    try {
      let savedPlan;
      
      if (isEdit && editingPlan?.id) {
        // Update existing plan in API
        const result = await updatePaymentPlan(editingPlan.id, plan);
        if (result.error) {
          toast.error(result.error);
          return;
        }
        savedPlan = result.data || plan;
      } else {
        // Create new plan in API
        const result = await createPaymentPlan(plan);
        if (result.error) {
          toast.error(result.error);
          return;
        }
        savedPlan = result.data || plan;
      }
      savedPlan = normalizePlanExtraPayments(savedPlan);

      let newPlans;

      if (isEdit) {
        // Update existing plan in local state
        newPlans = [...plans];
        newPlans[editingIndex] = savedPlan;
      } else {
        // Add new plan to local state
        newPlans = [...plans, savedPlan];
      }

      // Ensure only one payment plan can be default at a time
      if (savedPlan.is_default === true) {
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
      toast.success(isEdit ? "Payment plan updated successfully" : "Payment plan created successfully");
    } catch (error) {
      console.error("Failed to save payment plan:", error);
      toast.error("Failed to save payment plan");
    }
  };

  const formatPercentage = (value) => {
    return (value * 100).toFixed(1) + "%";
  };

  // Custom label function to show all payment plan details
  const getPaymentPlanLabel = (plan, locale) => {
    if (!plan) return "";
    const name = plan.name || "Unnamed Plan";
    const dp = formatPercentage(plan.downpayment_percentage || 0);
    const years = getPlanYears(plan);
    const maintenance = plan.maintenance_fee > 0 ? formatPercentage(plan.maintenance_fee) : "0%";
    
    return `${name} - DP: ${dp}, Years: ${years}, Maintenance: ${maintenance}`;
  };

  // Custom search fields for payment plans
  const paymentPlanSearchFields = ["name", "downpayment_percentage", "installment_years", "installments_years", "maintenance_fee"];

  // Custom renderer for payment plan options
  const renderPaymentPlanOption = (plan, index, isSelected, isHighlighted) => {
    const alreadySelected = selectedDefaultPlanIds.has(plan.id);
    
    return (
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-gray-900 text-sm">
            {plan.name}
          </h4>
          <div className="flex items-center gap-2">
            {alreadySelected && (
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                Added
              </span>
            )}
            {isSelected && (
              <Check size={16} className="text-blue-600 flex-shrink-0" />
            )}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 text-xs text-gray-600">
          <div>
            <span className="font-medium">Downpayment:</span>{" "}
            <span className="text-gray-900">
              {formatPercentage(plan.downpayment_percentage)}
            </span>
          </div>
          <div>
            <span className="font-medium">Years:</span>{" "}
            <span className="text-gray-900">
              {getPlanYears(plan)}
            </span>
          </div>
          <div>
            <span className="font-medium">Maintenance:</span>{" "}
            <span className="text-gray-900">
              {plan.maintenance_fee > 0 
                ? formatPercentage(plan.maintenance_fee)
                : "None"
              }
            </span>
          </div>
        </div>
      </div>
    );
  };

  const handleToggleDefaultPlan = (defaultPlan) => {
    const isSelected = selectedDefaultPlanIds.has(defaultPlan.id);
    
    if (isSelected) {
      // Remove the plan if it's already selected
      const newPlans = plans.filter((plan) => plan.id !== defaultPlan.id);
      // If the removed plan was the default, clear default from all plans
      const updatedPlans = newPlans.map((p) => ({ ...p, is_default: false }));
      onChange(updatedPlans);
    } else {
      // Add the plan if it's not selected (ensure extra_payments is always an array)
      const planToAdd = normalizePlanExtraPayments({
        ...defaultPlan,
        id: defaultPlan.id, // Keep the default ID to track it
        is_default: false, // New plans are not default by default
      });
      const newPlans = [...plans, planToAdd];
      
      // If this is the first plan, make it default automatically
      // Otherwise, if no plan is default, prompt user (handled in UI)
      if (newPlans.length === 1) {
        newPlans[0].is_default = true;
      }
      
      onChange(newPlans);
    }
  };

  const hasPlans = Array.isArray(plans) && plans.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2">
        <label
          className={`block text-sm font-medium ${error ? "text-red-500" : "text-gray-700"}`}
        >
          {t.formLabels?.paymentPlans || "Payment Plans"}{" "}
          {required && <span className="text-red-500">*</span>}
        </label>
        <button
          type="button"
          onClick={handleOpenAddDialog}
          className="flex items-center text-blue-600 text-sm font-medium hover:text-blue-700"
        >
          <Plus size={16} className="mr-1" />
          {t.buttons?.addNew || "Create Custom Plan"}
        </button>
      </div>

      {/* Payment Plans Selection - Always Visible */}
      <div className="border border-gray-200 rounded-md bg-gray-50 p-3">
        <div className="mb-3">
          <span className="text-xs text-gray-700 font-medium">
            {t.formLabels?.selectDefaultPlans || "Select from common payment plans:"}
          </span>
        </div>
        
        <SearchableDropdownSelect
          options={defaultPlans}
          value=""
          onChange={(e) => {
            const selectedPlan = defaultPlans.find(plan => plan.id === e.target.value);
            if (selectedPlan && !selectedDefaultPlanIds.has(selectedPlan.id)) {
              handleToggleDefaultPlan(selectedPlan);
            }
          }}
          name="payment-plan-select"
          placeholder="Search and select payment plans..."
          getLabel={getPaymentPlanLabel}
          getValue={(plan) => plan.id}
          searchFields={paymentPlanSearchFields}
          renderOption={renderPaymentPlanOption}
          isLoading={defaultPlansLoading}
          loadingText={t.formLabels?.loadingPaymentPlans ?? "Loading payment plans…"}
          noResultsText={t.formLabels?.noDefaultPaymentPlans ?? "No payment plans available."}
          searchPlaceholder="Search by name, downpayment, years..."
          className="mb-3"
          disabled={defaultPlansLoading || defaultPlansError || defaultPlans.length === 0}
        />

        {defaultPlansError && (
          <div className="py-3 text-sm text-red-600">
            {defaultPlansError}
          </div>
        )}

        {defaultPlans.length > 0 && (
          <div className="text-xs text-gray-500 text-center">
            {defaultPlans.length} payment plans available • Click to add multiple plans
          </div>
        )}
      </div>

      {/* Selected Plans List */}
      {plans.length > 0 ? (
        <>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">
                {t.formLabels?.selectedPlans || "Selected Plans"} ({plans.length})
              </span>
            </div>
          </div>

          {/* Warning if multiple plans but no default */}
          {plans.length > 1 && !plans.some((p) => p.is_default) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-2">
              <p className="text-xs text-yellow-800">
                {t.formLabels?.selectDefaultPlanWarning || "Please select a default payment plan. Click 'Set Default' on one of the plans below."}
              </p>
            </div>
          )}

          <div
            className={`border ${error ? "border-red-300" : "border-gray-200"} rounded-md overflow-hidden`}
          >
            <ul className="divide-y divide-gray-200">
              {plans.map((plan, index) => {
                const isDefaultPlan = plan.id && plan.id.startsWith("default_");
                return (
                  <li key={plan.id || index} className="p-2 hover:bg-gray-50">
                    <div className="flex justify-between items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-medium text-gray-900 text-sm truncate">
                            {plan.name}
                          </h3>
                          {isDefaultPlan && (
                            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-medium rounded flex-shrink-0">
                              {t.formLabels?.default || "Default"}
                            </span>
                          )}
                          {plan.is_default && (
                            <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] font-medium rounded flex-shrink-0">
                              {t.formLabels?.isDefault || "Primary"}
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 flex items-center gap-3 text-[10px] text-gray-500">
                          <div>
                            <span className="font-medium">DP:</span>{" "}
                            {formatPercentage(plan.downpayment_percentage)}
                          </div>
                          <div>
                            <span className="font-medium">Yrs:</span>{" "}
                            {getPlanYears(plan)}
                          </div>
                          {plan.maintenance_fee > 0 && (
                            <div>
                              <span className="font-medium">Maint:</span>{" "}
                              {formatPercentage(plan.maintenance_fee)}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {plans.length > 1 && !plan.is_default && (
                          <button
                            type="button"
                            onClick={() => {
                              // Set this plan as default
                              const newPlans = plans.map((p, i) => ({
                                ...p,
                                is_default: i === index,
                              }));
                              onChange(newPlans);
                            }}
                            className="px-2 py-1 text-[10px] text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                            title={t.formLabels?.setAsDefault || "Set as default"}
                          >
                            {t.formLabels?.setDefault || "Set Default"}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenEditDialog(plan, index)}
                          className="p-1 text-gray-400 hover:text-blue-500"
                          title={t.buttons?.edit || "Edit"}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePlan(index)}
                          className="p-1 text-gray-400 hover:text-red-500"
                          title={t.buttons?.delete || "Delete"}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      ) : (
        <div
          className={`border ${error ? "border-red-300" : "border-gray-200"} rounded-md p-4 text-center text-gray-500 text-sm`}
        >
          {t.formLabels?.noPaymentPlansHint ||
            "No payment plans selected yet. Select from the available plans above or create a custom plan."}
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
