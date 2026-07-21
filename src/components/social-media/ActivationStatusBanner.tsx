"use client";

import { AlertTriangle, PauseCircle } from "lucide-react";
import { useActivationUi } from "@/components/social-media/ActivationUiProvider";
import { useI18n } from "@/hooks/useI18n";

/**
 * Cross-page banners for kill-switch / global pause.
 * Pause also halts automatic webhook activation, so this lives in the social-media layout.
 */
export function ActivationStatusBanner() {
  const { translate } = useI18n();
  const { phase } = useActivationUi();

  if (phase !== "disabled" && phase !== "paused" && phase !== "pausing") {
    return null;
  }

  if (phase === "disabled") {
    return (
      <div
        role="alert"
        className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-900"
      >
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden />
        <div>
          <div className="font-semibold">
            {translate(
              "socialMedia.activation.disabledTitle",
              "Activation disabled by operator",
            )}
          </div>
          <div className="mt-0.5 text-red-800/90">
            {translate(
              "socialMedia.activation.disabledBody",
              "AI handling and automatic activation are turned off. Contact an operator to re-enable.",
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      role="status"
      className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-950"
    >
      <PauseCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden />
      <div>
        <div className="font-semibold">
          {phase === "pausing"
            ? translate(
                "socialMedia.activation.pausingTitle",
                "Stopping — finishing current post…",
              )
            : translate(
                "socialMedia.activation.pausedTitle",
                "AI activation paused",
              )}
        </div>
        <div className="mt-0.5 text-amber-900/85">
          {translate(
            "socialMedia.activation.pausedBody",
            "Manual batches and automatic webhook activation are on hold until someone resumes.",
          )}
        </div>
      </div>
    </div>
  );
}
