"use client";

import { useEffect, useState } from "react";
import UnifiedDialog from "@/components/ui/UnifiedDialog";
import { LenaTextarea } from "@/components/ui/inputs";
import { useI18n } from "@/hooks/useI18n";
import { locationLabel } from "./location-label";

function parseAliases(raw) {
  return String(raw || "")
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function AliasesDialog({
  isOpen,
  onClose,
  onSubmit,
  location = null,
  submitting = false,
}) {
  const { translate, locale } = useI18n();
  const [aliasesRaw, setAliasesRaw] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setAliasesRaw((location?.aliases || []).join("\n"));
  }, [isOpen, location]);

  return (
    <UnifiedDialog
      isOpen={isOpen}
      onClose={onClose}
      title={translate("locations.aliases.title")}
      cancelLabel={translate("common.cancel")}
      submitLabel={translate("locations.aliases.save")}
      submitDisabled={submitting || !location}
      submitLoading={submitting}
      onSubmit={() => onSubmit(parseAliases(aliasesRaw))}
      dialogClassName="max-w-lg"
      bodyClassName="p-4 space-y-3 overflow-y-auto"
    >
      {location ? (
        <p className="text-sm text-gray-600">
          {locationLabel(location, locale)}
        </p>
      ) : null}
      <LenaTextarea
        label={translate("locations.form.aliases")}
        name="aliases"
        value={aliasesRaw}
        onChange={(e) => setAliasesRaw(e.target.value)}
        rows={5}
        placeholder={translate("locations.form.aliasesPlaceholder")}
      />
      <p className="text-xs text-gray-500">
        {translate("locations.aliases.hint")}
      </p>
    </UnifiedDialog>
  );
}
