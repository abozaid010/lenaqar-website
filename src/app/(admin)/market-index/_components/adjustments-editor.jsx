"use client";

import { Plus, Trash2 } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import {
  LenaTextField,
  LenaFieldWrapper,
  SearchableDropdownSelect,
} from "@/components/ui/inputs";
import { VIEWS, FINISHINGS } from "@/lib/market-index/constants";

function mapToRows(map) {
  return Object.entries(map || {}).map(([key, pct]) => ({
    key,
    pctDisplay: pct == null || Number.isNaN(Number(pct)) ? "" : String(Number(pct) * 100),
  }));
}

function rowsToMap(rows) {
  const out = {};
  for (const row of rows) {
    if (!row.key) continue;
    const n = Number(row.pctDisplay);
    if (Number.isNaN(n)) continue;
    out[row.key] = n / 100;
  }
  return out;
}

function AdjustmentGroup({
  title,
  options,
  rows,
  onChange,
  canEdit,
  remainingOptions,
}) {
  const { translate } = useI18n();

  const update = (index, patch) => {
    onChange(rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-medium text-gray-800">{title}</h4>
        {canEdit && remainingOptions.length > 0 && (
          <button
            type="button"
            onClick={() =>
              onChange([...rows, { key: remainingOptions[0], pctDisplay: "" }])
            }
            className="inline-flex items-center gap-1 text-sm text-primary hover:opacity-80"
          >
            <Plus className="h-4 w-4" />
            {translate("marketIndex.adjustments.add")}
          </button>
        )}
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-500">{translate("marketIndex.adjustments.empty")}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((row, index) => {
            const opts = [
              ...(row.key ? [row.key] : []),
              ...remainingOptions.filter((o) => o !== row.key),
            ];
            return (
              <div key={index} className="flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[160px]">
                  <LenaFieldWrapper>
                    <SearchableDropdownSelect
                      name={`adj_key_${title}_${index}`}
                      label={translate("marketIndex.adjustments.key")}
                      options={opts.length ? opts : options}
                      value={row.key || ""}
                      onChange={(e) => update(index, { key: e.target.value })}
                      disabled={!canEdit}
                    />
                  </LenaFieldWrapper>
                </div>
                <div className="w-36">
                  <LenaTextField
                    label={translate("marketIndex.adjustments.pct")}
                    name={`adj_pct_${title}_${index}`}
                    type="number"
                    step="0.1"
                    value={row.pctDisplay}
                    onChange={(e) => update(index, { pctDisplay: e.target.value })}
                    disabled={!canEdit}
                    placeholder="e.g. 5 or -10"
                  />
                </div>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => onChange(rows.filter((_, i) => i !== index))}
                    className="p-2 mb-1 text-red-500 hover:bg-red-50 rounded"
                    aria-label={translate("common.delete")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function serializeAdjustments(viewRows, finishingRows) {
  return {
    view: rowsToMap(viewRows),
    finishing: rowsToMap(finishingRows),
  };
}

export function adjustmentsToRows(adjustments) {
  return {
    viewRows: mapToRows(adjustments?.view),
    finishingRows: mapToRows(adjustments?.finishing),
  };
}

export default function AdjustmentsEditor({
  viewRows = [],
  finishingRows = [],
  onViewRowsChange,
  onFinishingRowsChange,
  canEdit = true,
}) {
  const { translate } = useI18n();

  const usedViews = new Set(viewRows.map((r) => r.key).filter(Boolean));
  const usedFinishings = new Set(finishingRows.map((r) => r.key).filter(Boolean));

  return (
    <section className="flex flex-col gap-6">
      <h3 className="text-base font-semibold text-gray-900">
        {translate("marketIndex.sections.adjustments")}
      </h3>
      <AdjustmentGroup
        title={translate("marketIndex.adjustments.view")}
        options={VIEWS}
        rows={viewRows}
        onChange={onViewRowsChange}
        canEdit={canEdit}
        remainingOptions={VIEWS.filter((v) => !usedViews.has(v))}
      />
      <AdjustmentGroup
        title={translate("marketIndex.adjustments.finishing")}
        options={FINISHINGS}
        rows={finishingRows}
        onChange={onFinishingRowsChange}
        canEdit={canEdit}
        remainingOptions={FINISHINGS.filter((v) => !usedFinishings.has(v))}
      />
    </section>
  );
}
