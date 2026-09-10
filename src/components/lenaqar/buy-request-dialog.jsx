"use client";

import { BUILDING_TYPE_VALUES } from "@/data/constants";
import { getBuildingTypeOptions } from "@/lib/enums/buildingTypes";
import { useI18n } from "@/hooks/useI18n";
import LenaTextField from "@/components/ui/inputs/lena-text-field";
import LenaTextarea from "@/components/ui/inputs/lena-textarea";
import UnitsLocationSearch from "@/components/ui/inputs/units-location-search";
import SearchableDropdownSelect from "@/components/ui/inputs/searchable-dropdown-select";
import SearchableProjectSelect from "@/components/ui/inputs/searchable-project-select";
import UnifiedDialog from "@/components/ui/UnifiedDialog";
import { PhoneField } from "@/components/phone/PhoneField";
import SubmitWhatsAppFallback from "@/components/lenaqar/submit-whatsapp-fallback";
import NetworkBrokerCta from "@/components/lenaqar/network-broker-cta";
import {
  buildPublicBuyRequirement,
  inferBuyRequestPaymentMode,
  normalizeBuyRequestPaymentMode,
} from "@/lib/lenaqar/buy-request-payload";
import {
  getBuyRequestDeliveryOptions,
  normalizeBuyRequestDelivery,
} from "@/lib/lenaqar/buy-request-delivery";
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
]);

