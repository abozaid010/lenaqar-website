"use client";

import { Plus, Trash2 } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import {
  LenaTextField,
  LenaFieldWrapper,
  SearchableDropdownSelect,
} from "@/components/ui/inputs";
import { PROPERTY_TYPES } from "@/lib/market-index/constants";
import EvidenceListEditor, {
  serializeEvidence,
  validateEvidenceList,
} from "./evidence-list-editor";

export function validateGeneralForm(state, translate) {
  const errors = {};

  if (
    state.public_listing_count === "" ||
    state.public_listing_count == null ||
    Number.isNaN(Number(state.public_listing_count)) ||
    Number(state.public_listing_count) < 0 ||
    !Number.isInteger(Number(state.public_listing_count))
  ) {
    errors.public_listing_count = translate("marketIndex.validation.nonNegativeInt");
  }

  if (
    state.location_avg_price_per_sqm !== "" &&
    state.location_avg_price_per_sqm != null &&
    !(Number(state.location_avg_price_per_sqm) > 0)
  ) {
    errors.location_avg_price_per_sqm = translate("marketIndex.validation.positiveNumber");
  }

  const rangePct = Number(state.default_range_pct_display);
  if (
    state.default_range_pct_display === "" ||
    Number.isNaN(rangePct) ||
    rangePct < 0 ||
    rangePct >= 100
  ) {
    errors.default_range_pct = translate("marketIndex.validation.rangePct");
  }

  for (const key of [
    "listing_count_w",
    "evidence_w",
    "freshness_w",
    "review_w",
  ]) {
    const n = Number(state.confidence_weights?.[key]);
    if (Number.isNaN(n)) {
      errors[`confidence_weights.${key}`] = translate("marketIndex.validation.required");
    }
  }

  state.propertyTypeRows.forEach((row, i) => {
    if (!row.type) {
      errors[`pt_${i}_type`] = translate("marketIndex.validation.required");
    }
    if (!(Number(row.price) > 0)) {
      errors[`pt_${i}_price`] = translate("marketIndex.validation.positiveNumber");
    }
  });

  state.areaBucketGroups.forEach((group, gi) => {
    if (!group.type) {
      errors[`ab_${gi}_type`] = translate("marketIndex.validation.required");
    }
    group.buckets.forEach((b, bi) => {
      const min = Number(b.min_sqm);
      const max = Number(b.max_sqm);
      const price = Number(b.avg_price_per_sqm);
      if (Number.isNaN(min) || min < 0) {
        errors[`ab_${gi}_${bi}_min`] = translate("marketIndex.validation.nonNegativeNumber");
      }
      if (!(max > 0)) {
        errors[`ab_${gi}_${bi}_max`] = translate("marketIndex.validation.positiveNumber");
      }
      if (!(price > 0)) {
        errors[`ab_${gi}_${bi}_price`] = translate("marketIndex.validation.positiveNumber");
      }
      if (!Number.isNaN(min) && !Number.isNaN(max) && min > max) {
        errors[`ab_${gi}_${bi}_min`] = translate("marketIndex.validation.minMax");
      }
    });
  });

  const evidenceErrors = validateEvidenceList(state.evidence, translate);
  return { errors, evidenceErrors };
}

export function serializeGeneral(state) {
  const property_type_avg_price_per_sqm = {};
  for (const row of state.propertyTypeRows) {
    if (row.type && Number(row.price) > 0) {
      property_type_avg_price_per_sqm[row.type] = Number(row.price);
    }
  }

  const area_buckets = {};
  for (const group of state.areaBucketGroups) {
    if (!group.type) continue;
    area_buckets[group.type] = group.buckets.map((b) => ({
      min_sqm: Number(b.min_sqm),
      max_sqm: Number(b.max_sqm),
      avg_price_per_sqm: Number(b.avg_price_per_sqm),
    }));
  }

  const locAvg =
    state.location_avg_price_per_sqm === "" ||
    state.location_avg_price_per_sqm == null
      ? null
      : Number(state.location_avg_price_per_sqm);

  return {
    public_listing_count: Number(state.public_listing_count),
    location_avg_price_per_sqm: locAvg,
    property_type_avg_price_per_sqm,
    area_buckets,
    default_range_pct: Number(state.default_range_pct_display) / 100,
    confidence_weights: {
      listing_count_w: Number(state.confidence_weights.listing_count_w),
      evidence_w: Number(state.confidence_weights.evidence_w),
      freshness_w: Number(state.confidence_weights.freshness_w),
      review_w: Number(state.confidence_weights.review_w),
    },
    evidence: serializeEvidence(state.evidence),
  };
}

