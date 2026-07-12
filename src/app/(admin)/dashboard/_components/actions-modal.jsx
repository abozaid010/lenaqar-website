"use client";

import { useI18n } from "@/hooks/useI18n";
import { USER_ACTIONS, getActionLabel } from "@/utils/actions";
import { formatDateForDisplay } from "@/utils/formateDate";
import { getClientActions, updateUserAction } from "@/utils/api";
import { ChevronDown, ChevronUp, Pencil, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import NewActionForm from "./new-action-form";

const NOPREFRERED_TIME = [
  "Qualified lead",
  "Not interested",
  "Not qualified",
  "Follow up later",
  "Missing requirement",
];

const INITIAL_VISIBLE_ACTIONS = 5;
const NOTES_COLLAPSE_LENGTH = 120;

function ActivityTimelineItem({
  item,
  canEdit,
  isEditing,
  editForm,
  setEditForm,
  actionOptions,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  isSavingEdit,
  translate,
  locale,
}) {
  const [notesExpanded, setNotesExpanded] = useState(false);
  const isAI = !item?.author?.trim();
  const authorLabel = isAI
    ? translate("actionForm.aiAuthor", locale === "ar" ? "الذكاء الاصطناعي" : "AI")
    : item.author;
  const comment = item?.comment?.trim() || "";
  const isLongComment = comment.length > NOTES_COLLAPSE_LENGTH;
  const displayComment =
    !isLongComment || notesExpanded
      ? comment
      : `${comment.slice(0, NOTES_COLLAPSE_LENGTH).trimEnd()}…`;

  const actionLabel = item?.action
    ? getActionLabel(item.action, locale) || item.action
    : "";

  const expandNotesLabel = translate(
    "actionForm.expandNotes",
    locale === "ar" ? "عرض المزيد" : "Show more"
  );
  const collapseNotesLabel = translate(
    "actionForm.collapseNotes",
    locale === "ar" ? "عرض أقل" : "Show less"
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
  const partnerLabel = translate(
    "actionForm.partnerLabel",
    locale === "ar" ? "الشريك" : "Partner"
  );

  return (
    <li className="relative ps-4">
      <span
        className="absolute start-0 top-2 h-2.5 w-2.5 rounded-full bg-primary/70 ring-2 ring-white"
        aria-hidden
      />
      <div className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900">
              {actionLabel}
            </p>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-gray-500">
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                  isAI
                    ? "bg-gray-100 text-gray-600"
                    : "bg-primary/10 text-primary"
                }`}
              >
                {authorLabel}
              </span>
              <time dateTime={item?.created_at}>
                {formatDateForDisplay(item?.created_at, false)}
              </time>
            </div>
          </div>
          {canEdit && !isEditing && (
            <button
              type="button"
              onClick={onStartEdit}
              className="shrink-0 rounded p-1.5 text-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              aria-label={editActionLabel}
              title={editActionLabel}
            >
              <Pencil size={14} />
            </button>
          )}
        </div>

        {comment ? (
          <div className="mt-1.5">
            <p className="text-xs leading-relaxed text-gray-600 whitespace-pre-wrap">
              {displayComment}
            </p>
            {isLongComment && (
              <button
                type="button"
                onClick={() => setNotesExpanded((v) => !v)}
                className="mt-0.5 text-[11px] font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 rounded"
              >
                {notesExpanded ? collapseNotesLabel : expandNotesLabel}
              </button>
            )}
          </div>
        ) : null}

        {item?.partner && (
          <div className="mt-2 rounded-md border border-primary/15 bg-primary/5 px-2 py-1.5">
            <span className="text-[11px] font-semibold text-primary">
              {partnerLabel}: {item.partner.partner_name}
            </span>
            {item.partner.partner_phone ? (
              <span className="mt-0.5 block text-[10px] text-primary/80">
                {item.partner.partner_phone}
              </span>
            ) : null}
          </div>
        )}

        {!NOPREFRERED_TIME.includes(item?.action) && item?.meeting_time && (
          <div className="mt-1.5">
            <span className="inline-block rounded bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700">
              {formatDateForDisplay(item.meeting_time)}
            </span>
          </div>
        )}

        {isEditing && (
          <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
            <select
              value={editForm.action}
              onChange={(e) =>
                setEditForm((prev) => ({
                  ...prev,
                  action: e.target.value,
                }))
              }
              className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-xs"
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
              className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-xs"
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
              className="w-full resize-none rounded-md border border-gray-200 px-2 py-1.5 text-xs"
              placeholder={commentPlaceholder}
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onCancelEdit}
                disabled={isSavingEdit}
                className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-60"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onSaveEdit}
                disabled={isSavingEdit}
                className="rounded-md bg-primary px-2 py-1 text-xs text-white hover:bg-primary/90 disabled:opacity-60"
              >
                {isSavingEdit ? savingLabel : saveLabel}
              </button>
            </div>
          </div>
        )}
      </div>
    </li>
  );
}

function ActivityHistory({
  actionItems,
  latestEditableIndex,
  editingIndex,
  editForm,
  setEditForm,
  actionOptions,
  startEdit,
  cancelEdit,
  saveEdit,
  isSavingEdit,
  translate,
  locale,
}) {
  const [showAll, setShowAll] = useState(false);

  const newestFirst = useMemo(
    () =>
      [...(actionItems || [])]
        .map((item, originalIndex) => ({ item, originalIndex }))
        .reverse(),
    [actionItems]
  );

  const visibleRows = showAll
    ? newestFirst
    : newestFirst.slice(0, INITIAL_VISIBLE_ACTIONS);
  const hasOlder = newestFirst.length > INITIAL_VISIBLE_ACTIONS;

  const previousActionsLabel = translate(
    "actionForm.previousActions",
    locale === "ar" ? "الإجراءات الأخيرة" : "Recent Actions"
  );
  const viewOlderLabel = translate(
    "actionForm.viewOlderActions",
    locale === "ar" ? "عرض إجراءات أقدم" : "View Older Actions"
  );
  const showLessLabel = translate(
    "actionForm.showLessActions",
    locale === "ar" ? "عرض أقل" : "Show Less"
  );
  const emptyHistoryLabel = translate(
    "actionForm.emptyHistory",
    locale === "ar" ? "لا توجد إجراءات سابقة بعد." : "No previous actions yet."
  );

  return (
    <section
      className="flex min-h-0 flex-1 flex-col bg-gray-50/80 md:border-e md:border-gray-100"
      aria-label={previousActionsLabel}
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-gray-100 px-4 py-2.5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
          {previousActionsLabel}
          {newestFirst.length > 0 ? (
            <span className="ms-1.5 rounded-full bg-gray-200/80 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600 normal-case tracking-normal">
              {newestFirst.length}
            </span>
          ) : null}
        </h4>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3">
        {newestFirst.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">
            {emptyHistoryLabel}
          </p>
        ) : (
          <>
            <ul className="relative space-y-3 before:absolute before:start-[3px] before:top-2 before:bottom-2 before:w-px before:bg-primary/15">
              {visibleRows.map(({ item, originalIndex }) => (
                <ActivityTimelineItem
                  key={`${item?.created_at || "action"}-${originalIndex}`}
                  item={item}
                  canEdit={
                    originalIndex === latestEditableIndex && !!item?.author?.trim()
                  }
                  isEditing={editingIndex === originalIndex}
                  editForm={editForm}
                  setEditForm={setEditForm}
                  actionOptions={actionOptions}
                  onStartEdit={() => startEdit(item, originalIndex)}
                  onCancelEdit={cancelEdit}
                  onSaveEdit={saveEdit}
                  isSavingEdit={isSavingEdit}
                  translate={translate}
                  locale={locale}
                />
              ))}
            </ul>

            {hasOlder && (
              <button
                type="button"
                onClick={() => setShowAll((v) => !v)}
                className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                {showAll ? showLessLabel : viewOlderLabel}
                {showAll ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            )}
          </>
        )}
      </div>
    </section>
  );
}

export default function ActionsModal({
  actions,
  onClose,
  userId,
  phoneNumber,
  name,
  onActionUpdate,
  /** Raise when opened above another modal (e.g. schedule user details). */
  overlayClassName = "z-50",
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

  useEffect(() => {
    setActionItems(actions || []);
  }, [actions]);

  const modalTitle = translate(
    "actionForm.title",
    locale === "ar" ? "الإجراءات" : "Actions"
  );
  const closeLabel = translate(
    "buttons.close",
    locale === "ar" ? "إغلاق" : "Close"
  );

  const actionOptions = useMemo(
    () =>
      USER_ACTIONS.filter((item) => item.value && item.value !== "new").map(
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

  const refreshActions = async () => {
    if (!userId) return;
    const refreshed = await getClientActions(userId);
    if (Array.isArray(refreshed)) {
      setActionItems(refreshed);
    }
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
      await refreshActions();
      onActionUpdate?.(userId, editForm.action);
      toast.success(
        translate(
          "actionForm.successMessage",
          locale === "ar" ? "تم تحديث الإجراء بنجاح" : "Action updated successfully"
        )
      );
      cancelEdit();
    } catch (error) {
      toast.error(
        error?.response?.data?.detail ||
          error?.message ||
          translate(
            "actionForm.errorMessage",
            locale === "ar" ? "فشل إضافة الإجراء" : "Failed to add action"
          )
      );
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Optimistic append: the newly created action is added straight to the
  // timeline (rendered newest-first) instead of refetching the whole list.
  const handleActionSaved = (createdAction) => {
    if (createdAction && createdAction.action) {
      setActionItems((prev) => [...prev, createdAction]);
    }
    cancelEdit();
  };

  return (
    <div
      className={`fixed inset-0 flex items-end justify-center bg-black/50 sm:items-center sm:p-4 ${overlayClassName}`}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="actions-modal-title"
        className="relative flex h-[min(92dvh,100%)] w-full flex-col overflow-hidden bg-white shadow-xl sm:h-[min(85dvh,720px)] sm:max-w-4xl sm:rounded-xl"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
          <div className="min-w-0 flex-1">
            <h3
              id="actions-modal-title"
              className="truncate text-lg font-semibold text-gray-900"
            >
              {modalTitle}
            </h3>
            {name ? (
              <p className="truncate text-xs text-gray-500">{name}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            aria-label={closeLabel}
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:grid md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          {/* Composer: first on mobile, right on desktop */}
          <section className="order-1 flex shrink-0 flex-col border-b border-gray-100 md:order-2 md:h-full md:min-h-0 md:shrink md:border-b-0">
            <NewActionForm
              userId={userId}
              phoneNumber={phoneNumber}
              name={name}
              onSuccess={handleActionSaved}
              onActionUpdate={onActionUpdate}
              showHeading
              stickySubmit
              fieldPriority="action"
              composerLayout
            />
          </section>

          {/* History: below on mobile, left on desktop */}
          <div className="order-2 flex min-h-0 flex-1 flex-col md:order-1">
            <ActivityHistory
              actionItems={actionItems}
              latestEditableIndex={latestEditableIndex}
              editingIndex={editingIndex}
              editForm={editForm}
              setEditForm={setEditForm}
              actionOptions={actionOptions}
              startEdit={startEdit}
              cancelEdit={cancelEdit}
              saveEdit={saveEdit}
              isSavingEdit={isSavingEdit}
              translate={translate}
              locale={locale}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
