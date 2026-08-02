"use client";

import { updateUserInfo, extractUpdatedLeadFromUserInfoResponse } from "@/utils/api";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { PhoneField } from "@/components/phone/PhoneField";
import { phoneToE164 } from "@/components/phone/phone-utils";
import { useI18n } from "@/hooks/useI18n";
import UnifiedDialog from "@/components/ui/UnifiedDialog";
import {
  OWNER_TYPES,
  getOwnerTypeLabel,
  normalizeOwnerType,
} from "@/constants/owner-type";

function toDialogPhoneValue(raw) {
  const trimmed = typeof raw === "string" ? raw.trim() : "";
  if (!trimmed) return "";
  return phoneToE164(trimmed, "EG") || trimmed;
}

/**
 * Form body — mounts only while open so fields always hydrate from current lead props
 * (fixes mobile: stale empty state when the dialog stayed mounted while closed).
 */
function EditUserInfoForm({
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
  const seededPhone = toDialogPhoneValue(initialPhone);
  const [name, setName] = useState(() => initialName || "");
  const [phone, setPhone] = useState(() => seededPhone);
  const [company, setCompany] = useState(() => initialCompany || "");
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

  // If lead props refresh while the dialog stays open, keep fields in sync.
  useEffect(() => {
    setName(initialName || "");
    setPhone(toDialogPhoneValue(initialPhone));
    setCompany(initialCompany || "");
    setOwnerType(normalizeOwnerType(initialOwnerType) || "");
  }, [initialName, initialPhone, initialCompany, initialOwnerType]);

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (!userId || pending) return;

    const payload = { user_id: userId };
    const trimmedName = name.trim();
    const trimmedPhone = (phone || "").trim();
    const trimmedCompany = company.trim();
    const trimmedNewNote = newNote.trim();
    const normalizedInitialOwnerType = normalizeOwnerType(initialOwnerType) || "";
    const normalizedInitialPhone = toDialogPhoneValue(initialPhone);

    if (trimmedName !== (initialName || "").trim()) payload.name = trimmedName;
    if (trimmedPhone !== normalizedInitialPhone) {
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
    <UnifiedDialog
      isOpen
      onClose={onClose}
      title={translate("editContact.title", "Edit contact")}
      cancelLabel={common.cancel}
      onCancel={onClose}
      submitLabel={
        pending
          ? translate("common.saving", "Saving…")
          : common.save
      }
      onSubmit={handleSubmit}
      submitDisabled={pending}
      submitLoading={pending}
      closeOnEscape
      dialogClassName="max-w-md"
      bodyClassName="!p-3 space-y-2 text-sm"
    >
      <form onSubmit={handleSubmit} className="space-y-2">
        <div>
          <label className="block text-xs text-gray-600 mb-0.5">
            {translate("editContact.name", "Name")}
          </label>
          <input
            className="w-full border border-gray-200 rounded px-2 py-2 min-h-10 lg:py-1.5 lg:min-h-0 text-base lg:text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
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
            autoComplete="organization"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-0.5">
            {translate("editContact.ownerType", "Lead type")}
          </label>
          <select
            className="w-full border border-gray-200 rounded px-2 py-1.5 bg-white min-h-10"
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
            className="w-full border border-gray-200 rounded px-2 py-1.5 min-h-[72px] resize-y text-base lg:text-sm"
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
      </form>
    </UnifiedDialog>
  );
}

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
  if (!open) return null;

  return (
    <EditUserInfoForm
      key={userId || "edit-contact"}
      onClose={onClose}
      userId={userId}
      initialName={initialName}
      initialPhone={initialPhone}
      initialCompany={initialCompany}
      initialOwnerType={initialOwnerType}
      initialNotes={initialNotes}
      onSuccess={onSuccess}
    />
  );
}
