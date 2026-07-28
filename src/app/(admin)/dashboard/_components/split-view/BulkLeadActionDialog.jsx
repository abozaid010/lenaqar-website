"use client";

import UnifiedDialog from "@/components/ui/UnifiedDialog";
import ActionSelect from "@/components/actions/ActionSelect";
import TerminalActionDialog from "@/components/actions/TerminalActionDialog";
import {
  validateActionSubmission,
  actionRequiresMeetingTime,
} from "@/components/actions/validateActionSubmission";
import { useI18n } from "@/hooks/useI18n";
import { useModuleActions } from "@/hooks/useModuleActions";
import { useActionOptions } from "@/hooks/use-action-catalog";
import { LenaCookiesManager } from "@/lib/LenaCookiesManager";
import { normalizeOwnerType } from "@/constants/owner-type";
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
  const { translate } = useI18n();
  const { canCreate, isReady } = useModuleActions("conversation");
  const clientId = LenaCookiesManager.getClientId();
  const clientInfo = LenaCookiesManager.getClientInfo();
  const author =
    (typeof clientInfo?.email === "string" && clientInfo.email.trim()) ||
    (typeof clientInfo?.name === "string" && clientInfo.name.trim()) ||
    "";

  const ownerTypes = useMemo(
    () =>
      selectedLeads.map((lead) =>
        normalizeOwnerType(lead?.owner_type ?? lead?.ownerType)
      ),
    [selectedLeads]
  );

  const { options: actionOptions, catalog, isError: catalogError } =
    useActionOptions({
      ownerTypes,
      enabled: isOpen,
    });

  const [action, setAction] = useState("");
  const [meetingDate, setMeetingDate] = useState(getDefaultDate);
  const [meetingTime, setMeetingTime] = useState(getDefaultTime);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [scheduleTouched, setScheduleTouched] = useState(true);

  // Keep action in sync with available options
  const resolvedAction =
    action && actionOptions.some((o) => o.value === action)
      ? action
      : actionOptions[0]?.value || "";

  const requiresMeetingTime = actionRequiresMeetingTime(
    resolvedAction,
    catalog
  );

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
    setScheduleTouched(true);
    setAction("");
  };

  const showValidationError = (result) => {
    toast.error(translate(result.errorKey, result.errorFallback));
  };

  const runValidation = () => {
    if (catalogError || !catalog) {
      showValidationError({
        errorKey: "actionCatalog.errors.catalogUnavailable",
        errorFallback: "Action catalog unavailable. Try refreshing the page.",
      });
      return null;
    }
    const result = validateActionSubmission({
      action: resolvedAction,
      meetingTime:
        requiresMeetingTime && !scheduleTouched ? "" : getMeetingDateTime(),
      catalog,
    });
    if (!result.ok) {
      showValidationError(result);
      return null;
    }
    return result;
  };

  const performApply = async () => {
    if (!resolvedAction || selectedLeads.length === 0) return;

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
        action: resolvedAction,
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

  const handleApply = async () => {
    const validation = runValidation();
    if (!validation) return;
    if (validation.actionSpec.terminal) {
      setTerminalOpen(true);
      return;
    }
    await performApply();
  };

  const dialogTitle = translate("dashboardFilter.bulkAction.dialogTitle").replace(
    "{count}",
    String(selectedLeads.length)
  );

  const scheduleLabel = requiresMeetingTime
    ? translate("actionForm.scheduleRequired", "Date & Time (required)")
    : translate("actionForm.dateLabel");

  return (
    <>
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
        submitDisabled={
          isSubmitting || !resolvedAction || selectedLeads.length === 0
        }
        submitLoading={isSubmitting}
        headerVariant="unified"
        dialogClassName="w-full sm:w-[90%] max-w-lg rounded-t-2xl sm:rounded-lg"
      >
        <div className="space-y-4 max-w-md mx-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                {scheduleLabel}
              </label>
              <input
                type="date"
                value={meetingDate}
                required={requiresMeetingTime}
                onChange={(e) => {
                  setScheduleTouched(true);
                  setMeetingDate(e.target.value || getDefaultDate());
                }}
                className="w-full border border-gray-200 rounded-md px-3 py-2 min-h-10 lg:min-h-0 text-base lg:text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                {translate("actionForm.timeLabel")}
              </label>
              <input
                type="time"
                value={meetingTime}
                required={requiresMeetingTime}
                onChange={(e) => {
                  setScheduleTouched(true);
                  setMeetingTime(e.target.value || getDefaultTime());
                }}
                className="w-full border border-gray-200 rounded-md px-3 py-2 min-h-10 lg:min-h-0 text-base lg:text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
              {translate("actionForm.actionLabel")}
            </label>
            <ActionSelect
              selectionMode="single"
              ownerTypes={ownerTypes}
              value={resolvedAction}
              onChange={setAction}
              className="w-full border border-gray-200 rounded-md px-3 py-2 min-h-10 lg:min-h-0 text-base lg:text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary"
            />
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
              className="w-full border border-gray-200 rounded-md px-3 py-2 min-h-10 lg:min-h-0 text-base lg:text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>
        </div>
      </UnifiedDialog>

      <TerminalActionDialog
        isOpen={terminalOpen}
        onClose={() => setTerminalOpen(false)}
        onConfirm={async () => {
          setTerminalOpen(false);
          await performApply();
        }}
        actionLabel={
          actionOptions.find((o) => o.value === resolvedAction)?.label ||
          resolvedAction
        }
      />
    </>
  );
}
