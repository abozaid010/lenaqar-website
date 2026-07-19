"use client";

import {
  LenaTextField,
  SearchableDropdownSelect,
} from "@/components/ui/inputs";
import { useI18n } from "@/hooks/useI18n";
import {
  EVALUATE_PROPERTY_TYPES,
  VIEWS,
  FINISHINGS,
} from "@/lib/market-index/constants";

function optionalInt(value) {
  if (value === "" || value == null) return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0) return NaN;
  return n;
}

export function validateEvaluateForm(form, translate) {
  const errors = {};
  if (!form.property_type) {
    errors.property_type = translate("marketEvaluate.validation.required");
  }
  const area = Number(form.area_sqm);
  if (!(area > 0)) {
    errors.area_sqm = translate("marketEvaluate.validation.positiveNumber");
  }
  const beds = optionalInt(form.bedrooms);
  if (form.bedrooms !== "" && form.bedrooms != null && Number.isNaN(beds)) {
    errors.bedrooms = translate("marketEvaluate.validation.nonNegativeInt");
  }
  const baths = optionalInt(form.bathrooms);
  if (form.bathrooms !== "" && form.bathrooms != null && Number.isNaN(baths)) {
    errors.bathrooms = translate("marketEvaluate.validation.nonNegativeInt");
  }
  return errors;
}

export function formToEstimateRequest(form, locationId) {
  const bedrooms = optionalInt(form.bedrooms);
  const bathrooms = optionalInt(form.bathrooms);
  return {
    location_id: locationId,
    property_type: form.property_type,
    area_sqm: Number(form.area_sqm),
    bedrooms: Number.isNaN(bedrooms) ? null : bedrooms,
    bathrooms: Number.isNaN(bathrooms) ? null : bathrooms,
    view: form.view || null,
    finishing: form.finishing || null,
  };
}

export default function EvaluateForm({
  form,
  onChange,
  errors,
  disabled,
  submitting,
  onSubmit,
  bedroomHints = [],
  bathroomHints = [],
  showSubmitButton = true,
  compact = false,
}) {
  const { translate } = useI18n();
  const patch = (partial) => onChange({ ...form, ...partial });

  const propertyOptions = EVALUATE_PROPERTY_TYPES.map((t) => ({
    value: t,
    label: translate(`marketEvaluate.propertyTypes.${t}`) || t,
  }));
  const viewOptions = [
    { value: "", label: translate("marketEvaluate.form.anyOptional") },
    ...VIEWS.map((v) => ({
      value: v,
      label: translate(`marketEvaluate.views.${v}`) || v,
    })),
  ];
  const finishingOptions = [
    { value: "", label: translate("marketEvaluate.form.anyOptional") },
    ...FINISHINGS.map((f) => ({
      value: f,
      label: translate(`marketEvaluate.finishings.${f}`) || f,
    })),
  ];

  return (
    <form
      className={
        compact
          ? "flex flex-col gap-3"
          : "rounded-lg border border-gray-200 bg-white p-4 flex flex-col gap-4"
      }
      onSubmit={(e) => {
        e.preventDefault();
        if (!disabled && !submitting) onSubmit();
      }}
    >
      {!compact && (
        <h2 className="text-sm font-semibold text-gray-900">
          {translate("marketEvaluate.form.title")}
        </h2>
      )}

      <SearchableDropdownSelect
        name="property_type"
        label={translate("marketEvaluate.form.propertyType")}
        options={propertyOptions}
        value={form.property_type}
        onChange={(e) => patch({ property_type: e.target.value })}
        disabled={disabled}
        error={errors.property_type}
        placeholder={translate("marketEvaluate.form.select")}
        getLabel={(opt) => opt.label || opt.value}
        getValue={(opt) => opt.value}
      />

      <LenaTextField
        label={translate("marketEvaluate.form.areaSqm")}
        type="number"
        min="0"
        step="any"
        value={form.area_sqm}
        onChange={(e) => patch({ area_sqm: e.target.value })}
        error={errors.area_sqm}
        disabled={disabled}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <LenaTextField
            label={translate("marketEvaluate.form.bedrooms")}
            type="number"
            min="0"
            step="1"
            value={form.bedrooms}
            onChange={(e) => patch({ bedrooms: e.target.value })}
            error={errors.bedrooms}
            disabled={disabled}
          />
          {bedroomHints.length > 0 && (
            <p className="text-xs text-gray-500">
              {translate("marketEvaluate.form.hints").replace(
                "{values}",
                bedroomHints.join(", ")
              )}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <LenaTextField
            label={translate("marketEvaluate.form.bathrooms")}
            type="number"
            min="0"
            step="1"
            value={form.bathrooms}
            onChange={(e) => patch({ bathrooms: e.target.value })}
            error={errors.bathrooms}
            disabled={disabled}
          />
          {bathroomHints.length > 0 && (
            <p className="text-xs text-gray-500">
              {translate("marketEvaluate.form.hints").replace(
                "{values}",
                bathroomHints.join(", ")
              )}
            </p>
          )}
        </div>
      </div>

      <SearchableDropdownSelect
        name="view"
        label={translate("marketEvaluate.form.view")}
        options={viewOptions}
        value={form.view}
        onChange={(e) => patch({ view: e.target.value })}
        disabled={disabled}
        placeholder={translate("marketEvaluate.form.anyOptional")}
        getLabel={(opt) => opt.label || opt.value}
        getValue={(opt) => opt.value}
      />

      <SearchableDropdownSelect
        name="finishing"
        label={translate("marketEvaluate.form.finishing")}
        options={finishingOptions}
        value={form.finishing}
        onChange={(e) => patch({ finishing: e.target.value })}
        disabled={disabled}
        placeholder={translate("marketEvaluate.form.anyOptional")}
        getLabel={(opt) => opt.label || opt.value}
        getValue={(opt) => opt.value}
      />

      {showSubmitButton && (
        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={disabled || submitting}
            className="inline-flex items-center justify-center min-h-10 px-5 rounded-md bg-primary text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting
              ? translate("marketEvaluate.form.evaluating")
              : translate("marketEvaluate.form.submit")}
          </button>
        </div>
      )}
    </form>
  );
}