export function generalToFormState(general) {
  const g = general || {};
  const propertyTypeRows = Object.entries(g.property_type_avg_price_per_sqm || {}).map(
    ([type, price]) => ({ type, price: String(price) })
  );
  const areaBucketGroups = Object.entries(g.area_buckets || {}).map(
    ([type, buckets]) => ({
      type,
      buckets: (buckets || []).map((b) => ({
        min_sqm: String(b.min_sqm ?? ""),
        max_sqm: String(b.max_sqm ?? ""),
        avg_price_per_sqm: String(b.avg_price_per_sqm ?? ""),
      })),
    })
  );

  return {
    public_listing_count: g.public_listing_count ?? 0,
    location_avg_price_per_sqm:
      g.location_avg_price_per_sqm == null ? "" : String(g.location_avg_price_per_sqm),
    default_range_pct_display: String(
      ((g.default_range_pct ?? 0.07) * 100).toFixed(2).replace(/\.?0+$/, "") || "7"
    ),
    confidence_weights: {
      listing_count_w: g.confidence_weights?.listing_count_w ?? 25,
      evidence_w: g.confidence_weights?.evidence_w ?? 25,
      freshness_w: g.confidence_weights?.freshness_w ?? 25,
      review_w: g.confidence_weights?.review_w ?? 25,
    },
    propertyTypeRows,
    areaBucketGroups,
    evidence: (g.evidence || []).map((e) => ({
      source: e.source || "aqarmap",
      url: e.url || "",
      date: e.date || "",
      notes: e.notes || "",
    })),
  };
}

