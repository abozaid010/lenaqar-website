"use client";

import { BUILDING_TYPE_VALUES } from "@/data/constants";
import { getBuildingTypeOptions } from "@/lib/enums/buildingTypes";
import { useI18n } from "@/hooks/useI18n";
import LenaTextField from "@/components/ui/inputs/lena-text-field";
import MonthYearField from "@/components/ui/inputs/month-year-field";
import UnitsLocationSearch from "@/components/ui/inputs/units-location-search";
import SearchableDropdownSelect from "@/components/ui/inputs/searchable-dropdown-select";
import SearchableProjectSelect from "@/components/ui/inputs/searchable-project-select";
import UnifiedDialog from "@/components/ui/UnifiedDialog";
import { PhoneField } from "@/components/phone/PhoneField";
import SubmitWhatsAppFallback from "@/components/lenaqar/submit-whatsapp-fallback";
import {
  buildPublicBuyRequirement,
  toYearMonth,
} from "@/lib/lenaqar/buy-request-payload";
import {
  composeBuyRequestWhatsAppMessage,
  whatsappFallbackHref,
} from "@/lib/lenaqar/whatsapp-fallback";
import { parseMoneyInput, normalizeToEnglishDigits } from "@/utils/parse-amount";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

const MONEY_FIELDS = new Set([
  "max_price",
  "downPayment",
  "monthlyInstallment",
  "overPrice",
]);

/** YYYY-MM bounds for the native month picker (ready units → near-term delivery). */
function deliveryMonthBounds(now = new Date()) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return {
    min: `${year - 2}-${month}`,
    max: `${year + 15}-${month}`,
  };
}

/** Numeric text fields that must keep ASCII digits in form state. */
function normalizeNumericField(name, value) {
  if (MONEY_FIELDS.has(name)) return parseMoneyInput(value);
  if (name === "roomsCount") {
    return String(normalizeToEnglishDigits(value ?? "")).replace(/\D/g, "");
  }
  if (name === "deliveryDate") {
    // Native <input type="month"> yields "" or ASCII YYYY-MM.
    return value == null ? "" : String(value);
  }
  return value;
}

function numberToFieldValue(v) {
  if (v === null || v === undefined || v === "") return "";
  const n = Number(v);
  return Number.isFinite(n) ? String(n) : "";
}

function pickSingleValue(v) {
  if (Array.isArray(v)) {
    const filtered = v.filter(
      (item) => item !== null && item !== undefined && item !== "",
    );
    if (!filtered.length) return "";
    return String(filtered[filtered.length - 1]);
  }
  if (v == null || v === "") return "";
  return String(v);
}

function normalizeEnumValue(raw, allowedValues) {
  const picked = pickSingleValue(raw);
  if (!picked) return "";
  const needle = picked.trim().toLowerCase();
  return (
    allowedValues.find((v) => String(v).trim().toLowerCase() === needle) || ""
  );
}

function createEmptyForm(initialValues = {}) {
  const initial =
    initialValues && typeof initialValues === "object" ? initialValues : {};
  return {
    city: pickSingleValue(initial.city),
    district: pickSingleValue(initial.district),
    sub_district: pickSingleValue(initial.sub_district),
    project: pickSingleValue(initial.project),
    buildingType: pickSingleValue(initial.buildingType),
    roomsCount: numberToFieldValue(initial.roomsCount),
    max_price: numberToFieldValue(initial.max_price ?? initial.totalPrice),
    downPayment: numberToFieldValue(initial.downPayment),
    monthlyInstallment: numberToFieldValue(initial.monthlyInstallment),
    overPrice: numberToFieldValue(initial.overPrice),
    deliveryDate: toYearMonth(initial.deliveryDate),
  };
}

function mapLoadedRequirement(raw) {
  return {
    city: pickSingleValue(raw.city),
    district: pickSingleValue(raw.district),
    sub_district: pickSingleValue(raw.sub_district),
    project: pickSingleValue(raw.project),
    buildingType: normalizeEnumValue(raw.buildingType, BUILDING_TYPE_VALUES),
    roomsCount: numberToFieldValue(raw.roomsCount),
    max_price: numberToFieldValue(raw.max_price ?? raw.totalPrice),
    downPayment: numberToFieldValue(raw.downPayment),
    monthlyInstallment: numberToFieldValue(raw.monthlyInstallment),
    overPrice: numberToFieldValue(raw.overPrice),
    deliveryDate: toYearMonth(raw.deliveryDate),
  };
}

