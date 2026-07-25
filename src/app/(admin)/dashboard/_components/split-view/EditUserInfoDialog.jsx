"use client";

import { updateUserInfo, extractUpdatedLeadFromUserInfoResponse } from "@/utils/api";
import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { PhoneField } from "@/components/phone/PhoneField";
import { useI18n } from "@/hooks/useI18n";
import {
  OWNER_TYPES,
  getOwnerTypeLabel,
  normalizeOwnerType,
} from "@/constants/owner-type";

export default function EditUserInfoDialog({
  open,
  onClose,
  userId,
  initialName = "",
  initialPhone = "",
  initialCompany = "",
  initialOwnerType = null,
  initialNotes = "",
  onSuccess,
}) {
  const { translate, common } = useI18n();
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [company, setCompany] = useState(initialCompany);
  const [ownerType, setOwnerType] = useState(
    () => normalizeOwnerType(initialOwnerType) || "",
  );
  const [newNote, setNewNote] = useState("");
  const [pending, setPending] = useState(false);

  const existingNotes = useMemo(
    () => (typeof initialNotes === "string" ? initialNotes.trim() : ""),
    [initialNotes],
  );

  const ownerTypeOptions = useMemo(
    () =>
      OWNER_TYPES.map((value) => ({
        value,
        label: getOwnerTypeLabel(value, translate),
      })),
    [translate],
  );

  useEffect(() => {
    if (open) {
      setName(initialName || "");
      setPhone(initialPhone || "");
      setCompany(initialCompany || "");
      setOwnerType(normalizeOwnerType(initialOwnerType) || "");
      setNewNote("");
    }
  }, [open, initialName, initialPhone, initialCompany, initialOwnerType]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) return;

    const payload = { user_id: userId };
    const trimmedName = name.trim();
    const trimmedPhone = (phone || "").trim();
    const trimmedCompany = company.trim();
    const trimmedNewNote = newNote.trim();
    const normalizedInitialOwnerType = normalizeOwnerType(initialOwnerType) || "";

    if (trimmedName !== (initialName || "").trim()) payload.name = trimmedName;
    if (trimmedPhone !== (initialPhone || "").trim()) {
      payload.phone_number = trimmedPhone;
    }
    if (trimmedCompany !== (initialCompany || "").trim()) {
      payload.company_name = trimmedCompany;
    }
    if (ownerType && ownerType !== normalizedInitialOwnerType) {
      payload.owner_type = ownerType;
    }
    if (trimmedNewNote) payload.notes = trimmedNewNote;

    if (Object.keys(payload).length === 1) {
      onClose();
      return;
    }

    setPending(true);
    try {
      const res = await updateUserInfo(payload);
      const updatedLead = extractUpdatedLeadFromUserInfoResponse(res);

      if (res?.status === false) {
        toast.error(
          res?.error_message ||
            res?.message ||
            translate("common.updateFailed", "Update failed"),
        );
        return;
      }

      toast.success(translate("common.contactUpdated", "Contact updated"));
      onSuccess?.(updatedLead, res, payload);
      onClose();
    } catch (err) {
      toast.error(
        err?.message || translate("common.updateFailed", "Update failed"),
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-3">
      <div className="bg-white rounded-t-2xl sm:rounded-lg shadow-xl w-full max-w-md max-h-[90dvh] overflow-y-auto">
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="text-sm font-semibold text-gray-900">
            {translate("editContact.title", "Edit contact")}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center min-h-10 min-w-10 text-gray-400 hover:text-gray-600"
            aria-label={common.cancel}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-3 space-y-2 text-sm">
          <div>
            <label className="block text-xs text-gray-600 mb-0.5">
              {translate("editContact.name", "Name")}
            </label>
            <input
              className="w-full border border-gray-200 rounded px-2 py-2 min-h-10 lg:py-1.5 lg:min-h-0 text-base lg:text-sm"
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
            <label className="block text-xs text-gray-600 mb-0.5">
              {translate("editContact.company", "Company / Agency")}
            </label>
            <input
              className="w-full border border-gray-200 rounded px-2 py-2 min-h-10 lg:py-1.5 lg:min-h-0 text-base lg:text-sm"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-0.5">
              {translate("editContact.ownerType", "Lead type")}
            </label>
            <select
              className="w-full border border-gray-200 rounded px-2 py-1.5 bg-white"
              value={ownerType}
              onChange={(e) => setOwnerType(e.target.value)}
            >
              <option value="">
                {translate("editContact.ownerTypePlaceholder", "Not set")}
              </option>
              {ownerTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-0.5">
              {translate("editContact.notes", "Notes")}
            </label>
            {existingNotes ? (
              <p className="mb-2 rounded border border-gray-100 bg-gray-50 px-2 py-1.5 text-xs text-gray-700 whitespace-pre-wrap">
                {existingNotes}
              </p>
            ) : null}
            <textarea
              className="w-full border border-gray-200 rounded px-2 py-1.5 min-h-[72px] resize-y"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder={translate(
                "editContact.notesPlaceholder",
                "Add a note...",
              )}
            />
            <p className="mt-0.5 text-[11px] text-gray-500">
              {translate(
                "editContact.notesHint",
                "New note is appended, not overwritten.",
              )}
            </p>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded"
            >
              {common.cancel}
            </button>
            <button
              type="submit"
              disabled={pending}
              className="px-3 py-1.5 text-xs bg-primary text-white rounded disabled:opacity-60"
            >
              {pending
                ? translate("common.saving", "Saving…")
                : common.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
