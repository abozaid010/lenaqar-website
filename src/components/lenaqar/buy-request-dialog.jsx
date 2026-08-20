"use client";

import { BUILDING_TYPE_VALUES } from "@/data/constants";
import { useI18n } from "@/hooks/useI18n";
import { validateLocationLeaf } from "@/lib/locations/validate-location-leaf";
import { tValidation } from "@/constants/unit-form-validation-keys";
import CityManager from "@/utils/city_manager";
import LenaTextField from "@/components/ui/inputs/lena-text-field";
import UnitsLocationSearch from "@/components/ui/inputs/units-location-search";
import SearchableDropdownSelect from "@/components/ui/inputs/searchable-dropdown-select";
import SearchableProjectSelect from "@/components/ui/inputs/searchable-project-select";
import UnifiedDialog from "@/components/ui/UnifiedDialog";
import { PhoneField } from "@/components/phone/PhoneField";
import {
  buildPublicBuyRequirement,
  toYearMonth,
} from "@/lib/lenaqar/buy-request-payload";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

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

  const buildingTypeOptions = useMemo(
    () =>
      BUILDING_TYPE_VALUES.map((value) => ({
        value,
        label: tr(`buildingTypes.${value}`, value),
      })),
    [locale, tr],
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
    setForm((prev) => ({ ...prev, [name]: value }));
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

    const locationResult = await validateLocationLeaf(
      {
        city: form.city,
        district: form.district,
        sub_district: form.sub_district,
        project: form.project,
      },
      CityManager.getInstance(),
    );
    if (!locationResult.ok) {
      const message = tValidation(tr, locationResult.key);
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
      toast.error(
        err?.message ||
          tr("lenaqar.buyRequest.saveFailed", "Save failed"),
      );
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
              required
              error={Boolean(locationError)}
              errorMessage={locationError}
              showAllOption={false}
              placeholder={tr(
                "basicDetails.locationSearchPlaceholder",
                "Search city, district, or area…",
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
              label={tr("lenaqar.buyRequest.maxPrice", "Max budget")}
              value={form.max_price}
              onChange={handleFieldChange}
              required
              error={Boolean(compactError("max_price"))}
              errorMessage={compactError("max_price")}
            />
            <LenaTextField
              name="downPayment"
              label={tr("lenaqar.buyRequest.downPayment", "Down payment")}
              value={form.downPayment}
              onChange={handleFieldChange}
              error={Boolean(compactError("downPayment"))}
              errorMessage={compactError("downPayment")}
            />
            <LenaTextField
              name="monthlyInstallment"
              label={tr("lenaqar.buyRequest.monthlyInstallment", "Monthly installment")}
              value={form.monthlyInstallment}
              onChange={handleFieldChange}
              error={Boolean(compactError("monthlyInstallment"))}
              errorMessage={compactError("monthlyInstallment")}
            />
            <LenaTextField
              name="overPrice"
              label={tr("lenaqar.buyRequest.overPrice", "Over price")}
              value={form.overPrice}
              onChange={handleFieldChange}
              error={Boolean(compactError("overPrice"))}
              errorMessage={compactError("overPrice")}
            />
            <LenaTextField
              name="deliveryDate"
              label={tr("lenaqar.buyRequest.deliveryDate", "Delivery (YYYY-MM)")}
              value={form.deliveryDate}
              onChange={handleFieldChange}
              placeholder="2026-12"
              error={Boolean(compactError("deliveryDate"))}
              errorMessage={compactError("deliveryDate")}
            />
          </section>
        </>
      )}
    </UnifiedDialog>
  );
}