export default function BuyRequestDialog({
  open,
  onClose,
  userId,
  onSuccess,
  onUserId,
  title,
  submitLabel,
  intro,
  successMessage,
  clientId,
  initialValues,
  showContactFields = false,
  overlayClassName,
  loadRequirement,
  saveRequirement,
}) {
  const { locale, translate: tr } = useI18n();

  const { data: catalogProjects = [], isLoading: catalogProjectsLoading } = useQuery({
    queryKey: ["lenaqar", "catalog-projects"],
    queryFn: async () => {
      const response = await fetch("/api/lenaqar/catalog-projects");
      if (!response.ok) return [];
      const json = await response.json();
      const rows = json?.data ?? json;
      return Array.isArray(rows) ? rows : [];
    },
    enabled: open,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => createEmptyForm(initialValues));
  const [locationError, setLocationError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [contactName, setContactName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phonePayload, setPhonePayload] = useState(null);
  const [whatsappFallbackHrefState, setWhatsappFallbackHrefState] = useState("");

  const buildingTypeOptions = useMemo(
    () => getBuildingTypeOptions(tr),
    [locale, tr],
  );

  const { min: deliveryMin, max: deliveryMax } = useMemo(
    () => deliveryMonthBounds(),
    [],
  );

  const compactError = (key) =>
    fieldErrors[key]
      ? tr(
          `lenaqar.buyRequest.errors.${fieldErrors[key]}`,
          locale === "ar" ? "راجع البيانات المطلوبة" : "Check the required fields",
        )
      : "";

  useEffect(() => {
    if (open) return;
    setLocationError("");
    setWhatsappFallbackHrefState("");
    setFieldErrors((prev) =>
      prev && Object.keys(prev).length === 0 ? prev : {},
    );
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    if (!userId) {
      setForm(createEmptyForm(initialValues));
      setContactName("");
      setPhoneNumber("");
      setPhonePayload(null);
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const raw = await loadRequirement(userId);
        if (cancelled) return;
        if (raw?.error || !raw || typeof raw !== "object") {
          if (raw?.error) toast.error(String(raw.error));
          setForm(createEmptyForm(initialValues));
          return;
        }
        setForm(mapLoadedRequirement(raw));
      } catch (e) {
        if (!cancelled) {
          toast.error(
            e?.message ||
              tr("lenaqar.buyRequest.loadFailed", "Failed to load request"),
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, userId, loadRequirement, initialValues, tr]);

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    const nextValue = normalizeNumericField(name, value);
    setForm((prev) => ({ ...prev, [name]: nextValue }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleLocationChange = (location) => {
    setForm((prev) => ({
      ...prev,
      city: location?.city ?? "",
      district: location?.district ?? "",
      sub_district: location?.sub_district ?? "",
      project: location?.project ?? prev.project,
    }));
    setLocationError("");
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (!userId && !showContactFields) return;

    if (showContactFields) {
      if (!contactName.trim()) {
        toast.error(tr("lenaqar.buyRequest.nameRequired", "Name is required"));
        return;
      }
      if (!phonePayload?.combined) {
        toast.error(tr("lenaqar.buyRequest.phoneRequired", "Phone is required"));
        return;
      }
    }

    // Buy request: any selected location level is fine — city + district only.
    // No leaf/deepest-level check (sub-district stays optional).
    if (!String(form.city || "").trim() || !String(form.district || "").trim()) {
      const message = !String(form.city || "").trim()
        ? tr("lenaqar.buyRequest.errors.cityRequired")
        : tr("lenaqar.buyRequest.errors.districtRequired");
      setLocationError(message);
      toast.error(message);
      return;
    }
    setLocationError("");

    const built = buildPublicBuyRequirement(form);
    if (!built.ok) {
      setFieldErrors(built.errors);
      const first = Object.values(built.errors)[0];
      toast.error(
        tr(
          `lenaqar.buyRequest.errors.${first}`,
          locale === "ar" ? "راجع البيانات المطلوبة" : "Check the required fields",
        ),
      );
      return;
    }
    setFieldErrors({});

    setSaving(true);
    setWhatsappFallbackHrefState("");
    try {
      const extra = showContactFields
        ? {
            contact: {
              name: contactName.trim(),
              phone: phonePayload.combined,
            },
          }
        : undefined;
      const saveResult = await saveRequirement(userId, built.requirement, extra);
      const savedUserId = String(saveResult?.userId || userId || "").trim();
      if (savedUserId) onUserId?.(savedUserId);

      toast.success(
        successMessage ||
          tr("lenaqar.buyRequest.saved", "Request saved"),
      );
      onSuccess?.(built.requirement);
      onClose();
    } catch (err) {
      const buildingTypeLabel = form.buildingType
        ? tr(`buildingTypes.${form.buildingType}`, form.buildingType)
        : "";
      const message = composeBuyRequestWhatsAppMessage({
        form: { ...form, buildingType: buildingTypeLabel },
        contact: showContactFields
          ? {
              name: contactName.trim(),
              phone: phonePayload?.combined,
            }
          : {},
        intro: tr("lenaqar.buyRequest.whatsappFallbackIntro"),
        labels: {
          name: tr("lenaqar.buyRequest.name"),
          phone: tr("lenaqar.buyRequest.phone"),
          city: tr("lenaqar.buyRequest.city"),
          district: tr("lenaqar.buyRequest.district"),
          subDistrict: tr("lenaqar.buyRequest.subDistrict"),
          project: tr("lenaqar.buyRequest.project"),
          buildingType: tr("lenaqar.buyRequest.buildingType"),
          roomsCount: tr("lenaqar.buyRequest.roomsCount"),
          maxPrice: tr("lenaqar.buyRequest.maxPrice"),
          downPayment: tr("lenaqar.buyRequest.downPayment"),
          monthlyInstallment: tr("lenaqar.buyRequest.monthlyInstallment"),
          overPrice: tr("lenaqar.buyRequest.overPrice"),
          deliveryDate: tr("lenaqar.buyRequest.deliveryDate"),
        },
      });
      setWhatsappFallbackHrefState(whatsappFallbackHref(message));
    } finally {
      setSaving(false);
    }
  };

  const dropdownClassName = "w-full";

  return (
    <UnifiedDialog
      isOpen={open}
      onClose={onClose}
      title={title || tr("lenaqar.buyRequest.title", "Buy request")}
      cancelLabel={tr("common.cancel", locale === "ar" ? "إلغاء" : "Cancel")}
      onCancel={onClose}
      submitLabel={
        saving
          ? tr("common.saving", locale === "ar" ? "جارٍ الحفظ..." : "Saving...")
          : submitLabel || tr("lenaqar.buyRequest.submit", "Submit")
      }
      onSubmit={handleSubmit}
      submitDisabled={loading || saving || (!userId && !showContactFields)}
      submitLoading={saving}
      closeOnEscape
      overlayClassName={overlayClassName}
      dialogClassName="w-full sm:max-w-xl"
      bodyClassName="space-y-5 text-sm !p-4 pb-8"
    >
      {loading ? (
        <div className="p-6 text-center text-sm text-gray-500">
          {tr("common.loading", locale === "ar" ? "جارٍ التحميل..." : "Loading...")}
        </div>
      ) : (
        <>
          {intro ? <p className="text-sm text-gray-600 -mt-1">{intro}</p> : null}

          {whatsappFallbackHrefState ? (
            <SubmitWhatsAppFallback
              href={whatsappFallbackHrefState}
              title={tr("lenaqar.buyRequest.saveFailedTitle")}
              body={tr("lenaqar.buyRequest.saveFailedWhatsAppBody")}
              countdownLabel={tr("lenaqar.buyRequest.saveFailedWhatsAppCountdown")}
              ctaLabel={tr("lenaqar.buyRequest.saveFailedWhatsAppCta")}
            />
          ) : null}

          {showContactFields ? (
            <section className="space-y-3">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {tr("lenaqar.buyRequest.contactSection", "Contact")}
              </h4>
              <LenaTextField
                name="contact_name"
                label={tr("lenaqar.buyRequest.name", "Name")}
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                required
              />
              <PhoneField
                className="w-full"
                name="contact_phone"
                label={tr("lenaqar.buyRequest.phone", "Phone")}
                required
                defaultCountry="EG"
                value={phoneNumber}
                onChange={(next) => setPhoneNumber(next ?? "")}
                onValueChange={setPhonePayload}
              />
            </section>
          ) : null}

          <section className="space-y-3">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {tr("lenaqar.buyRequest.locationSection", "Location")}
            </h4>
            <UnitsLocationSearch
              name="requirement_location"
              label={tr("lenaqar.buyRequest.location", "Location")}
              city={form.city}
              district={form.district}
              subDistrict={form.sub_district}
              onChange={handleLocationChange}
              enabled={open}
              required
              error={Boolean(locationError)}
              errorMessage={locationError}
              showAllOption={false}
              placeholder={tr(
                "unitsFilter.locationSearchPlaceholder",
                locale === "ar"
                  ? "ابحث عن مدينة أو منطقة أو حي…"
                  : "Search city, district, or area…",
              )}
              className={dropdownClassName}
            />
            <SearchableProjectSelect
              name="project"
              label={tr("lenaqar.buyRequest.project", "Project")}
              value={form.project}
              onChange={handleFieldChange}
              projects={catalogProjects}
              city={form.city || ""}
              district={form.district || ""}
              isLoading={catalogProjectsLoading}
              placeholder={tr(
                "lenaqar.buyRequest.selectProject",
                "Optional — select project",
              )}
              className={dropdownClassName}
            />
          </section>

          <section className="space-y-3">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {tr("lenaqar.buyRequest.propertySection", "Property")}
            </h4>
            <SearchableDropdownSelect
              name="buildingType"
              label={tr("lenaqar.buyRequest.buildingType", "Property type")}
              value={form.buildingType}
              onChange={handleFieldChange}
              options={buildingTypeOptions}
              required
              error={Boolean(compactError("buildingType"))}
              errorMessage={compactError("buildingType")}
              placeholder={tr("lenaqar.buyRequest.selectType", "Select type")}
              className={dropdownClassName}
            />
            <LenaTextField
              name="roomsCount"
              label={tr("lenaqar.buyRequest.roomsCount", "Bedrooms")}
              value={form.roomsCount}
              onChange={handleFieldChange}
              inputMode="numeric"
              error={Boolean(compactError("roomsCount"))}
              errorMessage={compactError("roomsCount")}
            />
          </section>

          <section className="space-y-3">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {tr("lenaqar.buyRequest.budgetSection", "Budget")}
            </h4>
            <LenaTextField
              name="max_price"
              type="money"
              label={tr("lenaqar.buyRequest.maxPrice", "Max budget")}
              value={form.max_price}
              onChange={handleFieldChange}
              adornment={tr("lenaqar.unit.egp")}
              required
              error={Boolean(compactError("max_price"))}
              errorMessage={compactError("max_price")}
            />
            <LenaTextField
              name="downPayment"
              type="money"
              label={tr("lenaqar.buyRequest.downPayment", "Down payment")}
              value={form.downPayment}
              onChange={handleFieldChange}
              adornment={tr("lenaqar.unit.egp")}
              error={Boolean(compactError("downPayment"))}
              errorMessage={compactError("downPayment")}
            />
            <LenaTextField
              name="monthlyInstallment"
              type="money"
              label={tr("lenaqar.buyRequest.monthlyInstallment", "Monthly installment")}
              value={form.monthlyInstallment}
              onChange={handleFieldChange}
              adornment={tr("lenaqar.unit.egp")}
              error={Boolean(compactError("monthlyInstallment"))}
              errorMessage={compactError("monthlyInstallment")}
            />
            <LenaTextField
              name="overPrice"
              type="money"
              label={tr("lenaqar.buyRequest.overPrice", "Over price")}
              value={form.overPrice}
              onChange={handleFieldChange}
              adornment={tr("lenaqar.unit.egp")}
              error={Boolean(compactError("overPrice"))}
              errorMessage={compactError("overPrice")}
            />
            <MonthYearField
              name="deliveryDate"
              label={tr("lenaqar.buyRequest.deliveryDate")}
              value={form.deliveryDate}
              onChange={handleFieldChange}
              min={deliveryMin}
              max={deliveryMax}
              locale={locale}
              error={Boolean(compactError("deliveryDate"))}
              errorMessage={compactError("deliveryDate")}
            />
          </section>
        </>
      )}
    </UnifiedDialog>
  );
}
