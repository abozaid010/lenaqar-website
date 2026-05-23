"use client";

/**
 * Unified header bar for dialogs, forms, and page sections.
 * - Background: #E2dbff
 * - Text: primary color
 * - Cancel (leading, rounded border) | Centered title | Submit (trailing)
 */
export default function UnifiedHeader({
  title,
  onCancel,
  cancelLabel = "Cancel",
  /** Screen-reader label for cancel; defaults to cancelLabel when omitted */
  cancelAriaLabel,
  onSubmit,
  submitLabel = "Submit",
  submitDisabled = false,
  submitLoading = false,
  /** Optional: custom leading slot (e.g. back icon). If set, cancel is not rendered. */
  leadingSlot = null,
  /** Optional: custom trailing slot. If set, submit is not rendered. */
  trailingSlot = null,
  /** Optional: extra class for the root header */
  className = "",
  /** Optional: direction (rtl/ltr). Defaults to ltr. */
  dir = "ltr",
}) {
  const showCancel = !leadingSlot && onCancel != null;
  const showSubmit = !trailingSlot && onSubmit != null;
  const resolvedCancelAriaLabel = cancelAriaLabel ?? cancelLabel;

  return (
    <header
      dir={dir}
      className={`flex items-center justify-between gap-3 px-4 py-3 bg-[#E2dbff] text-primary flex-shrink-0 ${className}`}
    >
      {/* Leading: Cancel or custom slot (equal flex so title stays centered) */}
      <div className="flex min-w-0 flex-1 basis-0 justify-start">
        {leadingSlot != null ? (
          leadingSlot
        ) : showCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="h-10 rounded-lg border-2 border-primary bg-transparent px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-[#E2dbff]"
            aria-label={resolvedCancelAriaLabel}
          >
            {cancelLabel}
          </button>
        ) : (
          <span aria-hidden />
        )}
      </div>

      {/* Center: Title */}
      <h2 className="flex-1 text-center text-lg font-semibold text-primary truncate px-2">
        {title}
      </h2>

      {/* Trailing: Submit or custom slot (equal flex so title stays centered) */}
      <div className="flex min-w-0 flex-1 basis-0 justify-end">
        {trailingSlot != null ? (
          trailingSlot
        ) : showSubmit ? (
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitDisabled || submitLoading}
            className="h-10 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-[#E2dbff] disabled:opacity-60 disabled:cursor-not-allowed"
            aria-label={submitLabel}
          >
            {submitLoading ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                {submitLabel}
              </span>
            ) : (
              submitLabel
            )}
          </button>
        ) : (
          <span aria-hidden />
        )}
      </div>
    </header>
  );
}
