"use client";

import { Plus, Trash2 } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import {
  LenaTextField,
  LenaTextarea,
  LenaFieldWrapper,
  SearchableDropdownSelect,
} from "@/components/ui/inputs";
import { EVIDENCE_SOURCES } from "@/lib/market-index/constants";

function emptyEvidence() {
  return { source: "aqarmap", url: "", date: "", notes: "" };
}

export function validateEvidenceList(list, translate) {
  const errors = [];
  (list || []).forEach((item, index) => {
    if (!item?.source) {
      errors.push({ index, field: "source", message: translate("marketIndex.validation.required") });
    }
    if (!item?.date) {
      errors.push({ index, field: "date", message: translate("marketIndex.validation.required") });
    }
    if (item?.source === "other" && !(item?.notes || "").trim()) {
      errors.push({
        index,
        field: "notes",
        message: translate("marketIndex.validation.notesRequiredForOther"),
      });
    }
  });
  return errors;
}

/**
 * API expects Evidence.date as ISO date string `YYYY-MM-DD` (not datetime).
 * HTML date inputs already produce that; normalize any longer ISO values too.
 */
export function normalizeEvidenceDate(value) {
  if (value == null || value === "") return "";
  const raw = String(value).trim();
  const match = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : raw;
}

export function serializeEvidence(list) {
  return (list || []).map((item) => ({
    source: item.source,
    url: item.url?.trim() ? item.url.trim() : null,
    date: normalizeEvidenceDate(item.date),
    notes: item.notes?.trim() ? item.notes.trim() : null,
  }));
}

export default function EvidenceListEditor({
  value = [],
  onChange,
  canEdit = true,
  errors = [],
}) {
  const { translate } = useI18n();
  const rows = Array.isArray(value) ? value : [];

  const errorFor = (index, field) =>
    errors.find((e) => e.index === index && e.field === field)?.message;

  const updateRow = (index, patch) => {
    const next = rows.map((row, i) => (i === index ? { ...row, ...patch } : row));
    onChange?.(next);
  };

  const removeRow = (index) => {
    onChange?.(rows.filter((_, i) => i !== index));
  };

  const addRow = () => {
    onChange?.([...rows, emptyEvidence()]);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-medium text-gray-800">
          {translate("marketIndex.evidence.title")}
        </h4>
        {canEdit && (
          <button
            type="button"
            onClick={addRow}
            className="inline-flex items-center gap-1 text-sm text-primary hover:opacity-80"
          >
            <Plus className="h-4 w-4" />
            {translate("marketIndex.evidence.add")}
          </button>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-gray-500">{translate("marketIndex.evidence.empty")}</p>
      ) : (
        <div className="flex flex-col gap-4">
          {rows.map((row, index) => (
            <div
              key={index}
              className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 border border-gray-200 rounded-lg relative"
            >
              {canEdit && (
                <button
                  type="button"
                  onClick={() => removeRow(index)}
                  className="absolute top-2 end-2 p-1 text-red-500 hover:bg-red-50 rounded"
                  aria-label={translate("common.delete")}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              <LenaFieldWrapper
                error={Boolean(errorFor(index, "source"))}
                errorMessage={errorFor(index, "source")}
              >
                <SearchableDropdownSelect
                  name={`evidence_source_${index}`}
                  label={translate("marketIndex.evidence.source")}
                  options={EVIDENCE_SOURCES}
                  value={row.source || ""}
                  onChange={(e) => updateRow(index, { source: e.target.value })}
                  disabled={!canEdit}
                  required
                />
              </LenaFieldWrapper>
              <LenaTextField
                label={translate("marketIndex.evidence.date")}
                name={`evidence_date_${index}`}
                type="date"
                value={row.date || ""}
                onChange={(e) => updateRow(index, { date: e.target.value })}
                error={Boolean(errorFor(index, "date"))}
                errorMessage={errorFor(index, "date")}
                disabled={!canEdit}
                required
              />
              <LenaTextField
                label={translate("marketIndex.evidence.url")}
                name={`evidence_url_${index}`}
                type="url"
                value={row.url || ""}
                onChange={(e) => updateRow(index, { url: e.target.value })}
                disabled={!canEdit}
                placeholder="https://"
              />
              <LenaTextarea
                label={translate("marketIndex.evidence.notes")}
                name={`evidence_notes_${index}`}
                value={row.notes || ""}
                onChange={(e) => updateRow(index, { notes: e.target.value })}
                error={Boolean(errorFor(index, "notes"))}
                errorMessage={errorFor(index, "notes")}
                disabled={!canEdit}
                rows={2}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
