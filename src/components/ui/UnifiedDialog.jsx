"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import UnifiedHeader from "@/components/ui/UnifiedHeader";
import { useI18n } from "@/hooks/useI18n";

/**
 * Unified dialog with consistent header layout:
 * - Leading: cancel button
 * - Center: title
 * - Trailing: submit button
 * Header: default = bg-primary + white text; "unified" = UnifiedHeader (#E2dbff + primary).
 * Width 90% of screen, height dynamic.
 */
export default function UnifiedDialog({
  isOpen,
  onClose,
  title,
  cancelLabel,
  onCancel,
  submitLabel,
  onSubmit,
  submitDisabled = false,
  submitLoading = false,
  children,
  closeOnOutsideClick = true,
  closeOnEscape = true,
  showCloseButton = false,
  /** "default" = primary bg + white text; "unified" = UnifiedHeader (#E2dbff + primary) */
  headerVariant = "default",
  /** Optional custom leading content (replaces cancel button when provided) */
  headerLeading,
  /** Optional custom trailing content (replaces submit button when provided) */
  headerTrailing,
  /** Optional class for the content body */
  bodyClassName = "",
}) {
  const { t } = useI18n();
  const dialogRef = useRef(null);
  const handleCancel = onCancel ?? onClose;
  
  // Use translated cancel label if none provided
  const finalCancelLabel = cancelLabel ?? t('buttons.cancel');

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && closeOnEscape) handleCancel();
    };

    if (isOpen) {
      if (closeOnEscape) document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, handleCancel, closeOnEscape]);

  const handleOutsideClick = (e) => {
    if (!closeOnOutsideClick) return;
    if (dialogRef.current && !dialogRef.current.contains(e.target)) {
      handleCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/50 transition-opacity duration-300 ease-in-out"
      onClick={handleOutsideClick}
    >
      <div
        ref={dialogRef}
        className="rounded-lg shadow-xl overflow-hidden w-[90%] max-h-[90vh] flex flex-col bg-white transform transition-all duration-300 ease-in-out"
      >
        {/* Header: default = primary bg + white; unified = UnifiedHeader (#E2dbff + primary) */}
        {headerVariant === "unified" ? (
          <UnifiedHeader
            title={title}
            onCancel={handleCancel}
            cancelLabel={finalCancelLabel}
            onSubmit={onSubmit}
            submitLabel={submitLabel}
            submitDisabled={submitDisabled}
            submitLoading={submitLoading}
            leadingSlot={headerLeading}
            trailingSlot={headerTrailing}
          />
        ) : (
          <div
            className="flex justify-between items-center gap-3 p-3 md:p-4 bg-primary text-white flex-shrink-0 relative"
            dir="ltr"
          >
            <div className="flex justify-start items-center shrink-0 order-first min-w-[80px]">
              {headerLeading !== undefined ? (
                headerLeading
              ) : (
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={submitLoading}
                  className="px-3 py-1.5 rounded-md border border-white/30 bg-white/10 text-white hover:bg-white/15 text-sm disabled:opacity-70 disabled:pointer-events-none"
                >
                  {finalCancelLabel}
                </button>
              )}
            </div>
            <h2 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-lg md:text-xl font-semibold text-white px-2 pointer-events-none truncate max-w-[60%]">
              {title}
            </h2>
            <div className="flex justify-end items-center gap-2 shrink-0 order-last min-w-[80px]">
              {headerTrailing !== undefined ? (
                headerTrailing
              ) : submitLabel != null && onSubmit != null ? (
                <button
                  type="button"
                  onClick={onSubmit}
                  disabled={submitDisabled || submitLoading}
                  className="px-3 py-1.5 rounded-md bg-white text-primary hover:bg-white/90 text-sm font-medium disabled:opacity-70 disabled:pointer-events-none inline-flex items-center justify-center gap-2"
                >
                  {submitLoading ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      {submitLabel}
                    </>
                  ) : (
                    submitLabel
                  )}
                </button>
              ) : null}
              {showCloseButton ? (
                <button
                  type="button"
                  onClick={onClose}
                  className="text-white/90 hover:text-white focus:outline-none p-1"
                  aria-label="Close"
                >
                  <X size={22} />
                </button>
              ) : null}
            </div>
          </div>
        )}
        <div
          className={`p-4 overflow-y-auto bg-white flex-1 min-h-0 ${bodyClassName}`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
