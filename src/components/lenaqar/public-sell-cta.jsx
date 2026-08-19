"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useI18n } from "@/hooks/useI18n";
import { useGoogleAnalytics } from "@/hooks/useGoogleAnalytics";
import { ANALYTICS } from "@/constants/analytics";
import { getBuildingTypeOptions } from "@/lib/enums/buildingTypes";
import UnifiedDialog from "@/components/ui/UnifiedDialog";
import LenaTextField from "@/components/ui/inputs/lena-text-field";
import FormSelect from "@/components/ui/inputs/form-select";
import UnitsLocationSearch from "@/components/ui/inputs/units-location-search";
import { PhoneField } from "@/components/phone/PhoneField";
import { submitPublicSellUnit } from "@/app/(lenaqar)/_actions/add-sale";
import { actionButtonClass } from "@/components/ui/action-button-class";

const EMPTY_FORM = {
  ownerName: "",
  developer: "",
  buildingType: "",
  city: "",
  district: "",
  subDistrict: "",
  landArea: "",
  totalPrice: "",
  paidAmount: "",
};

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

  const handleLocationChange = ({ city, district, sub_district }) =>
    setForm((prev) => ({ ...prev, city, district, subDistrict: sub_district }));

  const resetAndClose = () => {
    setForm(EMPTY_FORM);
    setPhoneNumber("");
    setPhonePayload(null);
    setOpen(false);
  };

  const canSubmit =
    form.ownerName.trim() &&
    phonePayload?.combined &&
    form.developer.trim() &&
    form.buildingType &&
    Number(form.landArea) > 0 &&
    Number(form.totalPrice) > 0 &&
    Number(form.paidAmount) >= 0;

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

          <UnitsLocationSearch
            name="sell_unit_location"
            label={tr("lenaqar.sellRequest.location", locale === "ar" ? "الموقع" : "Location")}
            city={form.city}
            district={form.district}
            subDistrict={form.subDistrict}
            onChange={handleLocationChange}
            showAllOption={false}
          />

          <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <LenaTextField
              name="developer"
              label={tr("lenaqar.sellRequest.developer", locale === "ar" ? "المطور" : "Developer")}
              value={form.developer}
              onChange={setField("developer")}
              required
            />
            <FormSelect
              name="buildingType"
              label={tr("lenaqar.sellRequest.buildingType", locale === "ar" ? "نوع الوحدة" : "Property type")}
              value={form.buildingType}
              onChange={setField("buildingType")}
              required
            >
              <option value="" disabled>
                {tr("lenaqar.sellRequest.selectType", locale === "ar" ? "اختر النوع" : "Select type")}
              </option>
              {buildingTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </FormSelect>
          </section>

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
              type="number"
              label={tr("lenaqar.calculator.unitPrice")}
              value={form.totalPrice}
              onChange={setField("totalPrice")}
              required
            />
            <LenaTextField
              name="paidAmount"
              type="number"
              label={tr("lenaqar.calculator.amountPaid")}
              value={form.paidAmount}
              onChange={setField("paidAmount")}
              required
            />
          </section>
        </div>
      </UnifiedDialog>
    </>
  );
}
