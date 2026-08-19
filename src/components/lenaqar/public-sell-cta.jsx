"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useI18n } from "@/hooks/useI18n";
import { useGoogleAnalytics } from "@/hooks/useGoogleAnalytics";
import { ANALYTICS } from "@/constants/analytics";
import { getBuildingTypeOptions } from "@/lib/enums/buildingTypes";
import UnifiedDialog from "@/components/ui/UnifiedDialog";
import LenaTextField from "@/components/ui/inputs/lena-text-field";
import SearchableDropdownSelect from "@/components/ui/inputs/searchable-dropdown-select";
import UnitLocationSearch from "@/components/ui/unit-forms/unit-location-search";
import { parseAmount, parseMoneyInput } from "@/utils/parse-amount";
import { PhoneField } from "@/components/phone/PhoneField";
import { submitPublicSellUnit } from "@/app/(lenaqar)/_actions/add-sale";
import { actionButtonClass } from "@/components/ui/action-button-class";
import ActionButtonArrow from "@/components/ui/action-button-arrow";

const EMPTY_FORM = {
  ownerName: "",
  project: "",
  developer: "",
  buildingType: "",
  city: "",
  district: "",
  subDistrict: "",
  landArea: "",
  totalPrice: "",
  paidAmount: "",
};

function developerFromProject(project) {
  const nested =
    project?.project && typeof project.project === "object" ? project.project : {};
  return String(
    project?.developer ||
      project?.developer_name ||
      nested.developer ||
      nested.developer_name ||
      "",
  ).trim();
}

export default function PublicSellCta({
  variant = "primary",
  tone = "default",
  size = "default",
  className = "",
  label,
}) {
  const { locale, translate } = useI18n();
  const { trackEvent } = useGoogleAnalytics();
  const buildingTypeOptions = getBuildingTypeOptions(translate);

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phonePayload, setPhonePayload] = useState(null);

  const tr = (key, fallback) => translate(key, fallback);

  const setField = (key) => (event) =>
    setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const setMoneyField = (key) => (event) =>
    setForm((prev) => ({
      ...prev,
      [key]: parseMoneyInput(event.target.value),
    }));

  const handleLocationChange = ({ city, district, sub_district, project }) =>
    setForm((prev) => ({
      ...prev,
      city: city || "",
      district: district || "",
      subDistrict: sub_district || "",
      project: project || "",
      developer: "",
    }));

  const handleProjectSelect = (project) => {
    const details =
      project?.project && typeof project.project === "object"
        ? project.project
        : project;
    setForm((prev) => ({
      ...prev,
      project: details?.en_name || details?.name || prev.project,
      developer: developerFromProject(project) || prev.developer,
      city: details?.city || prev.city,
      district: details?.district || prev.district,
      subDistrict: details?.sub_district || details?.subDistrict || prev.subDistrict,
    }));
  };

  const resetAndClose = () => {
    setForm(EMPTY_FORM);
    setPhoneNumber("");
    setPhonePayload(null);
    setOpen(false);
  };

  const canSubmit =
    form.ownerName.trim() &&
    phonePayload?.combined &&
    form.buildingType &&
    Number(form.landArea) > 0 &&
    parseAmount(form.totalPrice) > 0 &&
    parseAmount(form.paidAmount) >= 0;

  const handleSubmit = async () => {
    if (!canSubmit || saving) return;
    setSaving(true);
    try {
      const result = await submitPublicSellUnit({
        ...form,
        ownerPhone: phonePayload.combined,
      });
      if (!result?.ok) {
        toast.error(
          tr(
            `lenaqar.sellRequest.errors.${result?.code || "save_failed"}`,
            tr("lenaqar.sellRequest.saveFailed"),
          ),
        );
        return;
      }
      trackEvent(ANALYTICS.EVENTS.SELLER_WHATSAPP_CLICKED);
      toast.success(tr("lenaqar.sellRequest.saved"));
      resetAndClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className={actionButtonClass({ variant, tone, size, className })}
        onClick={() => setOpen(true)}
      >
        {label || translate("lenaqar.actions.sellUnit", "Sell Unit")}
        <ActionButtonArrow size={size} />
      </button>
      <UnifiedDialog
        isOpen={open}
        onClose={resetAndClose}
        onCancel={resetAndClose}
        title={tr("lenaqar.sellRequest.title")}
        cancelLabel={tr("common.cancel", locale === "ar" ? "إلغاء" : "Cancel")}
        submitLabel={tr("lenaqar.sellRequest.submit")}
        submitDisabled={!canSubmit}
        submitLoading={saving}
        onSubmit={handleSubmit}
        overlayClassName="!z-[70]"
      >
        <p className="text-sm text-black/60 mb-4">{tr("lenaqar.sellRequest.intro")}</p>
        <div className="space-y-4">
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <LenaTextField
              name="owner_name"
              label={tr("lenaqar.buyRequest.name", locale === "ar" ? "الاسم" : "Name")}
              value={form.ownerName}
              onChange={setField("ownerName")}
              required
            />
            <PhoneField
              name="owner_phone"
              label={tr("lenaqar.buyRequest.phone", locale === "ar" ? "موبايل" : "Phone")}
              required
              defaultCountry="EG"
              value={phoneNumber}
              onChange={(next) => setPhoneNumber(next ?? "")}
              onValueChange={setPhonePayload}
            />
          </section>

          <UnitLocationSearch
            isPublic
            projectSource="catalog"
            hydrateSelectedProject
            showHint
            showHierarchySummary
            name="sell_unit_location"
            label={tr(
              "basicDetails.locationSearchLabel",
              locale === "ar" ? "الموقع / المشروع" : "Location / Project",
            )}
            placeholder={tr(
              "basicDetails.locationSearchPlaceholder",
              locale === "ar"
                ? "ابحث عن مشروع أو منطقة أو حي أو مدينة…"
                : "Search project, area, district, or city…",
            )}
            formData={{
              city: form.city,
              district: form.district,
              sub_district: form.subDistrict,
              project: form.project,
            }}
            onSelectLocation={handleLocationChange}
            onSelectProject={handleProjectSelect}
          />

          <SearchableDropdownSelect
            name="buildingType"
            label={tr(
              "lenaqar.sellRequest.buildingType",
              locale === "ar" ? "نوع الوحدة" : "Property type",
            )}
            value={form.buildingType}
            onChange={setField("buildingType")}
            required
            options={buildingTypeOptions}
            getValue={(opt) => opt.value}
            getLabel={(opt) => opt.label}
            placeholder={tr(
              "lenaqar.sellRequest.selectType",
              locale === "ar" ? "اختر النوع" : "Select type",
            )}
            searchPlaceholder={tr(
              "lenaqar.sellRequest.selectType",
              locale === "ar" ? "ابحث عن النوع…" : "Search type…",
            )}
          />

          <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <LenaTextField
              name="landArea"
              type="number"
              label={tr("lenaqar.sellRequest.landArea", locale === "ar" ? "المساحة (م²)" : "Area (sqm)")}
              value={form.landArea}
              onChange={setField("landArea")}
              required
            />
            <LenaTextField
              name="totalPrice"
              type="money"
              label={tr("lenaqar.sellRequest.contractPrice")}
              value={form.totalPrice}
              onChange={setMoneyField("totalPrice")}
              adornment="EGP"
              required
            />
            <LenaTextField
              name="paidAmount"
              type="money"
              label={tr("lenaqar.calculator.amountPaid")}
              value={form.paidAmount}
              onChange={setMoneyField("paidAmount")}
              adornment="EGP"
              required
            />
          </section>
        </div>
      </UnifiedDialog>
    </>
  );
}
