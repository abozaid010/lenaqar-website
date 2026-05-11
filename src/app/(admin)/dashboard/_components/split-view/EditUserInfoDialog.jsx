"use client";

import { updateUserInfo } from "@/utils/api";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { PhoneField } from "@/components/phone/PhoneField";
import { useI18n } from "@/hooks/useI18n";

export default function EditUserInfoDialog({
  open,
  onClose,
  userId,
  initialName = "",
  initialPhone = "",
  initialCompany = "",
  onSuccess,
}) {
  const { t, translate } = useI18n();
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [company, setCompany] = useState(initialCompany);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (open) {
      setName(initialName);
      setPhone(initialPhone);
      setCompany(initialCompany);
    }
  }, [open, initialName, initialPhone, initialCompany]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) return;
    setPending(true);
    try {
      const res = await updateUserInfo({
        user_id: userId,
        name: name.trim(),
        phone_number: phone.trim(),
        company_name: company.trim(),
      });
      if (res?.status === false && res?.message) {
        toast.error(t?.common?.requirementsSaved);
        return;
      }
      toast.success(t?.common?.contactUpdated);
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(t?.common?.updateFailed);
      toast.error(err?.message || "Update failed");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-3">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="text-sm font-semibold text-gray-900">Edit contact</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-3 space-y-2 text-sm">
          <div>
            <label className="block text-xs text-gray-600 mb-0.5">Name</label>
            <input
              className="w-full border border-gray-200 rounded px-2 py-1.5"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <PhoneField
            className="w-full"
            label={translate("phoneField.label", "Phone number")}
            value={phone ?? ""}
            onChange={(next) => setPhone(next ?? "")}
            defaultCountry="EG"
          />
          <div>
            <label className="block text-xs text-gray-600 mb-0.5">Company</label>
            <input
              className="w-full border border-gray-200 rounded px-2 py-1.5"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="px-3 py-1.5 text-xs bg-primary text-white rounded disabled:opacity-60"
            >
              {pending ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