export default function CardGeneralForm({
  state,
  onChange,
  canEdit = true,
  fieldErrors = {},
  evidenceErrors = [],
}) {
  const { translate } = useI18n();

  const patch = (partial) => onChange({ ...state, ...partial });

  const usedPt = new Set(state.propertyTypeRows.map((r) => r.type).filter(Boolean));
  const usedAb = new Set(state.areaBucketGroups.map((g) => g.type).filter(Boolean));

  return (
    <section className="flex flex-col gap-6">
      <h3 className="text-base font-semibold text-gray-900">
        {translate("marketIndex.sections.general")}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <LenaTextField
          label={translate("marketIndex.fields.publicListingCount")}
          name="public_listing_count"
          type="number"
          min={0}
          step={1}
          value={state.public_listing_count}
          onChange={(e) => patch({ public_listing_count: e.target.value })}
          error={Boolean(fieldErrors.public_listing_count)}
          errorMessage={fieldErrors.public_listing_count}
          disabled={!canEdit}
          required
        />
        <LenaTextField
          label={translate("marketIndex.fields.locationAvgPrice")}
          name="location_avg_price_per_sqm"
          type="number"
          min={0}
          step="any"
          value={state.location_avg_price_per_sqm}
          onChange={(e) => patch({ location_avg_price_per_sqm: e.target.value })}
          error={Boolean(fieldErrors.location_avg_price_per_sqm)}
          errorMessage={fieldErrors.location_avg_price_per_sqm}
          disabled={!canEdit}
        />
        <LenaTextField
          label={translate("marketIndex.fields.defaultRangePct")}
          name="default_range_pct"
          type="number"
          min={0}
          max={99.99}
          step="0.01"
          value={state.default_range_pct_display}
          onChange={(e) => patch({ default_range_pct_display: e.target.value })}
          error={Boolean(fieldErrors.default_range_pct)}
          errorMessage={fieldErrors.default_range_pct}
          disabled={!canEdit}
          required
        />
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-800 mb-3">
          {translate("marketIndex.fields.confidenceWeights")}
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            ["listing_count_w", "listingCountW"],
            ["evidence_w", "evidenceW"],
            ["freshness_w", "freshnessW"],
            ["review_w", "reviewW"],
          ].map(([key, labelKey]) => (
            <LenaTextField
              key={key}
              label={translate(`marketIndex.fields.${labelKey}`)}
              name={key}
              type="number"
              step="any"
              value={state.confidence_weights[key]}
              onChange={(e) =>
                patch({
                  confidence_weights: {
                    ...state.confidence_weights,
                    [key]: e.target.value,
                  },
                })
              }
              error={Boolean(fieldErrors[`confidence_weights.${key}`])}
              errorMessage={fieldErrors[`confidence_weights.${key}`]}
              disabled={!canEdit}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-800">
            {translate("marketIndex.fields.propertyTypeAvg")}
          </h4>
          {canEdit && (
            <button
              type="button"
              onClick={() =>
                patch({
                  propertyTypeRows: [
                    ...state.propertyTypeRows,
                    { type: "", price: "" },
                  ],
                })
              }
              className="inline-flex items-center gap-1 text-sm text-primary"
            >
              <Plus className="h-4 w-4" />
              {translate("marketIndex.actions.addRow")}
            </button>
          )}
        </div>
        {state.propertyTypeRows.map((row, index) => {
          const opts = [
            ...(row.type ? [row.type] : []),
            ...PROPERTY_TYPES.filter((t) => !usedPt.has(t) || t === row.type),
          ];
          return (
            <div key={index} className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[180px]">
                <LenaFieldWrapper
                  error={Boolean(fieldErrors[`pt_${index}_type`])}
                  errorMessage={fieldErrors[`pt_${index}_type`]}
                >
                  <SearchableDropdownSelect
                    name={`pt_type_${index}`}
                    label={translate("marketIndex.fields.propertyType")}
                    options={opts}
                    value={row.type}
                    onChange={(e) => {
                      const next = state.propertyTypeRows.map((r, i) =>
                        i === index ? { ...r, type: e.target.value } : r
                      );
                      patch({ propertyTypeRows: next });
                    }}
                    disabled={!canEdit}
                  />
                </LenaFieldWrapper>
              </div>
              <div className="w-40">
                <LenaTextField
                  label={translate("marketIndex.fields.avgPrice")}
                  name={`pt_price_${index}`}
                  type="number"
                  value={row.price}
                  onChange={(e) => {
                    const next = state.propertyTypeRows.map((r, i) =>
                      i === index ? { ...r, price: e.target.value } : r
                    );
                    patch({ propertyTypeRows: next });
                  }}
                  error={Boolean(fieldErrors[`pt_${index}_price`])}
                  errorMessage={fieldErrors[`pt_${index}_price`]}
                  disabled={!canEdit}
                />
              </div>
              {canEdit && (
                <button
                  type="button"
                  onClick={() =>
                    patch({
                      propertyTypeRows: state.propertyTypeRows.filter(
                        (_, i) => i !== index
                      ),
                    })
                  }
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

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-800">
            {translate("marketIndex.fields.areaBuckets")}
          </h4>
          {canEdit && (
            <button
              type="button"
              onClick={() =>
                patch({
                  areaBucketGroups: [
                    ...state.areaBucketGroups,
                    {
                      type: "",
                      buckets: [
                        { min_sqm: "0", max_sqm: "", avg_price_per_sqm: "" },
                      ],
                    },
                  ],
                })
              }
              className="inline-flex items-center gap-1 text-sm text-primary"
            >
              <Plus className="h-4 w-4" />
              {translate("marketIndex.actions.addPropertyType")}
            </button>
          )}
        </div>

        {state.areaBucketGroups.map((group, gi) => {
          const opts = [
            ...(group.type ? [group.type] : []),
            ...PROPERTY_TYPES.filter((t) => !usedAb.has(t) || t === group.type),
          ];
          return (
            <div
              key={gi}
              className="border border-gray-200 rounded-lg p-4 flex flex-col gap-3"
            >
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[180px]">
                  <LenaFieldWrapper
                    error={Boolean(fieldErrors[`ab_${gi}_type`])}
                    errorMessage={fieldErrors[`ab_${gi}_type`]}
                  >
                    <SearchableDropdownSelect
                      name={`ab_type_${gi}`}
                      label={translate("marketIndex.fields.propertyType")}
                      options={opts}
                      value={group.type}
                      onChange={(e) => {
                        const next = state.areaBucketGroups.map((g, i) =>
                          i === gi ? { ...g, type: e.target.value } : g
                        );
                        patch({ areaBucketGroups: next });
                      }}
                      disabled={!canEdit}
                    />
                  </LenaFieldWrapper>
                </div>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() =>
                      patch({
                        areaBucketGroups: state.areaBucketGroups.filter(
                          (_, i) => i !== gi
                        ),
                      })
                    }
                    className="p-2 text-red-500 hover:bg-red-50 rounded"
                    aria-label={translate("common.delete")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              {group.buckets.map((b, bi) => (
                <div key={bi} className="flex flex-wrap items-end gap-3">
                  <div className="w-28">
                    <LenaTextField
                      label={translate("marketIndex.fields.minSqm")}
                      name={`ab_min_${gi}_${bi}`}
                      type="number"
                      value={b.min_sqm}
                      onChange={(e) => {
                        const next = state.areaBucketGroups.map((g, i) => {
                          if (i !== gi) return g;
                          const buckets = g.buckets.map((bb, j) =>
                            j === bi ? { ...bb, min_sqm: e.target.value } : bb
                          );
                          return { ...g, buckets };
                        });
                        patch({ areaBucketGroups: next });
                      }}
                      error={Boolean(fieldErrors[`ab_${gi}_${bi}_min`])}
                      errorMessage={fieldErrors[`ab_${gi}_${bi}_min`]}
                      disabled={!canEdit}
                    />
                  </div>
                  <div className="w-28">
                    <LenaTextField
                      label={translate("marketIndex.fields.maxSqm")}
                      name={`ab_max_${gi}_${bi}`}
                      type="number"
                      value={b.max_sqm}
                      onChange={(e) => {
                        const next = state.areaBucketGroups.map((g, i) => {
                          if (i !== gi) return g;
                          const buckets = g.buckets.map((bb, j) =>
                            j === bi ? { ...bb, max_sqm: e.target.value } : bb
                          );
                          return { ...g, buckets };
                        });
                        patch({ areaBucketGroups: next });
                      }}
                      error={Boolean(fieldErrors[`ab_${gi}_${bi}_max`])}
                      errorMessage={fieldErrors[`ab_${gi}_${bi}_max`]}
                      disabled={!canEdit}
                    />
                  </div>
                  <div className="w-36">
                    <LenaTextField
                      label={translate("marketIndex.fields.avgPrice")}
                      name={`ab_price_${gi}_${bi}`}
                      type="number"
                      value={b.avg_price_per_sqm}
                      onChange={(e) => {
                        const next = state.areaBucketGroups.map((g, i) => {
                          if (i !== gi) return g;
                          const buckets = g.buckets.map((bb, j) =>
                            j === bi
                              ? { ...bb, avg_price_per_sqm: e.target.value }
                              : bb
                          );
                          return { ...g, buckets };
                        });
                        patch({ areaBucketGroups: next });
                      }}
                      error={Boolean(fieldErrors[`ab_${gi}_${bi}_price`])}
                      errorMessage={fieldErrors[`ab_${gi}_${bi}_price`]}
                      disabled={!canEdit}
                    />
                  </div>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => {
                        const next = state.areaBucketGroups.map((g, i) => {
                          if (i !== gi) return g;
                          return {
                            ...g,
                            buckets: g.buckets.filter((_, j) => j !== bi),
                          };
                        });
                        patch({ areaBucketGroups: next });
                      }}
                      className="p-2 mb-1 text-red-500 hover:bg-red-50 rounded"
                      aria-label={translate("common.delete")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}

              {canEdit && (
                <button
                  type="button"
                  onClick={() => {
                    const next = state.areaBucketGroups.map((g, i) => {
                      if (i !== gi) return g;
                      return {
                        ...g,
                        buckets: [
                          ...g.buckets,
                          { min_sqm: "", max_sqm: "", avg_price_per_sqm: "" },
                        ],
                      };
                    });
                    patch({ areaBucketGroups: next });
                  }}
                  className="inline-flex items-center gap-1 text-sm text-primary self-start"
                >
                  <Plus className="h-4 w-4" />
                  {translate("marketIndex.actions.addBucket")}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <EvidenceListEditor
        value={state.evidence}
        onChange={(evidence) => patch({ evidence })}
        canEdit={canEdit}
        errors={evidenceErrors}
      />
    </section>
  );
}
