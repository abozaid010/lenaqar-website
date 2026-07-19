"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import UnifiedDialog from "@/components/ui/UnifiedDialog";
import { useI18n } from "@/hooks/useI18n";
import { usePublishCard } from "@/hooks/use-market-index";
import { PUBLISH_ERROR_SEPARATOR } from "@/lib/market-index/constants";

function ChangesSummaryView({ summary, translate }) {
  if (!summary) return null;
  return (
    <ul className="text-sm text-gray-700 list-disc ps-5 space-y-1">
      {summary.initial_publication && (
        <li>{translate("marketIndex.publish.initialPublication")}</li>
      )}
      <li>
        {translate("marketIndex.publish.unitsAdded").replace(
          "{n}",
          String(summary.units_added ?? 0)
        )}
      </li>
      <li>
        {translate("marketIndex.publish.unitsRemoved").replace(
          "{n}",
          String(summary.units_removed ?? 0)
        )}
      </li>
      <li>
        {translate("marketIndex.publish.unitsChanged").replace(
          "{n}",
          String(summary.units_changed ?? 0)
        )}
      </li>
      <li>
        {translate("marketIndex.publish.generalChanged").replace(
          "{n}",
          String(summary.general_fields_changed ?? 0)
        )}
      </li>
      <li>
        {summary.adjustments_changed
          ? translate("marketIndex.publish.adjustmentsChangedYes")
          : translate("marketIndex.publish.adjustmentsChangedNo")}
      </li>
    </ul>
  );
}

export default function PublishPanel({
  locationId,
  locationName,
  activeVersion = 0,
  canEdit = false,
  confirmOpen = false,
  onConfirmOpenChange,
  onPublished,
}) {
  const { translate } = useI18n();
  const [result, setResult] = useState(null);
  const [validationIssues, setValidationIssues] = useState([]);
  const publishMutation = usePublishCard(locationId);

  if (!canEdit) return null;

  const nextVersion = (activeVersion || 0) + 1;

  const closeConfirm = () => onConfirmOpenChange?.(false);

  const handlePublish = async () => {
    setValidationIssues([]);
    try {
      const data = await publishMutation.mutateAsync();
      setResult(data);
      closeConfirm();
      toast.success(
        translate("marketIndex.toasts.published").replace(
          "{n}",
          String(data?.version ?? nextVersion)
        )
      );
      onPublished?.(data);
    } catch (err) {
      if (err?.status === 409) {
        toast.error(translate("marketIndex.errors.publishConflict"));
        closeConfirm();
        return;
      }
      if (err?.status === 400) {
        const raw = err?.error_message || err?.message || "";
        const issues = String(raw)
          .split(PUBLISH_ERROR_SEPARATOR)
          .map((s) => s.trim())
          .filter(Boolean);
        setValidationIssues(
          issues.length
            ? issues
            : [raw || translate("marketIndex.errors.publishFailed")]
        );
        closeConfirm();
        return;
      }
      toast.error(err?.message || translate("marketIndex.errors.publishFailed"));
      closeConfirm();
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {validationIssues.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-start">
          <p className="font-medium text-red-800 mb-2">
            {translate("marketIndex.publish.validationTitle")}
          </p>
          <ul className="list-disc ps-5 text-sm text-red-700 space-y-1">
            {validationIssues.map((issue, i) => (
              <li key={i}>{issue}</li>
            ))}
          </ul>
        </div>
      )}

      {result && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-start">
          <p className="font-medium text-green-900 mb-2">
            {translate("marketIndex.publish.successTitle").replace(
              "{n}",
              String(result.version)
            )}
          </p>
          <ChangesSummaryView summary={result.changes_summary} translate={translate} />
        </div>
      )}

      <UnifiedDialog
        isOpen={confirmOpen}
        onClose={closeConfirm}
        title={translate("marketIndex.publish.confirmTitle")}
        cancelLabel={translate("common.cancel")}
        submitLabel={translate("marketIndex.actions.publish")}
        submitLoading={publishMutation.isPending}
        onSubmit={handlePublish}
        dialogClassName="max-w-md"
        bodyClassName="p-4"
      >
        <p className="text-sm text-gray-700">
          {translate("marketIndex.publish.confirmMessage")
            .replace("{location}", locationName || locationId)
            .replace("{n}", String(nextVersion))}
        </p>
      </UnifiedDialog>
    </div>
  );
}
