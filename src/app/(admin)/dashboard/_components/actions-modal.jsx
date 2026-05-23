"use client";

import { useI18n } from "@/hooks/useI18n";
import { USER_ACTIONS, getActionLabel } from "@/utils/actions";
import { formatDateForDisplay } from "@/utils/formateDate";
import { getClientActions, updateUserAction } from "@/utils/api";
import { Pencil, X } from "lucide-react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import NewActionForm from "./new-action-form";
const NOPREFRERED_TIME = [
  "Qualified lead",
  "Not interested",
  "Not qualified",
  "Follow up later",
  "Missing requirement",
];
export default function ActionsModal({
  actions,
  onClose,
  userId,
  phoneNumber,
  name,
  onActionUpdate,
}) {
  const { locale, translate } = useI18n();
  const [actionItems, setActionItems] = useState(actions || []);
  const [editingIndex, setEditingIndex] = useState(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    action: "",
    comment: "",
    meeting_time: "",
  });
  const aiActionsTitle = translate(
    "actionForm.aiAction",
    locale === "ar" ? "إجراءات الذكاء الاصطناعي" : "AI Actions"
  );
  const closeLabel = translate(
    "buttons.close",
    locale === "ar" ? "إغلاق" : "Close"
  );
  const editActionLabel = translate(
    "common.edit",
    locale === "ar" ? "تعديل" : "Edit"
  );
  const commentPlaceholder = translate(
    "actionForm.commentPlaceholder",
    locale === "ar" ? "أضف تعليقًا" : "Comment"
  );
  const cancelLabel = translate(
    "buttons.cancel",
    locale === "ar" ? "إلغاء" : "Cancel"
  );
  const savingLabel = translate(
    "common.saving",
    locale === "ar" ? "جارٍ الحفظ..." : "Saving..."
  );
  const saveLabel = translate(
    "buttons.save",
    locale === "ar" ? "حفظ" : "Save"
  );

  const actionOptions = useMemo(
    () =>
      USER_ACTIONS.filter((item) => item.value && item.value !== "all").map(
        (item) => ({
          value: item.value,
          label: getActionLabel(item.value, locale),
        })
      ),
    [locale]
  );

  const latestEditableIndex = useMemo(() => {
    for (let i = actionItems.length - 1; i >= 0; i -= 1) {
      const row = actionItems[i];
      if (row?.author?.trim()) return i;
    }
    return -1;
  }, [actionItems]);

  const toDateTimeLocalValue = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return typeof value === "string" ? value.slice(0, 16) : "";
    }
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const hh = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${d}T${hh}:${mm}`;
  };

  const toApiDateTime = (value) => {
    if (!value) return null;
    return value.length === 16 ? `${value}:00` : value;
  };

  const startEdit = (item, idx) => {
    setEditingIndex(idx);
    setEditForm({
      action: item?.action || actionOptions[0]?.value || "",
      comment: item?.comment || "",
      meeting_time: toDateTimeLocalValue(item?.meeting_time),
    });
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditForm({ action: "", comment: "", meeting_time: "" });
  };

  const saveEdit = async () => {
    if (!userId) return;
    try {
      setIsSavingEdit(true);
      await updateUserAction(userId, {
        action: editForm.action,
        comment: editForm.comment,
        meeting_time: toApiDateTime(editForm.meeting_time),
        phone_number: phoneNumber || undefined,
        name: name || undefined,
      });
      const refreshed = await getClientActions(userId);
      setActionItems(Array.isArray(refreshed) ? refreshed : []);
      onActionUpdate?.(userId, editForm.action);
      toast.success(
        translate(
          "actionForm.successMessage",
          locale === "ar" ? "تم تحديث الإجراء بنجاح" : "Action updated successfully"
        )
      );
      cancelEdit();
    } catch (error) {
      toast.error(error?.response?.data?.detail || error?.message || "Failed to update action");
    } finally {
      setIsSavingEdit(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 bg-opacity-50 p-4">
      <div className="relative w-full max-w-xl max-h-full bg-white rounded-lg shadow-lg">
        <div className="flex justify-between items-center p-3">
          <h3 className="text-lg font-semibold text-gray-800 text-center flex-1">
            {aiActionsTitle}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none cursor-pointer"
            aria-label={closeLabel}
          >
            <X size={20} />
          </button>
        </div>

        {actionItems?.length > 0 && (
          <div className="px-4 py-2 space-y-4 max-h-[320px] overflow-y-auto bg-gray-50/50">
            {actionItems.map((a, idx) => {
              const isAI = !a.author?.trim();
              const authorLabel = isAI ? "AI" : a.author;
              const canEdit = idx === latestEditableIndex && !isAI;
              const isEditing = editingIndex === idx;

              return (
                <div
                  key={idx}
                  className={`flex flex-col ${isAI ? "items-start" : "items-end"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 shadow-sm border ${
                      isAI
                        ? "bg-white border-gray-200 rounded-tl-none"
                        : "bg-blue-50 border-blue-100 rounded-tr-none text-right"
                    }`}
                  >
                    <div
                      className={`flex items-center gap-2 mb-1 ${
                        isAI ? "flex-row" : "flex-row-reverse"
                      }`}
                    >
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => startEdit(a, idx)}
                          className="p-1 rounded hover:bg-blue-100 text-blue-600"
                          aria-label={editActionLabel}
                          title={editActionLabel}
                        >
                          <Pencil size={14} />
                        </button>
                      )}
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                          isAI
                            ? "bg-gray-100 text-gray-500"
                            : "bg-blue-600 text-white"
                        }`}
                      >
                        {authorLabel}
                      </span>
                      <small className="text-gray-400 text-[10px] font-medium">
                        {formatDateForDisplay(a.created_at, false)}
                      </small>
                    </div>

                    <p className="font-bold text-sm text-gray-800 mb-1">
                      {a.action}
                    </p>

                    <p className="text-xs text-gray-600 leading-relaxed">
                      {a.comment}
                    </p>

                    {a.partner && (
                      <div className="mt-2 p-2 bg-white/60 border border-blue-200 rounded-lg flex flex-col gap-0.5">
                        <span className="text-[11px] font-semibold text-primary">
                          Partner: {a.partner.partner_name}
                        </span>
                        <span className="text-[10px] text-primary/80">
                          {a.partner.partner_phone}
                        </span>
                      </div>
                    )}

                    {!NOPREFRERED_TIME.includes(a.action) && a.meeting_time && (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <small className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded">
                          {formatDateForDisplay(a.meeting_time)}
                        </small>
                      </div>
                    )}

                    {isEditing && (
                      <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                        <select
                          value={editForm.action}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              action: e.target.value,
                            }))
                          }
                          className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-xs"
                        >
                          {actionOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>

                        <input
                          type="datetime-local"
                          value={editForm.meeting_time}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              meeting_time: e.target.value,
                            }))
                          }
                          className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-xs"
                        />

                        <textarea
                          value={editForm.comment}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              comment: e.target.value,
                            }))
                          }
                          rows={3}
                          className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-xs resize-none"
                          placeholder={commentPlaceholder}
                        />

                        <div className="flex gap-2 justify-end">
                          <button
                            type="button"
                            onClick={cancelEdit}
                            disabled={isSavingEdit}
                            className="px-2 py-1 text-xs border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 disabled:opacity-60"
                          >
                            {cancelLabel}
                          </button>
                          <button
                            type="button"
                            onClick={saveEdit}
                            disabled={isSavingEdit}
                            className="px-2 py-1 text-xs rounded-md bg-primary text-white hover:bg-primary/90 disabled:opacity-60"
                          >
                            {isSavingEdit
                              ? savingLabel
                              : saveLabel}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <NewActionForm
          userId={userId}
          phoneNumber={phoneNumber}
          name={name}
          onSuccess={onClose}
          onActionUpdate={onActionUpdate}
        />
      </div>
    </div>
  );
}
