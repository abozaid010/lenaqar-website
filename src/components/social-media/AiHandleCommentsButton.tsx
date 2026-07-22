"use client";

import { useMemo, useState } from "react";
import { Loader2, Pause, Play, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";

import ActionButton from "@/components/ui/action-button";
import UnifiedDialog from "@/components/ui/UnifiedDialog";
import { useActivationUi } from "@/components/social-media/ActivationUiProvider";
import { useI18n } from "@/hooks/useI18n";
import {
  ACTIVATE_BATCH_LIMIT,
  activateDiscoveredPosts,
  RequestTimeoutError,
  resumeActivation,
  stopActivation,
} from "@/services/socialMedia";

/**
 * Header actions: Start / Pause / Resume based on activation phase.
 * Start is a long-running blocking POST — progress comes from status polling.
 */
export function AiHandleCommentsButton() {
  const { translate } = useI18n();
  const queryClient = useQueryClient();
  const {
    isStatusLoading,
    phase,
    pending,
    setBaseline,
    setStartInFlight,
    refreshStatus,
  } = useActivationUi();

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [controlBusy, setControlBusy] = useState(false);

  const refreshLists = async () => {
    await queryClient.invalidateQueries({ queryKey: ["social-media"] });
  };

  const handleConfirmStart = async () => {
    if (phase !== "idle" || pending <= 0) return;

    setBaseline(pending);
    setStartInFlight(true);
    setIsConfirmOpen(false);

    try {
      const result = await activateDiscoveredPosts(ACTIVATE_BATCH_LIMIT);

      if (result.disabled) {
        toast.error(
          translate(
            "socialMedia.actions.aiHandleDisabled",
            "AI handling is currently disabled.",
          ),
        );
      } else if (result.stopped) {
        toast(
          translate(
            "socialMedia.activation.stoppedEarly",
            "Batch stopped early: {processed} processed ({sent} sent, {skipped} skipped, {failed} failed).",
          )
            .replace("{processed}", String(result.processed))
            .replace("{sent}", String(result.sent))
            .replace("{skipped}", String(result.skipped))
            .replace("{failed}", String(result.failed)),
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
      await refreshLists();
    } catch (error) {
      if (error instanceof RequestTimeoutError) {
        // Batch still runs server-side — keep observing via status polling.
        toast(
          translate(
            "socialMedia.activation.stillRunning",
            "AI is still working in the background. Progress will keep updating.",
          ),
        );
      } else {
        setStartInFlight(false);
        toast.error(
          error instanceof Error
            ? error.message
            : translate("common.operationFailed"),
        );
      }
    } finally {
      await refreshStatus();
    }
  };

  const handlePause = async () => {
    if (controlBusy || phase === "pausing" || phase === "paused") return;
    setControlBusy(true);
    try {
      await stopActivation();
      toast.success(
        translate(
          "socialMedia.activation.pauseRequested",
          "Pause requested. Current post will finish first.",
        ),
      );
      await refreshStatus();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : translate("common.operationFailed"),
      );
    } finally {
      setControlBusy(false);
    }
  };

  const handleResume = async () => {
    if (controlBusy || phase !== "paused") return;
    setControlBusy(true);
    try {
      await resumeActivation();
      toast.success(
        translate(
          "socialMedia.activation.resumeSuccess",
          "Activation resumed. You can start a new batch.",
        ),
      );
      await refreshStatus();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : translate("common.operationFailed"),
      );
    } finally {
      setControlBusy(false);
    }
  };

  const pendingLabel = translate(
    "socialMedia.activation.postsReady",
    "{count} posts ready",
  ).replace("{count}", String(pending));

  return (
    <>
      <div className="flex items-center gap-2">
        {phase === "idle" && !isStatusLoading ? (
          <span
            className="hidden sm:inline text-xs text-gray-500 whitespace-nowrap"
            title={pendingLabel}
          >
            {pendingLabel}
          </span>
        ) : null}

        {phase === "running" || phase === "pausing" ? (
          <ActionButton
            size="md"
            type="default"
            icon={controlBusy || phase === "pausing" ? Loader2 : Pause}
            disabled={controlBusy || phase === "pausing"}
            onClick={handlePause}
            title={translate("socialMedia.activation.pause", "Pause")}
            ariaLabel={translate("socialMedia.activation.pause", "Pause")}
            className={
              controlBusy || phase === "pausing"
                ? "[&_svg]:animate-spin"
                : undefined
            }
          >
            {phase === "pausing"
              ? translate("socialMedia.activation.pausing", "Stopping…")
              : translate("socialMedia.activation.pause", "Pause")}
          </ActionButton>
        ) : null}

        {phase === "paused" ? (
          <ActionButton
            size="md"
            type="primary"
            icon={controlBusy ? Loader2 : Play}
            disabled={controlBusy}
            onClick={handleResume}
            title={translate("socialMedia.activation.resume", "Resume")}
            ariaLabel={translate("socialMedia.activation.resume", "Resume")}
            className={controlBusy ? "[&_svg]:animate-spin" : undefined}
          >
            {translate("socialMedia.activation.resume", "Resume")}
          </ActionButton>
        ) : null}

        {/* Start stays visible but locked outside idle — matches §7 state machine. */}
        <ActionButton
          size="md"
          type="primary"
          icon={Sparkles}
          disabled={
            phase !== "idle" || pending <= 0 || isStatusLoading
          }
          onClick={() => setIsConfirmOpen(true)}
          title={translate(
            "socialMedia.actions.aiHandleComments",
            "Let AI handle",
          )}
          ariaLabel={translate(
            "socialMedia.actions.aiHandleComments",
            "Let AI handle",
          )}
        >
          {translate(
            "socialMedia.actions.aiHandleComments",
            "Let AI handle",
          )}
        </ActionButton>
      </div>

      <UnifiedDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onCancel={() => setIsConfirmOpen(false)}
        title={translate(
          "socialMedia.actions.aiHandleComments",
          "Let AI handle",
        )}
        cancelLabel={translate("common.cancel")}
        cancelAriaLabel={translate("common.cancel")}
        headerLeading={undefined}
        headerTrailing={undefined}
        submitLabel={translate(
          "socialMedia.actions.aiHandleComments",
          "Let AI handle",
        )}
        onSubmit={handleConfirmStart}
        closeOnOutsideClick
        closeOnEscape
      >
        <p className="text-sm text-gray-700">
          {translate(
            "socialMedia.actions.aiHandleConfirm",
            "AI will review unhandled comments and send WhatsApp messages to leads with a phone number. Continue?",
          )}
        </p>
        <p className="mt-2 text-xs text-gray-500">
          {translate(
            "socialMedia.activation.batchHint",
            "This run handles up to {limit} posts and may take a few minutes. You can pause anytime.",
          ).replace("{limit}", String(ACTIVATE_BATCH_LIMIT))}
        </p>
        {pending > 0 ? (
          <p className="mt-1.5 text-xs font-medium text-gray-600">
            {pendingLabel}
          </p>
        ) : null}
      </UnifiedDialog>
    </>
  );
}

/** Compact progress strip — place below the page header while a batch is active. */
export function AiActivationProgress() {
  const { translate } = useI18n();
  const { phase, pending, progressBaseline } = useActivationUi();

  const progress = useMemo(() => {
    if (progressBaseline == null || progressBaseline <= 0) return null;
    const processed = Math.max(0, progressBaseline - pending);
    const pct = Math.min(100, Math.round((processed / progressBaseline) * 100));
    return { processed, pct, baseline: progressBaseline };
  }, [progressBaseline, pending]);

  if (phase !== "running" && phase !== "pausing") return null;

  return (
    <div
      className="rounded-xl border border-primary/15 bg-white px-3.5 py-2.5 shadow-sm"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center justify-between gap-3 text-xs text-gray-600">
        <span className="inline-flex items-center gap-1.5 font-medium text-primary min-w-0">
          <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" aria-hidden />
          <span className="truncate">
            {phase === "pausing"
              ? translate(
                  "socialMedia.activation.pausingTitle",
                  "Stopping — finishing current post…",
                )
              : translate(
                  "socialMedia.activation.runningLabel",
                  "AI working…",
                )}
          </span>
        </span>
        <span className="shrink-0 tabular-nums text-gray-500">
          {translate(
            "socialMedia.activation.remaining",
            "{count} left",
          ).replace("{count}", String(pending))}
        </span>
      </div>
      <div
        className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress?.pct ?? undefined}
        aria-label={translate(
          "socialMedia.activation.progressLabel",
          "Activation progress",
        )}
      >
        <div
          className={`h-full rounded-full bg-primary transition-[width] duration-500 ease-out ${
            progress == null ? "w-1/3 animate-pulse" : ""
          }`}
          style={
            progress != null ? { width: `${Math.max(progress.pct, 4)}%` } : undefined
          }
        />
      </div>
      {progress != null ? (
        <div className="mt-1.5 text-[11px] text-gray-400 tabular-nums">
          {translate(
            "socialMedia.activation.progressDetail",
            "~{processed} of {total}",
          )
            .replace("{processed}", String(progress.processed))
            .replace("{total}", String(progress.baseline))}
        </div>
      ) : null}
    </div>
  );
}
