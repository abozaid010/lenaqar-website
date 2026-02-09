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

  return (
    <UnifiedDialog
      isOpen={isOpen}
      onClose={handleCancel}
      title={t.modal?.fillFromText?.dialogTitle ?? "Fill from text"}
      cancelLabel={t.cancel ?? "Cancel"}
      onCancel={handleCancel}
      submitLabel={extracting ? (t.modal?.fillFromText?.extracting ?? "Extracting...") : (t.modal?.fillFromText?.extractButton ?? "Extract")}
      onSubmit={handleExtract}
      submitDisabled={!text?.trim() || extracting}
      submitLoading={extracting}
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
