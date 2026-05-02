"use client";

import { useState } from "react";
import { X, Loader2, UserPlus } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import LenaTextField from "@/components/ui/inputs/lena-text-field";
import LenaTextarea from "@/components/ui/inputs/lena-textarea";
import { useAddLead } from "@/hooks/use-add-lead";

export default function AddLeadDialog({ isOpen, onClose, clientId }) {
  const { t, translate, locale } = useI18n();
  const isRTL = locale === "ar";
  
  const [formData, setFormData] = useState({
    user_name: "",
    phone_number: "",
    query: "",
  });

  const { addNewLead, isSubmitting } = useAddLead({
    clientId,
    onSuccess: () => {
      setFormData({ user_name: "", phone_number: "", query: "" });
      onClose();
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await addNewLead(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        dir={isRTL ? "rtl" : "ltr"}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <UserPlus className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {translate("dashboardFilter.ADD", t?.dashboardFilter?.ADD || "Add New Lead")}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors focus:outline-none"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <LenaTextField
            label={translate("clientsTable.headers.name", t?.clientsTable?.headers?.name || "Name")}
            name="user_name"
            value={formData.user_name}
            onChange={handleChange}
            required
            placeholder={isRTL ? "أدخل اسم العميل" : "Enter lead name"}
            autoFocus
          />

          <LenaTextField
            label={translate("clientsTable.headers.userNumber", t?.clientsTable?.headers?.userNumber || "Number")}
            name="phone_number"
            value={formData.phone_number}
            onChange={handleChange}
            required
            placeholder="+201012345678"
            type="tel"
            hint={isRTL ? "يرجى تضمين رمز الدولة (مثال: +20)" : "Please include country code (e.g. +20)"}
          />

          <LenaTextarea
            label={translate("dashboardFilter.notes", t?.dashboardFilter?.notes || "Notes")}
            name="query"
            value={formData.query}
            onChange={handleChange}
            placeholder={isRTL ? "أدخل أي ملاحظات إضافية..." : "Enter any additional notes..."}
            rows={3}
          />

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {translate("common.cancel", t?.common?.cancel || "Cancel")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-2 px-4 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-all shadow-sm hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{translate("common.adding", t?.common?.adding || "Adding...")}</span>
                </>
              ) : (
                <span>{translate("common.save", t?.common?.save || "Save Lead")}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
