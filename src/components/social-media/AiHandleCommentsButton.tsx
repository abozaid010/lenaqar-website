"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";

import ActionButton from "@/components/ui/action-button";
import UnifiedDialog from "@/components/ui/UnifiedDialog";
import { useI18n } from "@/hooks/useI18n";
import { activateDiscoveredPosts } from "@/services/socialMedia";

/**
 * Triggers the AI catch-up batch: activates unhandled discovered posts.
 * Sends live WhatsApp messages upstream, so it always confirms first.
 */
export function AiHandleCommentsButton() {
  const { translate } = useI18n();
  const queryClient = useQueryClient();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const handleConfirm = async () => {
    setIsRunning(true);
    try {
      const result = await activateDiscoveredPosts();
      if (result.disabled) {
        toast.error(
          translate(
            "socialMedia.actions.aiHandleDisabled",
            "AI handling is currently disabled.",
          ),
        );
      } else if (result.processed === 0) {
        toast.success(
          translate(
            "socialMedia.actions.aiHandleNothingToDo",
            "No new comments for AI to handle.",
          ),
        );
      } else {
        toast.success(
          translate(
            "socialMedia.actions.aiHandleSuccess",
            "Processed {processed}: {sent} sent, {skipped} skipped, {failed} failed.",
          )
            .replace("{processed}", String(result.processed))
            .replace("{sent}", String(result.sent))
            .replace("{skipped}", String(result.skipped))
            .replace("{failed}", String(result.failed)),
        );
      }
      await queryClient.invalidateQueries({ queryKey: ["social-media"] });
      setIsConfirmOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : translate("common.operationFailed"),
      );
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <>
      <ActionButton
        size="md"
        icon={Sparkles}
        onClick={() => setIsConfirmOpen(true)}
        title={translate("socialMedia.actions.aiHandleComments", "Let AI handle")}
        ariaLabel={translate(
          "socialMedia.actions.aiHandleComments",
          "Let AI handle",
        )}
      >
        {translate("socialMedia.actions.aiHandleComments", "Let AI handle")}
      </ActionButton>

      <UnifiedDialog
        isOpen={isConfirmOpen}
        onClose={() => {
          if (!isRunning) setIsConfirmOpen(false);
        }}
        onCancel={() => {
          if (!isRunning) setIsConfirmOpen(false);
        }}
        title={translate("socialMedia.actions.aiHandleComments", "Let AI handle")}
        cancelLabel={translate("common.cancel")}
        cancelAriaLabel={translate("common.cancel")}
        headerLeading={undefined}
        headerTrailing={undefined}
        submitLabel={translate("socialMedia.actions.aiHandleComments", "Let AI handle")}
        onSubmit={handleConfirm}
        submitLoading={isRunning}
        closeOnOutsideClick={!isRunning}
        closeOnEscape={!isRunning}
      >
        <p className="text-sm text-gray-700">
          {translate(
            "socialMedia.actions.aiHandleConfirm",
            "AI will review unhandled comments and send WhatsApp messages to leads with a phone number. Continue?",
          )}
        </p>
      </UnifiedDialog>
    </>
  );
}
