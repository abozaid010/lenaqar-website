"use client";

import { useState } from "react";
import UnifiedDialog from "@/components/ui/UnifiedDialog";
import LenaTextarea from "@/components/ui/inputs/lena-textarea";

/**
 * Separate dialog for "Fill from text": paste WhatsApp/Facebook text and extract unit fields.
 * Has its own Save (Extract) / Cancel.
 */
export default function FillFromTextDialog({
  isOpen,
  onClose,
  onExtract,
  extracting = false,
  useLocalExtractor = true,
  onUseLocalExtractorChange,
  t = {},
}) {
  const [text, setText] = useState("");

  const handleExtract = async (e) => {
    e?.preventDefault?.();
    const trimmed = (text || "").trim();
    if (!trimmed) return;
    const success = await onExtract(trimmed);
    if (success) {
      setText("");
      onClose();
    }
  };

  const handleCancel = () => {
    setText("");
    onClose();
  };

  const headerTrailing = (
    <div className="flex items-center gap-3">
      {typeof onUseLocalExtractorChange === "function" && (
        <label className="inline-flex items-center gap-2 cursor-pointer shrink-0" title={useLocalExtractor ? (t.modal?.fillFromText?.useLocalExtractor ?? "Local extraction") : (t.modal?.fillFromText?.useServerExtractor ?? "Server API")}>
          <input
            type="checkbox"
            checked={!!useLocalExtractor}
            onChange={(e) => onUseLocalExtractorChange(e.target.checked)}
            className="rounded border-white/30 bg-white/10"
          />
          <span className="text-sm text-white/90 whitespace-nowrap">
            {useLocalExtractor ? (t.modal?.fillFromText?.useLocalExtractor ?? "Local") : (t.modal?.fillFromText?.useServerExtractor ?? "Server")}
          </span>
        </label>
      )}
      <button
        type="button"
        onClick={handleExtract}
        disabled={!text?.trim() || extracting}
        className="px-3 py-1.5 rounded-md bg-white text-primary hover:bg-white/90 text-sm font-medium disabled:opacity-70 disabled:pointer-events-none inline-flex items-center justify-center gap-2"
      >
        {extracting ? (
          <>
            <span className="inline-block w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            {t.modal?.fillFromText?.extracting ?? "Extracting..."}
          </>
        ) : (
          t.modal?.fillFromText?.extractButton ?? "Extract"
        )}
      </button>
    </div>
  );

  return (
    <UnifiedDialog
      isOpen={isOpen}
      onClose={handleCancel}
      title={t.modal?.fillFromText?.dialogTitle ?? "Fill from text"}
      cancelLabel={t.cancel ?? "Cancel"}
      onCancel={handleCancel}
      headerTrailing={headerTrailing}
      closeOnOutsideClick={false}
      closeOnEscape={true}
    >
      <div className="p-4 md:p-6 space-y-4">
        <LenaTextarea
          name="fillFromText"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t.modal?.fillFromText?.placeholder ?? "Paste text here from WhatsApp/Facebook to auto-fill these fields"}
          helperText={t.modal?.fillFromText?.placeholder}
          rows={8}
          className="w-full"
          disabled={extracting}
        />
      </div>
    </UnifiedDialog>
  );
}
