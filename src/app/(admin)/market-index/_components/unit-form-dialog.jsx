"use client";

import { useEffect, useState } from "react";
import UnifiedDialog from "@/components/ui/UnifiedDialog";
import {
  LenaTextField,
  LenaFieldWrapper,
  SearchableDropdownSelect,
} from "@/components/ui/inputs";
import { useI18n } from "@/hooks/useI18n";
import { PROPERTY_TYPES } from "@/lib/market-index/constants";
import EvidenceListEditor, {
  serializeEvidence,
  validateEvidenceList,
} from "./evidence-list-editor";

function emptyUnitForm() {
  return {
    property_type: "",
    area_sqm: "",
    bedrooms: "0",
    bathrooms: "0",
    estimated_avg_price: "",
    price_low: "",
    price_high: "",
    developer_price: "",
    monthly_rent: "",
    monthly_furnished_rent: "",
    evidence: [],
  };
}

function unitToForm(unit) {
  if (!unit) return emptyUnitForm();
  return {
    property_type: unit.property_type || "",
    area_sqm: String(unit.area_sqm ?? ""),
    bedrooms: String(unit.bedrooms ?? 0),
    bathrooms: String(unit.bathrooms ?? 0),
    estimated_avg_price: String(unit.estimated_avg_price ?? ""),
    price_low: String(unit.price_range?.low ?? ""),
    price_high: String(unit.price_range?.high ?? ""),
    developer_price:
      unit.developer_price == null ? "" : String(unit.developer_price),
    monthly_rent: unit.monthly_rent == null ? "" : String(unit.monthly_rent),
    monthly_furnished_rent:
      unit.monthly_furnished_rent == null
        ? ""
        : String(unit.monthly_furnished_rent),
    evidence: (unit.evidence || []).map((e) => ({
      source: e.source || "aqarmap",
      url: e.url || "",
      date: e.date || "",
      notes: e.notes || "",
    })),
  };
}

