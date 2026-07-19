"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import UnifiedDialog from "@/components/ui/UnifiedDialog";
import { useI18n } from "@/hooks/useI18n";
import { usePublishCard } from "@/hooks/use-market-index";
import { PUBLISH_ERROR_SEPARATOR } from "@/lib/market-index/constants";
import { splitPublishErrorMessage } from "@/lib/market-index/publish-validation";

export default function PublishPanel({
  locationId,
  locationName,
  activeVersion = 0,
  canEdit = false,
  confirmOpen = false,
  onConfirmOpenChange,
  onValidationIssues,
  onPublished,
}) {
  const { translate } = useI18n();
  const [isLeavingAfterSuccess, setIsLeavingAfterSuccess] = useState(false);
  const publishMutation = usePublishCard(locationId);

  if (!canEdit) return null;

  const nextVersion = (activeVersion || 0) + 1;
  const isBusy = publishMutation.isPending || isLeavingAfterSuccess;

  const closeConfirm = () => {
    if (isBusy) return;
    onConfirmOpenChange?.(false);
  };

  const handlePublish = async () => {
    if (isBusy) return;
    onValidationIssues?.([]);
    try {
      const data = await publishMutation.mutateAsync();
      // Keep dialog open + busy until the editor route unmounts.
      setIsLeavingAfterSuccess(true);
      toast.success(
        translate("marketIndex.toasts.published").replace(
          "{n}",
          String(data?.version ?? nextVersion)
        )
      );
      onPublished?.(data);
    } catch (err) {
      setIsLeavingAfterSuccess(false);
      if (err?.status === 409) {
        toast.error(translate("marketIndex.errors.publishConflict"));
        return;
      }
      if (err?.status === 400) {
        const raw = err?.error_message || err?.message || "";
        const issues = splitPublishErrorMessage(raw, PUBLISH_ERROR_SEPARATOR);
        const finalIssues = issues.length
          ? issues
          : [raw || translate("marketIndex.errors.publishFailed")];
        onValidationIssues?.(finalIssues);
        onConfirmOpenChange?.(false);
        toast.error(translate("marketIndex.publish.validationTitle"));
        return;
      }
      toast.error(err?.message || translate("marketIndex.errors.publishFailed"));
    }
  };

  return (
    <UnifiedDialog
      isOpen={confirmOpen}
      onClose={closeConfirm}
      title={translate("marketIndex.publish.confirmTitle")}
      cancelLabel={translate("common.cancel")}
      submitLabel={
        isBusy
          ? translate("common.loading")
          : translate("marketIndex.actions.publish")
      }
      submitLoading={isBusy}
      submitDisabled={isBusy}
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
  );
}