/** Numeric text fields that must keep ASCII digits in form state. */
function normalizeNumericField(name, value) {
  if (MONEY_FIELDS.has(name)) return parseMoneyInput(value);
  if (name === "roomsCount") {
    return String(normalizeToEnglishDigits(value ?? "")).replace(/\D/g, "");
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

function notesFromLoaded(raw) {
  if (typeof raw?.notes === "string" && raw.notes.trim()) {
    return raw.notes.trim();
  }
  const features = raw?.additionalFeatures ?? raw?.additional_features;
  if (Array.isArray(features)) {
    return features
      .map((item) => String(item || "").trim())
      .filter(Boolean)
      .join("\n");
  }
  if (typeof features === "string") return features.trim();
  return "";
}

function createEmptyForm(initialValues = {}) {
  const initial =
    initialValues && typeof initialValues === "object" ? initialValues : {};
  const paymentMode = inferBuyRequestPaymentMode(initial);
  return {
    paymentMode,
    city: pickSingleValue(initial.city),
    district: pickSingleValue(initial.district),
    sub_district: pickSingleValue(initial.sub_district),
    project: pickSingleValue(initial.project),
    buildingType: pickSingleValue(initial.buildingType),
    roomsCount: numberToFieldValue(initial.roomsCount),
    max_price: numberToFieldValue(initial.max_price ?? initial.totalPrice),
    downPayment: numberToFieldValue(initial.downPayment),
    monthlyInstallment: numberToFieldValue(initial.monthlyInstallment),
    deliveryDate:
      paymentMode === "cash"
        ? "ready"
        : normalizeBuyRequestDelivery(initial.deliveryDate),
    notes: notesFromLoaded(initial),
  };
}

function mapLoadedRequirement(raw) {
  const paymentMode = inferBuyRequestPaymentMode(raw);
  return {
    paymentMode,
    city: pickSingleValue(raw.city),
    district: pickSingleValue(raw.district),
    sub_district: pickSingleValue(raw.sub_district),
    project: pickSingleValue(raw.project),
    buildingType: normalizeEnumValue(raw.buildingType, BUILDING_TYPE_VALUES),
    roomsCount: numberToFieldValue(raw.roomsCount),
    max_price: numberToFieldValue(raw.max_price ?? raw.totalPrice),
    downPayment: numberToFieldValue(raw.downPayment),
    monthlyInstallment: numberToFieldValue(raw.monthlyInstallment),
    deliveryDate:
      paymentMode === "cash"
        ? "ready"
        : normalizeBuyRequestDelivery(raw.deliveryDate),
    notes: notesFromLoaded(raw),
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
  const [notBrokerConfirmed, setNotBrokerConfirmed] = useState(false);
  const [whatsappFallbackHrefState, setWhatsappFallbackHrefState] = useState("");

  const buildingTypeOptions = useMemo(
    () => getBuildingTypeOptions(tr),
    [locale, tr],
  );

  const deliveryOptions = useMemo(
    () => getBuyRequestDeliveryOptions(tr),
    [tr],
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
    setNotBrokerConfirmed(false);
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

  const handlePaymentModeChange = (nextMode) => {
    const mode = normalizeBuyRequestPaymentMode(nextMode);
    setForm((prev) => {
      if (prev.paymentMode === mode) return prev;
      if (mode === "cash") {
        return {
          ...prev,
          paymentMode: mode,
          downPayment: "",
          monthlyInstallment: "",
          deliveryDate: "ready",
        };
      }
      return {
        ...prev,
        paymentMode: mode,
        deliveryDate: "",
      };
    });
    setFieldErrors((prev) => {
      if (!prev || Object.keys(prev).length === 0) return prev;
      const next = { ...prev };
      delete next.max_price;
      delete next.downPayment;
      delete next.monthlyInstallment;
      delete next.deliveryDate;
      return next;
    });
  };

  const isCash = form.paymentMode !== "installment";

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (!userId && !showContactFields) return;

    if (!notBrokerConfirmed) {
      toast.error(
        tr(
          "lenaqar.buyRequest.notBrokerRequired",
          "You must confirm you are not a broker",
        ),
      );
      return;
    }

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
      const extra = {
        notBrokerConfirmed: true,
        ...(showContactFields
          ? {
              contact: {
                name: contactName.trim(),
                phone: phonePayload.combined,
              },
            }
          : {}),
      };
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
          notes: tr("lenaqar.buyRequest.notes"),
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
      submitDisabled={
        loading ||
        saving ||
        (!userId && !showContactFields) ||
        !notBrokerConfirmed
      }
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

          <div className="rounded-xl border border-primary/15 bg-primary/[0.04] p-3.5">
            <p className="font-semibold text-primary">
              {tr("lenaqar.buyRequest.notBrokerTitle")}
            </p>
            <p className="mt-1.5 text-sm text-black/70 leading-relaxed">
              {tr("lenaqar.buyRequest.notBrokerBody")}
            </p>
          </div>

          <NetworkBrokerCta compact onNavigate={onClose} />

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
              placeholder={tr("lenaqar.buyRequest.locationPlaceholder")}
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

            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-800">
                {tr("lenaqar.buyRequest.paymentModeLabel", "Payment method")}
              </p>
              <div
                role="radiogroup"
                aria-label={tr("lenaqar.buyRequest.paymentModeLabel")}
                className="grid grid-cols-2 gap-2"
              >
                {[
                  {
                    value: "cash",
                    label: tr("lenaqar.buyRequest.paymentModeCash", "Cash"),
                  },
                  {
                    value: "installment",
                    label: tr(
                      "lenaqar.buyRequest.paymentModeInstallment",
                      "Installment",
                    ),
                  },
                ].map((option) => {
                  const selected = form.paymentMode === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => handlePaymentModeChange(option.value)}
                      className={`min-h-[40px] rounded-md border px-3 text-sm font-medium transition-colors ${
                        selected
                          ? "border-primary bg-primary text-white"
                          : "border-gray-300 bg-white text-gray-800 hover:border-gray-400"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500">
                {isCash
                  ? tr("lenaqar.buyRequest.paymentModeCashHint")
                  : tr("lenaqar.buyRequest.paymentModeInstallmentHint")}
              </p>
            </div>

            {isCash ? (
              <>
                <LenaTextField
                  name="max_price"
                  type="money"
                  label={tr("lenaqar.buyRequest.maxPrice", "Max cash budget")}
                  value={form.max_price}
                  onChange={handleFieldChange}
                  placeholder={tr("lenaqar.buyRequest.maxPricePlaceholder")}
                  adornment={tr("lenaqar.unit.egp")}
                  required
                  error={Boolean(compactError("max_price"))}
                  errorMessage={compactError("max_price")}
                />
                <p className="text-xs text-gray-600 -mt-1">
                  {tr("lenaqar.buyRequest.cashDeliveryNote")}
                </p>
              </>
            ) : (
              <>
                <LenaTextField
                  name="downPayment"
                  type="money"
                  label={tr("lenaqar.buyRequest.downPayment", "Down payment")}
                  value={form.downPayment}
                  onChange={handleFieldChange}
                  placeholder={tr("lenaqar.buyRequest.downPaymentPlaceholder")}
                  adornment={tr("lenaqar.unit.egp")}
                  required
                  error={Boolean(compactError("downPayment"))}
                  errorMessage={compactError("downPayment")}
                />
                <LenaTextField
                  name="monthlyInstallment"
                  type="money"
                  label={tr(
                    "lenaqar.buyRequest.monthlyInstallment",
                    "Monthly installment",
                  )}
                  value={form.monthlyInstallment}
                  onChange={handleFieldChange}
                  placeholder={tr(
                    "lenaqar.buyRequest.monthlyInstallmentPlaceholder",
                  )}
                  adornment={tr("lenaqar.unit.egp")}
                  error={Boolean(compactError("monthlyInstallment"))}
                  errorMessage={compactError("monthlyInstallment")}
                />
                <SearchableDropdownSelect
                  name="deliveryDate"
                  label={tr("lenaqar.buyRequest.deliveryDate")}
                  value={form.deliveryDate}
                  onChange={handleFieldChange}
                  options={deliveryOptions}
                  placeholder={tr("lenaqar.buyRequest.selectDelivery")}
                  error={Boolean(compactError("deliveryDate"))}
                  errorMessage={compactError("deliveryDate")}
                  className={dropdownClassName}
                />
              </>
            )}

            <LenaTextarea
              name="notes"
              label={tr("lenaqar.buyRequest.notes", "Notes")}
              value={form.notes}
              onChange={handleFieldChange}
              rows={4}
              helperText={tr(
                "lenaqar.buyRequest.notesHint",
                "اكتب أي تفاصيل إضافية عن اللي بتدور عليه",
              )}
              error={Boolean(compactError("notes"))}
              errorMessage={compactError("notes")}
            />
          </section>

          <label className="flex items-start gap-3 cursor-pointer rounded-xl border border-black/10 bg-black/[0.02] p-3.5">
            <input
              type="checkbox"
              name="not_broker_confirm"
              checked={notBrokerConfirmed}
              onChange={(event) => setNotBrokerConfirmed(event.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-black/20 text-primary focus:ring-primary/30"
              required
            />
            <span className="text-sm text-black/80 leading-relaxed">
              {tr("lenaqar.buyRequest.notBrokerConfirm")}
            </span>
          </label>
        </>
      )}
    </UnifiedDialog>
  );
}