function optionalNumber(value) {
  if (value === "" || value == null) return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

export default function UnitFormDialog({
  isOpen,
  onClose,
  onSubmit,
  unit = null,
  submitLoading = false,
}) {
  const { translate } = useI18n();
  const isEdit = Boolean(unit?.id);
  const [form, setForm] = useState(emptyUnitForm);
  const [errors, setErrors] = useState({});
  const [evidenceErrors, setEvidenceErrors] = useState([]);

  useEffect(() => {
    if (!isOpen) return;
    setForm(unitToForm(unit));
    setErrors({});
    setEvidenceErrors([]);
  }, [isOpen, unit]);

  const patch = (partial) => setForm((prev) => ({ ...prev, ...partial }));

  const validate = () => {
    const next = {};
    if (!isEdit && !form.property_type) {
      next.property_type = translate("marketIndex.validation.required");
    }
    const area = Number(form.area_sqm);
    if (!(area > 0)) next.area_sqm = translate("marketIndex.validation.positiveNumber");

    const beds = Number(form.bedrooms);
    if (!Number.isInteger(beds) || beds < 0) {
      next.bedrooms = translate("marketIndex.validation.nonNegativeInt");
    }
    const baths = Number(form.bathrooms);
    if (!Number.isInteger(baths) || baths < 0) {
      next.bathrooms = translate("marketIndex.validation.nonNegativeInt");
    }

    const estimated = Number(form.estimated_avg_price);
    if (!(estimated > 0)) {
      next.estimated_avg_price = translate("marketIndex.validation.positiveNumber");
    }

    const low = Number(form.price_low);
    const high = Number(form.price_high);
    if (Number.isNaN(low) || low < 0) {
      next.price_low = translate("marketIndex.validation.nonNegativeNumber");
    }
    if (Number.isNaN(high) || high < 0) {
      next.price_high = translate("marketIndex.validation.nonNegativeNumber");
    }
    if (!Number.isNaN(low) && !Number.isNaN(high) && low > high) {
      next.price_low = translate("marketIndex.validation.lowHigh");
    }
    if (
      !Number.isNaN(low) &&
      !Number.isNaN(high) &&
      !Number.isNaN(estimated) &&
      (estimated < low || estimated > high)
    ) {
      next.estimated_avg_price = translate("marketIndex.validation.estimatedInRange");
    }

    for (const key of ["developer_price", "monthly_rent", "monthly_furnished_rent"]) {
      if (form[key] !== "" && form[key] != null && !(Number(form[key]) >= 0)) {
        next[key] = translate("marketIndex.validation.nonNegativeNumber");
      }
    }

    const evErrors = validateEvidenceList(form.evidence, translate);
    setErrors(next);
    setEvidenceErrors(evErrors);
    return Object.keys(next).length === 0 && evErrors.length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const body = {
      property_type: form.property_type,
      area_sqm: Number(form.area_sqm),
      bedrooms: Number(form.bedrooms),
      bathrooms: Number(form.bathrooms),
      estimated_avg_price: Number(form.estimated_avg_price),
      price_range: {
        low: Number(form.price_low),
        high: Number(form.price_high),
      },
      developer_price: optionalNumber(form.developer_price),
      monthly_rent: optionalNumber(form.monthly_rent),
      monthly_furnished_rent: optionalNumber(form.monthly_furnished_rent),
      evidence: serializeEvidence(form.evidence),
    };
    onSubmit?.(body);
  };

  return (
    <UnifiedDialog
      isOpen={isOpen}
      onClose={onClose}
      title={
        isEdit
          ? translate("marketIndex.unit.editTitle")
          : translate("marketIndex.unit.addTitle")
      }
      cancelLabel={translate("common.cancel")}
      submitLabel={translate("common.save")}
      submitLoading={submitLoading}
      onSubmit={handleSubmit}
      dialogClassName="max-w-3xl"
      bodyClassName="p-4 overflow-y-auto"
    >
      <div className="flex flex-col gap-4">
        {isEdit ? (
          <div className="rounded-md bg-gray-50 border border-gray-200 p-3 text-sm text-gray-700">
            <p className="font-medium mb-1">
              {form.property_type} · {form.area_sqm}{" "}
              {translate("marketIndex.unit.sqm")} · {form.bedrooms}
              {translate("marketIndex.unit.bedsShort")} / {form.bathrooms}
              {translate("marketIndex.unit.bathsShort")}
            </p>
            <p className="text-xs text-gray-500">
              {translate("marketIndex.unit.identityLocked")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <LenaFieldWrapper
              error={Boolean(errors.property_type)}
              errorMessage={errors.property_type}
            >
              <SearchableDropdownSelect
                name="property_type"
                label={translate("marketIndex.fields.propertyType")}
                options={PROPERTY_TYPES}
                value={form.property_type}
                onChange={(e) => patch({ property_type: e.target.value })}
                required
              />
            </LenaFieldWrapper>
            <LenaTextField
              label={translate("marketIndex.fields.areaSqm")}
              name="area_sqm"
              type="number"
              value={form.area_sqm}
              onChange={(e) => patch({ area_sqm: e.target.value })}
              error={Boolean(errors.area_sqm)}
              errorMessage={errors.area_sqm}
              required
            />
            <LenaTextField
              label={translate("marketIndex.fields.bedrooms")}
              name="bedrooms"
              type="number"
              min={0}
              step={1}
              value={form.bedrooms}
              onChange={(e) => patch({ bedrooms: e.target.value })}
              error={Boolean(errors.bedrooms)}
              errorMessage={errors.bedrooms}
              required
            />
            <LenaTextField
              label={translate("marketIndex.fields.bathrooms")}
              name="bathrooms"
              type="number"
              min={0}
              step={1}
              value={form.bathrooms}
              onChange={(e) => patch({ bathrooms: e.target.value })}
              error={Boolean(errors.bathrooms)}
              errorMessage={errors.bathrooms}
              required
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <LenaTextField
            label={translate("marketIndex.fields.estimatedAvgPrice")}
            name="estimated_avg_price"
            type="number"
            value={form.estimated_avg_price}
            onChange={(e) => patch({ estimated_avg_price: e.target.value })}
            error={Boolean(errors.estimated_avg_price)}
            errorMessage={errors.estimated_avg_price}
            required
          />
          <LenaTextField
            label={translate("marketIndex.fields.priceLow")}
            name="price_low"
            type="number"
            value={form.price_low}
            onChange={(e) => patch({ price_low: e.target.value })}
            error={Boolean(errors.price_low)}
            errorMessage={errors.price_low}
            required
          />
          <LenaTextField
            label={translate("marketIndex.fields.priceHigh")}
            name="price_high"
            type="number"
            value={form.price_high}
            onChange={(e) => patch({ price_high: e.target.value })}
            error={Boolean(errors.price_high)}
            errorMessage={errors.price_high}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <LenaTextField
            label={translate("marketIndex.fields.developerPrice")}
            name="developer_price"
            type="number"
            value={form.developer_price}
            onChange={(e) => patch({ developer_price: e.target.value })}
            error={Boolean(errors.developer_price)}
            errorMessage={errors.developer_price}
          />
          <LenaTextField
            label={translate("marketIndex.fields.monthlyRent")}
            name="monthly_rent"
            type="number"
            value={form.monthly_rent}
            onChange={(e) => patch({ monthly_rent: e.target.value })}
            error={Boolean(errors.monthly_rent)}
            errorMessage={errors.monthly_rent}
          />
          <LenaTextField
            label={translate("marketIndex.fields.monthlyFurnishedRent")}
            name="monthly_furnished_rent"
            type="number"
            value={form.monthly_furnished_rent}
            onChange={(e) => patch({ monthly_furnished_rent: e.target.value })}
            error={Boolean(errors.monthly_furnished_rent)}
            errorMessage={errors.monthly_furnished_rent}
          />
        </div>

        <EvidenceListEditor
          value={form.evidence}
          onChange={(evidence) => patch({ evidence })}
          canEdit
          errors={evidenceErrors}
        />
      </div>
    </UnifiedDialog>
  );
}
