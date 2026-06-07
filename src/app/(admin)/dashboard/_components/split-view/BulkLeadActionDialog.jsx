"use client";

import UnifiedDialog from "@/components/ui/UnifiedDialog";
import { useI18n } from "@/hooks/useI18n";
import { useModuleActions } from "@/hooks/useModuleActions";
import { LenaCookiesManager } from "@/lib/LenaCookiesManager";
import { USER_ACTIONS, getActionLabel } from "@/utils/actions";
import { createBulkUserActions } from "@/utils/api";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";

const getDefaultDate = () => new Date().toISOString().split("T")[0];

const getDefaultTime = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
};

export default function BulkLeadActionDialog({
  isOpen,
  onClose,
  selectedLeads = [],
  onSuccess,
}) {
  const { locale, translate } = useI18n();
  const { canCreate, isReady } = useModuleActions("conversation");
  const clientId = LenaCookiesManager.getClientId();
  const clientInfo = LenaCookiesManager.getClientInfo();
  const author =
    (typeof clientInfo?.email === "string" && clientInfo.email.trim()) ||
    (typeof clientInfo?.name === "string" && clientInfo.name.trim()) ||
    "";

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

  const [action, setAction] = useState(
    () => actionOptions[0]?.value || "Make a call"
  );
  const [meetingDate, setMeetingDate] = useState(getDefaultDate);
  const [meetingTime, setMeetingTime] = useState(getDefaultTime);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isReady || !canCreate) {
    return null;
  }

  const getMeetingDateTime = () => {
    const date = meetingDate || getDefaultDate();
    const time = meetingTime || getDefaultTime();
    return `${date}T${time}`;
  };

  const resetForm = () => {
    setComment("");
    setMeetingDate(getDefaultDate());
    setMeetingTime(getDefaultTime());
  };

  const handleApply = async () => {
    if (!action || selectedLeads.length === 0) return;

    const createdAt = new Date().toISOString();
    const meetingDateTime = getMeetingDateTime();
    const payloads = selectedLeads
      .filter((lead) => lead?.user_id)
      .map((lead) => ({
        phone_number: lead.phone_number ?? "",
        name: lead.name ?? "",
        client_id: clientId,
        user_id: lead.user_id,
        comment: comment.trim(),
        meeting_time: meetingDateTime,
        created_at: createdAt,
        action,
        author,
      }));

    if (payloads.length === 0) return;

    try {
      setIsSubmitting(true);
      await createBulkUserActions(payloads);
      toast.success(
        translate("dashboardFilter.bulkAction.success").replace(
          "{count}",
          String(payloads.length)
        )
      );
      resetForm();
      onClose?.();
      onSuccess?.();
    } catch (error) {
      toast.error(
        error?.response?.data?.detail ||
          error?.message ||
          translate("dashboardFilter.bulkAction.error")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const dialogTitle = translate("dashboardFilter.bulkAction.dialogTitle").replace(
    "{count}",
    String(selectedLeads.length)
  );

  return (
    <UnifiedDialog
      isOpen={isOpen}
      onClose={onClose}
      title={dialogTitle}
      cancelLabel={translate("buttons.cancel")}
      submitLabel={
        isSubmitting
          ? translate("dashboardFilter.bulkAction.applying")
          : translate("dashboardFilter.bulkAction.applyButton")
      }
      onSubmit={handleApply}
      submitDisabled={isSubmitting || !action || selectedLeads.length === 0}
      submitLoading={isSubmitting}
      headerVariant="unified"
    >
      <div className="space-y-4 max-w-md mx-auto">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
              {translate("actionForm.dateLabel")}
            </label>
            <input
              type="date"
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value || getDefaultDate())}
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
              {translate("actionForm.timeLabel")}
            </label>
            <input
              type="time"
              value={meetingTime}
              onChange={(e) => setMeetingTime(e.target.value || getDefaultTime())}
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
            {translate("actionForm.actionLabel")}
          </label>
          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {actionOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
            {translate("actionForm.commentLabel")}
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={translate("actionForm.commentPlaceholder")}
            rows={3}
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary resize-none"
          />
        </div>
      </div>
    </UnifiedDialog>
  );
}
