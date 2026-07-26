"use client";

import { useEffect, useState } from "react";
import UnifiedDialog from "@/components/ui/UnifiedDialog";
import { LenaTextField, LenaTextarea } from "@/components/ui/inputs";
import { useI18n } from "@/hooks/useI18n";

function parseAliases(raw) {
  return String(raw || "")
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Create city / district / sub_district under an optional parent.
 */
export default function LocationFormDialog({
  isOpen,
  onClose,
  onSubmit,
  level,
  parent = null,
  submitting = false,
}) {
  const { translate, locale } = useI18n();
  const [enName, setEnName] = useState("");
  const [arName, setArName] = useState("");
  const [aliasesRaw, setAliasesRaw] = useState("");
  const [slugSource, setSlugSource] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setEnName("");
    setArName("");
    setAliasesRaw("");
    setSlugSource("");
    setError("");
  }, [isOpen]);

  const levelLabel = translate(`locations.levels.${level}`);
  const parentLabel = parent
    ? locale === "ar" && parent.ar_name
      ? parent.ar_name
      : parent.en_name
    : null;

  const handleSubmit = () => {
    const trimmed = enName.trim();
    if (!trimmed) {
      setError(translate("locations.validation.enNameRequired"));
      return;
    }
    setError("");
    onSubmit({
      level,
      en_name: trimmed,
      ar_name: arName.trim(),
      aliases: parseAliases(aliasesRaw),
      parent_id: level === "city" ? "eg" : parent?.id || null,
      ...(level === "city" && slugSource.trim()
        ? { slug_source: slugSource.trim() }
        : {}),
    });
  };

  return (
    <UnifiedDialog
      isOpen={isOpen}
      onClose={onClose}
      title={translate("locations.form.addTitle").replace("{level}", levelLabel)}
      cancelLabel={translate("common.cancel")}
      submitLabel={translate("locations.form.submit")}
      submitDisabled={submitting}
      submitLoading={submitting}
      onSubmit={handleSubmit}
      dialogClassName="max-w-lg"
      bodyClassName="p-4 space-y-4 overflow-y-auto"
    >
      {parentLabel ? (
        <p className="text-sm text-gray-600">
          {translate("locations.form.parentLabel")}:{" "}
          <span className="font-medium text-gray-900">{parentLabel}</span>
        </p>
      ) : null}

      <LenaTextField
        label={translate("locations.form.enName")}
        name="en_name"
        value={enName}
        onChange={(e) => setEnName(e.target.value)}
        error={error}
        required
      />
      <LenaTextField
        label={translate("locations.form.arName")}
        name="ar_name"
        value={arName}
        onChange={(e) => setArName(e.target.value)}
      />
      {level === "city" ? (
        <LenaTextField
          label={translate("locations.form.slugSource")}
          name="slug_source"
          value={slugSource}
          onChange={(e) => setSlugSource(e.target.value)}
          placeholder={translate("locations.form.slugSourcePlaceholder")}
        />
      ) : null}
      <LenaTextarea
        label={translate("locations.form.aliases")}
        name="aliases"
        value={aliasesRaw}
        onChange={(e) => setAliasesRaw(e.target.value)}
        rows={3}
        placeholder={translate("locations.form.aliasesPlaceholder")}
      />
    </UnifiedDialog>
  );
}
