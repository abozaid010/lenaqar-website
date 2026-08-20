"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  cancelAriaLabel,
  onCancel,
  submitLabel,
  onSubmit,
  submitDisabled = false,
  submitLoading = false,
  children,
  closeOnOutsideClick = false,
  closeOnEscape = false,
  showCloseButton = false,
  overlayClassName = "",
  /** "default" = primary bg + white text; "unified" = UnifiedHeader (#E2dbff + primary) */
  headerVariant = "default",
  /** Optional custom leading content (replaces cancel button when provided) */
  headerLeading,
  /** Optional custom trailing content (replaces submit button when provided) */
  headerTrailing,
  /** Optional class for the content body */
  bodyClassName = "",
  /** Optional class for the dialog panel (e.g. max-width) */
  dialogClassName = "",
}) {
  const { locale, translate } = useI18n();
  const isRTL = locale === "ar";
  const dialogRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  const handleCancel = onCancel ?? onClose;

  useEffect(() => {
    setMounted(true);
  }, []);

  const fallbackCancel = translate("common.cancel", locale === "ar" ? "إلغاء" : "Cancel");
  const fallbackSubmit = translate("common.submit", locale === "ar" ? "حفظ" : "Save");
  const finalCancelLabel =
    typeof cancelLabel === "string"
      ? cancelLabel.trim() || fallbackCancel
      : cancelLabel ?? fallbackCancel;
  const finalSubmitLabel =
    typeof submitLabel === "string"
      ? submitLabel.trim() || fallbackSubmit
      : submitLabel ?? fallbackSubmit;

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

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overscroll-contain p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-black/50 transition-opacity duration-300 ease-in-out ${overlayClassName}`}
      onClick={handleOutsideClick}
    >
      <div
        ref={dialogRef}
        className={`rounded-lg shadow-xl overflow-hidden w-[min(100%,calc(100vw-1.5rem))] max-h-[calc(100dvh-1.5rem)] min-h-0 grid grid-rows-[auto_minmax(0,1fr)] bg-white text-black transform transition-all duration-300 ease-in-out ${dialogClassName}`}
      >
        {/* Header: default = primary bg + white; unified = UnifiedHeader (#E2dbff + primary) */}
        {headerVariant === "unified" ? (
          <UnifiedHeader
            title={title}
            onCancel={handleCancel}
            cancelLabel={finalCancelLabel}
            cancelAriaLabel={cancelAriaLabel ?? finalCancelLabel}
            onSubmit={onSubmit}
            submitLabel={finalSubmitLabel}
            submitDisabled={submitDisabled}
            submitLoading={submitLoading}
            leadingSlot={headerLeading}
            trailingSlot={headerTrailing}
            dir={isRTL ? "rtl" : "ltr"}
          />
        ) : (
          <div
            className="flex justify-between items-center gap-3 p-3 md:p-4 bg-primary text-white relative"
            dir={isRTL ? "rtl" : "ltr"}
          >
            <div
              className="flex items-center shrink-0 min-w-[80px] justify-start"
            >
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
            <div
              className="flex items-center gap-2 shrink-0 min-w-[80px] justify-end"
            >
              {headerTrailing !== undefined ? (
                headerTrailing
              ) : finalSubmitLabel != null && onSubmit != null ? (
                <button
                  type="button"
                  onClick={onSubmit}
                  disabled={submitDisabled || submitLoading}
                  className="px-3 py-1.5 rounded-md bg-white text-primary hover:bg-white/90 text-sm font-medium disabled:opacity-70 disabled:pointer-events-none inline-flex items-center justify-center gap-2"
                >
                  {submitLoading ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      {finalSubmitLabel}
                    </>
                  ) : (
                    finalSubmitLabel
                  )}
                </button>
              ) : null}
              {showCloseButton ? (
                <button
                  type="button"
                  onClick={onClose}
                  className="icon-btn h-8 w-8 rounded-full text-white/90 hover:text-white hover:bg-white/10 focus:outline-none"
                  aria-label="Close"
                >
                  <X size={22} />
                </button>
              ) : null}
            </div>
          </div>
        )}
        <div
          className={`p-4 overflow-y-auto overscroll-contain bg-white text-black min-h-0 [-webkit-overflow-scrolling:touch] [&_select]:text-gray-900 [&_select]:[color-scheme:light] [&_input]:text-gray-900 [&_textarea]:text-gray-900 ${bodyClassName}`}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
