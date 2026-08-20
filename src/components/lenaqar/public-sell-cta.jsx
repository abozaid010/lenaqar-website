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
import { parseAmount, parseMoneyInput, normalizeToEnglishDigits } from "@/utils/parse-amount";
import { PhoneField } from "@/components/phone/PhoneField";
import { submitPublicSellUnit } from "@/app/(lenaqar)/_actions/add-sale";
import { actionButtonClass } from "@/components/ui/action-button-class";
import ActionButtonArrow from "@/components/ui/action-button-arrow";
import SubmitWhatsAppFallback from "@/components/lenaqar/submit-whatsapp-fallback";
import {
  composeSellRequestWhatsAppMessage,
  whatsappFallbackHref,
} from "@/lib/lenaqar/whatsapp-fallback";

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
  const [ownerConfirmed, setOwnerConfirmed] = useState(false);
  const [whatsappFallbackHrefState, setWhatsappFallbackHrefState] = useState("");

  const tr = (key, fallback) => translate(key, fallback);

  const setField = (key) => (event) => {
    let value = event.target.value;
    if (key === "landArea") {
      value = String(normalizeToEnglishDigits(value ?? "")).replace(/[^\d.]/g, "");
    }
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const setMoneyField = (key) => (event) =>
    setForm((prev) => ({
      ...prev,
      [key]: parseMoneyInput(event.target.value),
    }));

  const canSubmit =
    ownerConfirmed &&
    form.ownerName.trim() &&
    phonePayload?.combined &&
    form.buildingType &&
    parseAmount(form.landArea) > 0 &&
    parseAmount(form.totalPrice) > 0 &&
    parseAmount(form.paidAmount) >= 0;
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
    setOwnerConfirmed(false);
    setWhatsappFallbackHrefState("");
    setOpen(false);
  };

  const handleSubmit = async () => {
    if (!canSubmit || saving) return;
    setSaving(true);
    setWhatsappFallbackHrefState("");
    try {
      const result = await submitPublicSellUnit({
        ...form,
        ownerPhone: phonePayload.combined,
      });
      if (!result?.ok) {
        const buildingTypeLabel = form.buildingType
          ? tr(`buildingTypes.${form.buildingType}`, form.buildingType)
          : form.buildingType;
        const message = composeSellRequestWhatsAppMessage({
          form: { ...form, buildingType: buildingTypeLabel },
          phone: phonePayload?.combined,
          intro: tr("lenaqar.sellRequest.whatsappFallbackIntro"),
          labels: {
            name: tr("lenaqar.buyRequest.name"),
            phone: tr("lenaqar.buyRequest.phone"),
            city: tr("lenaqar.sellRequest.city"),
            district: tr("lenaqar.sellRequest.district"),
            subDistrict: tr("lenaqar.sellRequest.subDistrict"),
            project: tr("lenaqar.buyRequest.project"),
            developer: tr("lenaqar.sellRequest.developer"),
            buildingType: tr("lenaqar.sellRequest.buildingType"),
            landArea: tr("lenaqar.sellRequest.landArea"),
            contractPrice: tr("lenaqar.sellRequest.contractPrice"),
            paidAmount: tr("lenaqar.sellRequest.paidAmount"),
          },
        });
        setWhatsappFallbackHrefState(whatsappFallbackHref(message));
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
        dialogClassName="w-full sm:max-w-xl"
        bodyClassName="space-y-5 text-sm !p-4 pb-8"
      >
        {whatsappFallbackHrefState ? (
          <SubmitWhatsAppFallback
            href={whatsappFallbackHrefState}
            title={tr("lenaqar.sellRequest.saveFailedTitle")}
            body={tr("lenaqar.sellRequest.saveFailedWhatsAppBody")}
            countdownLabel={tr("lenaqar.sellRequest.saveFailedWhatsAppCountdown")}
            ctaLabel={tr("lenaqar.sellRequest.saveFailedWhatsAppCta")}
          />
        ) : null}

        <div className="space-y-3 -mt-1">
          <h3 className="text-base font-bold text-primary leading-snug">
            {tr("lenaqar.sellRequest.headline")}
          </h3>
          <p className="text-sm text-black/70">{tr("lenaqar.sellRequest.introLead")}</p>
        </div>

        <div className="rounded-xl border border-primary/15 bg-primary/[0.04] p-4">
          <div className="flex gap-3">
            <span className="text-xl leading-none shrink-0" aria-hidden>
              👤
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-primary">
                {tr("lenaqar.sellRequest.ownersOnlyTitle")}
              </p>
              <p className="mt-1.5 text-sm text-black/70 leading-relaxed">
                {tr("lenaqar.sellRequest.ownersOnlyBody")}
              </p>
            </div>
          </div>
        </div>

        <p className="text-sm text-black/60">{tr("lenaqar.sellRequest.formIntro")}</p>

        <section className="space-y-3">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {tr("lenaqar.sellRequest.contactSection")}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
          </div>
        </section>

        <section className="space-y-3">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {tr("lenaqar.sellRequest.locationSection")}
          </h4>
          <UnitLocationSearch
            isPublic
            enabled={open}
            projectSource="catalog"
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
        </section>

        <section className="space-y-3">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {tr("lenaqar.sellRequest.propertySection")}
          </h4>
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
          <LenaTextField
            name="landArea"
            type="number"
            label={tr("lenaqar.sellRequest.landArea", locale === "ar" ? "المساحة (م²)" : "Area (sqm)")}
            value={form.landArea}
            onChange={setField("landArea")}
            required
          />
        </section>

        <section className="space-y-3">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {tr("lenaqar.sellRequest.pricingSection")}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
          </div>
          <p className="text-xs text-black/55 leading-relaxed">
            {tr("lenaqar.sellRequest.paidAmountHint")}
          </p>
        </section>

        <label className="flex items-start gap-3 cursor-pointer rounded-xl border border-black/10 bg-black/[0.02] p-3.5">
          <input
            type="checkbox"
            name="owner_confirm"
            checked={ownerConfirmed}
            onChange={(event) => setOwnerConfirmed(event.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-black/20 text-primary focus:ring-primary/30"
            required
          />
          <span className="text-sm text-black/80 leading-relaxed">
            {tr("lenaqar.sellRequest.ownerConfirm")}
          </span>
        </label>
      </UnifiedDialog>
    </>
  );
}
