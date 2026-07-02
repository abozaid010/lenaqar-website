"use client";

import {
  BUILDING_TYPE_VALUES,
  FINISHING_TYPE_VALUES,
  FURNISHING_TYPE_VALUES,
  PROPERTY_USAGE_VALUES,
  VIEW_TYPE_VALUES,
} from "@/data/constants";
import { useI18n } from "@/hooks/useI18n";
import { LenaCookiesManager } from "@/lib/LenaCookiesManager";
import {
  getClientRequirements,
  updateUserRequirements,
} from "@/utils/api";
import LenaTextField from "@/components/ui/inputs/lena-text-field";
import SearchableCitySelect from "@/components/ui/inputs/searchable-city-select";
import SearchableDistrictSelect from "@/components/ui/inputs/searchable-district-select";
import SearchableProjectSelect from "@/components/ui/inputs/searchable-project-select";
import SearchableDropdownSelect from "@/components/ui/inputs/searchable-dropdown-select";
import { useProjectsNames } from "@/hooks/use-admin-shared-data";

// The PUT /requirements/{requirement_id} endpoint is keyed by the
// requirement's own id (not the user id). The GET response may expose it
// under any of these keys depending on the backend layer.
function pickRequirementId(raw) {
  if (!raw || typeof raw !== "object") return null;
  return (
    raw.requirement_id ||
    raw.requirementId ||
    raw._id ||
    raw.id ||
    null
  );
}
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

function toNum(v) {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function parseListField(v) {
  if (Array.isArray(v)) return v.filter(Boolean).join(", ");
  if (v == null) return "";
  return String(v);
}

function splitList(s) {
  if (!s?.trim()) return [];
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function pickSingleValue(v) {
  if (Array.isArray(v)) {
    const filtered = v.filter((item) => item !== null && item !== undefined && item !== "");
    if (!filtered.length) return "";
    return String(filtered[filtered.length - 1]);
  }
  if (v == null || v === "") return "";
  return String(v);
}

function numberToFieldValue(v) {
  if (v === null || v === undefined || v === "") return "";
  const n = Number(v);
  return Number.isFinite(n) ? String(n) : "";
}

const PURPOSE_VALUES = ["rent", "buy", "sell"];

function detectRentPriceMode(raw) {
  const dailyMin = raw?.daily_min_price;
  const dailyMax = raw?.daily_max_price;
  if (
    (dailyMin != null && dailyMin !== "") ||
    (dailyMax != null && dailyMax !== "")
  ) {
    return "daily";
  }
  return "monthly";
}

function buildPriceFieldsForPayload(form) {
  const purpose = String(form.purpose || "").toLowerCase();
  const priceFields = {
    totalPrice: null,
    min_price: null,
    max_price: null,
    daily_min_price: null,
    daily_max_price: null,
    monthlyInstallment: null,
    downPayment: toNum(form.downPayment),
    serviceCharges: toNum(form.serviceCharges),
  };

  if (purpose === "rent") {
    if (form.rentPriceMode === "daily") {
      priceFields.daily_min_price = toNum(form.daily_min_price);
      priceFields.daily_max_price = toNum(form.daily_max_price);
    } else {
      priceFields.min_price = toNum(form.min_price);
      priceFields.max_price = toNum(form.max_price);
      const total = toNum(form.totalPrice);
      if (
        total != null &&
        priceFields.min_price == null &&
        priceFields.max_price == null
      ) {
        priceFields.totalPrice = total;
      }
      priceFields.monthlyInstallment = toNum(form.monthlyInstallment);
    }
    return priceFields;
  }

  if (purpose === "buy" || purpose === "sell") {
    priceFields.min_price = toNum(form.min_price);
    priceFields.max_price = toNum(form.max_price);
    const total = toNum(form.totalPrice);
    if (
      total != null &&
      priceFields.min_price == null &&
      priceFields.max_price == null
    ) {
      priceFields.totalPrice = total;
    }
    return priceFields;
  }

  priceFields.totalPrice = toNum(form.totalPrice);
  priceFields.min_price = toNum(form.min_price);
  priceFields.max_price = toNum(form.max_price);
  return priceFields;
}

export default function EditRequirementDialog({
  open,
  onClose,
  userId,
  onSuccess,
}) {
  const { locale, translate, t } = useI18n();
  const { data: projectsData, isLoading: projectsLoading } = useProjectsNames(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [requirementId, setRequirementId] = useState(null);
  const [form, setForm] = useState(() => ({
    client_id: "",
    user_id: "",
    country: "",
    city: "",
    district: "",
    project: "",
    developer: "",
    buildingType: "",
    viewType: "",
    finishingType: "",
    furnishingType: "",
    propertyUsage: "",
    purpose: "",
    rentPriceMode: "monthly",
    land_area: "",
    roomsCount: "",
    bathroomCount: "",
    floor: "",
    gardenSize: "",
    garageSize: "",
    deliveryDate: "",
    totalPrice: "",
    min_price: "",
    max_price: "",
    daily_min_price: "",
    daily_max_price: "",
    downPayment: "",
    monthlyInstallment: "",
    serviceCharges: "",
    dealBreakers: "",
    additionalFeatures: "",
  }));

  useEffect(() => {
    if (!open) {
      setRequirementId(null);
      return undefined;
    }
    if (!userId) return undefined;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const raw = await getClientRequirements(userId);
        if (cancelled || raw?.error) {
          if (raw?.error) toast.error(String(raw.error));
          return;
        }
        setRequirementId(pickRequirementId(raw));
        setForm({
          client_id: raw.client_id ?? "",
          user_id: userId,
          country: raw.country ?? "",
          city: raw.city ?? "",
          district: raw.district ?? "",
          project: raw.project ?? "",
          developer: raw.developer ?? "",
          buildingType: pickSingleValue(raw.buildingType),
          viewType: pickSingleValue(raw.viewType),
          finishingType: pickSingleValue(raw.finishingType),
          furnishingType: pickSingleValue(raw.furnishingType),
          propertyUsage: pickSingleValue(raw.propertyUsage),
          purpose: pickSingleValue(raw.purpose ?? raw.propertyPurpose),
          rentPriceMode: detectRentPriceMode(raw),
          land_area: numberToFieldValue(raw.land_area),
          roomsCount: numberToFieldValue(raw.roomsCount),
          bathroomCount: numberToFieldValue(raw.bathroomCount),
          floor: numberToFieldValue(raw.floor),
          gardenSize: numberToFieldValue(raw.gardenSize),
          garageSize: numberToFieldValue(raw.garageSize),
          deliveryDate: raw.deliveryDate ?? "",
          totalPrice: numberToFieldValue(raw.totalPrice),
          min_price: numberToFieldValue(raw.min_price),
          max_price: numberToFieldValue(raw.max_price),
          daily_min_price: numberToFieldValue(raw.daily_min_price),
          daily_max_price: numberToFieldValue(raw.daily_max_price),
          downPayment: numberToFieldValue(raw.downPayment),
          monthlyInstallment: numberToFieldValue(raw.monthlyInstallment),
          serviceCharges: numberToFieldValue(raw.serviceCharges),
          dealBreakers: parseListField(raw.dealBreakers),
          additionalFeatures: parseListField(raw.additionalFeatures),
        });
      } catch (e) {
        if (!cancelled) {
          toast.error(
            e?.message ||
              tr(
                "dashboard.requirementsDialog.messages.loadFailed",
                locale === "ar" ? "فشل تحميل المتطلبات" : "Failed to load requirements"
              )
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, userId]);

  const tr = (key, fallback) => translate(key, fallback);
  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    if (name === "district" && !form.city) {
      toast.error(
        locale === "ar"
          ? "الرجاء اختيار المدينة أولاً"
          : "Please select a city first",
      );
      return;
    }
    if (name === "city") {
      setForm((prev) => ({ ...prev, city: value, district: "" }));
      return;
    }
    if (name === "purpose") {
      setForm((prev) => ({
        ...prev,
        purpose: value,
        rentPriceMode: "monthly",
        totalPrice: "",
        min_price: "",
        max_price: "",
        daily_min_price: "",
        daily_max_price: "",
        monthlyInstallment: "",
      }));
      return;
    }
    set(name, value);
  };

  const handlePriceChange = (e) => {
    const { name, value } = e.target;
    const cleaned = String(value).replace(/[^0-9.]/g, "");
    set(name, cleaned);
  };

  const purposeKey = String(form.purpose || "").toLowerCase();
  const isRent = purposeKey === "rent";
  const isBuyOrSell = purposeKey === "buy" || purposeKey === "sell";

  const dropdownClassName =
    "[&>div>button]:bg-white [&>div>button]:border-gray-200 [&>div>button]:text-gray-900 [&>div>button]:text-sm [&>div>button]:min-h-[40px] [&>div>button]:w-full";
  const inputClassName =
    "w-full border border-gray-200 rounded-md px-2.5 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary";
  const sectionClassName = "rounded-lg border border-gray-100 p-3.5 space-y-3 bg-gray-50/40";
  const notSpecifiedLabel = tr(
    "dashboard.requirementsDialog.fields.notSpecified",
    locale === "ar" ? "غير محدد" : "Not specified",
  );

  const toDisplayLabel = (value) =>
    String(value)
      .replace(/[_-]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b\w/g, (c) => c.toUpperCase());

  const getOptionLabel = (groupKey, value) => {
    const stringValue = String(value);
    return tr(`property.${groupKey}.${stringValue}`, toDisplayLabel(stringValue));
  };

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) return;
    if (!requirementId) {
      toast.error(
        tr(
          "dashboard.requirementsDialog.messages.missingRequirementId",
          locale === "ar"
            ? "لا يمكن العثور على معرّف المتطلب لهذا العميل"
            : "Could not find a requirement id for this lead",
        ),
      );
      return;
    }
    setSaving(true);
    try {
      const clientId = form.client_id || LenaCookiesManager.getClientId() || "";
      const payload = {
        client_id: clientId,
        user_id: userId,
        country: form.country,
        city: form.city,
        district: form.district,
        project: form.project,
        developer: form.developer,
        buildingType: form.buildingType,
        viewType: form.viewType,
        finishingType: form.finishingType,
        furnishingType: form.furnishingType,
        propertyUsage: form.propertyUsage,
        purpose: form.purpose || null,
        land_area: toNum(form.land_area),
        roomsCount: toNum(form.roomsCount),
        bathroomCount: toNum(form.bathroomCount),
        floor: toNum(form.floor),
        gardenSize: toNum(form.gardenSize),
        garageSize: toNum(form.garageSize),
        deliveryDate: form.deliveryDate || "",
        ...buildPriceFieldsForPayload(form),
        dealBreakers: splitList(form.dealBreakers),
        additionalFeatures: splitList(form.additionalFeatures),
        score: {},
      };
      await updateUserRequirements(requirementId, payload);
      toast.success(
        tr(
          "common.requirementsSaved",
          locale === "ar" ? "تم حفظ المتطلبات بنجاح" : "Requirements saved",
        ),
      );
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(
        err?.message ||
          tr(
            "dashboard.requirementsDialog.messages.saveFailed",
            locale === "ar" ? "فشل الحفظ" : "Save failed",
          ),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-2">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
          <h3 className="text-sm font-semibold text-gray-900">
            {tr(
              "dashboard.requirementsDialog.title",
              locale === "ar" ? "تعديل المتطلبات" : "Edit Requirements"
            )}
          </h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-500">
            {tr(
              "dashboard.requirementsDialog.loading",
              locale === "ar" ? "جارٍ التحميل..." : "Loading..."
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 min-h-0 text-sm">
            <div className="px-4 py-4 space-y-4">
            <section className={sectionClassName}>
              <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                {tr(
                  "dashboard.requirementsDialog.sections.location",
                  locale === "ar" ? "الموقع" : "Location"
                )}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                <div>
                  <LenaTextField
                    name="country"
                    label={tr(
                      "dashboard.requirementsDialog.fields.country",
                      locale === "ar" ? "الدولة" : "Country",
                    )}
                    value={form.country}
                    onChange={handleFieldChange}
                  />
                </div>
                <div>
                  <SearchableCitySelect
                    name="city"
                    label={tr(
                      "dashboard.requirementsDialog.fields.city",
                      locale === "ar" ? "المدينة" : "City",
                    )}
                    value={form.city}
                    onChange={handleFieldChange}
                    placeholder={
                      t?.basicDetails?.selectCity ||
                      (locale === "ar" ? "اختر المدينة" : "Select City")
                    }
                    className={dropdownClassName}
                  />
                </div>
                <div>
                  <SearchableDistrictSelect
                    name="district"
                    label={tr(
                      "dashboard.requirementsDialog.fields.district",
                      locale === "ar" ? "المنطقة" : "District",
                    )}
                    value={form.district}
                    onChange={handleFieldChange}
                    disabled={!form.city}
                    city={form.city || ""}
                    placeholder={
                      !form.city
                        ? locale === "ar"
                          ? "الرجاء اختيار المدينة أولاً"
                          : "Please select a city first"
                        : locale === "ar"
                          ? "اختر المنطقة"
                          : "Select district"
                    }
                    className={dropdownClassName}
                  />
                </div>
                <div>
                  <SearchableProjectSelect
                    name="project"
                    label={tr(
                      "dashboard.requirementsDialog.fields.project",
                      locale === "ar" ? "المشروع" : "Project",
                    )}
                    value={form.project}
                    onChange={handleFieldChange}
                    projects={projectsData || []}
                    isLoading={projectsLoading}
                    placeholder={
                      t?.unitsFilter?.allCompounds ||
                      (locale === "ar" ? "اختر المشروع" : "Select project")
                    }
                    className={dropdownClassName}
                  />
                </div>
                <div>
                  <LenaTextField
                    name="developer"
                    label={tr(
                      "dashboard.requirementsDialog.fields.developer",
                      locale === "ar" ? "المطور" : "Developer",
                    )}
                    value={form.developer}
                    onChange={handleFieldChange}
                  />
                </div>
              </div>
            </section>

            <section className={sectionClassName}>
              <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                {tr(
                  "dashboard.requirementsDialog.sections.property",
                  locale === "ar" ? "مواصفات العقار" : "Property Specs"
                )}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              <div>
                <label className="text-xs font-medium text-gray-600">
                  {tr(
                    "dashboard.requirementsDialog.fields.buildingType",
                    locale === "ar" ? "نوع العقار" : "Building Type"
                  )}
                </label>
                <select
                  className={inputClassName}
                  value={form.buildingType}
                  onChange={(e) => set("buildingType", e.target.value)}
                >
                  <option value="">{notSpecifiedLabel}</option>
                  {BUILDING_TYPE_VALUES.map((v) => (
                    <option key={v} value={v}>
                      {getOptionLabel("buildingTypes", v)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">
                  {tr("dashboard.requirementsDialog.fields.view", locale === "ar" ? "الإطلالة" : "View")}
                </label>
                <select
                  className={inputClassName}
                  value={form.viewType}
                  onChange={(e) => set("viewType", e.target.value)}
                >
                  <option value="">{notSpecifiedLabel}</option>
                  {VIEW_TYPE_VALUES.map((v) => (
                    <option key={v} value={v}>
                      {getOptionLabel("view", v)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">
                  {tr(
                    "dashboard.requirementsDialog.fields.finishing",
                    locale === "ar" ? "التشطيب" : "Finishing"
                  )}
                </label>
                <select
                  className={inputClassName}
                  value={form.finishingType}
                  onChange={(e) => set("finishingType", e.target.value)}
                >
                  <option value="">{notSpecifiedLabel}</option>
                  {FINISHING_TYPE_VALUES.map((v) => (
                    <option key={v} value={v}>
                      {getOptionLabel("finishing", v)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">
                  {tr(
                    "dashboard.requirementsDialog.fields.furnishing",
                    locale === "ar" ? "الفرش" : "Furnishing"
                  )}
                </label>
                <select
                  className={inputClassName}
                  value={form.furnishingType}
                  onChange={(e) => set("furnishingType", e.target.value)}
                >
                  <option value="">{notSpecifiedLabel}</option>
                  {FURNISHING_TYPE_VALUES.map((v) => (
                    <option key={v} value={v}>
                      {tr(`property.furnishing.${v}`, toDisplayLabel(v))}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">
                  {tr(
                    "dashboard.requirementsDialog.fields.usage",
                    locale === "ar" ? "الاستخدام" : "Usage"
                  )}
                </label>
                <select
                  className={inputClassName}
                  value={form.propertyUsage}
                  onChange={(e) => set("propertyUsage", e.target.value)}
                >
                  <option value="">{notSpecifiedLabel}</option>
                  {PROPERTY_USAGE_VALUES.map((v) => (
                    <option key={v} value={v}>
                      {getOptionLabel("usage", v)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">
                  {tr(
                    "dashboard.requirementsDialog.fields.purpose",
                    locale === "ar" ? "الغرض" : "Purpose"
                  )}
                </label>
                <select
                  className={inputClassName}
                  value={form.purpose}
                  onChange={(e) => set("purpose", e.target.value)}
                >
                  <option value="">{notSpecifiedLabel}</option>
                  {PURPOSE_VALUES.map((v) => (
                    <option key={v} value={v}>
                      {tr(`propertyPurpose.${v}`, toDisplayLabel(v))}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            </section>

            <section className={sectionClassName}>
              <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                {tr(
                  "dashboard.requirementsDialog.sections.measurements",
                  locale === "ar" ? "المساحات والأحجام" : "Measurements"
                )}
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {[
                ["land_area", tr("dashboard.requirementsDialog.fields.land", locale === "ar" ? "المساحة" : "Land")],
                ["roomsCount", tr("dashboard.requirementsDialog.fields.rooms", locale === "ar" ? "الغرف" : "Rooms")],
                ["bathroomCount", tr("dashboard.requirementsDialog.fields.baths", locale === "ar" ? "الحمامات" : "Baths")],
                ["floor", tr("dashboard.requirementsDialog.fields.floor", locale === "ar" ? "الطابق" : "Floor")],
                ["gardenSize", tr("dashboard.requirementsDialog.fields.garden", locale === "ar" ? "الحديقة" : "Garden")],
                ["garageSize", tr("dashboard.requirementsDialog.fields.garage", locale === "ar" ? "الجراج" : "Garage")],
              ].map(([k, label]) => (
                <div key={k}>
                  <LenaTextField
                    name={k}
                    type="number"
                    label={label}
                    value={form[k]}
                    onChange={(e) => set(k, e.target.value)}
                  />
                </div>
              ))}
            </div>
            </section>

            <section className={sectionClassName}>
              <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                {tr(
                  "dashboard.requirementsDialog.sections.pricing",
                  locale === "ar" ? "الأسعار" : "Pricing"
                )}
              </h4>
              <div className="md:w-56">
                <LenaTextField
                  name="deliveryDate"
                  label={tr(
                    "dashboard.requirementsDialog.fields.deliveryDate",
                    locale === "ar" ? "تاريخ التسليم" : "Delivery Date"
                  )}
                  value={form.deliveryDate}
                  onChange={handleFieldChange}
                />
              </div>

              {!purposeKey && (
                <p className="text-xs text-gray-500">
                  {tr(
                    "dashboard.requirementsDialog.pricing.selectPurpose",
                    locale === "ar"
                      ? "اختر الغرض (إيجار / شراء / بيع) لعرض حقول الأسعار المناسبة"
                      : "Select purpose (rent / buy / sell) to show the right price fields",
                  )}
                </p>
              )}

              {isBuyOrSell && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-600">
                    {tr(
                      "dashboard.requirementsDialog.pricing.buySellHint",
                      locale === "ar" ? "ميزانية الشراء / البيع" : "Buy / sell budget",
                    )}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    <LenaTextField
                      name="min_price"
                      type="number"
                      label={tr(
                        "dashboard.requirementsDialog.fields.minBudget",
                        locale === "ar" ? "الحد الأدنى" : "Min budget",
                      )}
                      value={form.min_price}
                      onChange={handlePriceChange}
                    />
                    <LenaTextField
                      name="max_price"
                      type="number"
                      label={tr(
                        "dashboard.requirementsDialog.fields.maxBudget",
                        locale === "ar" ? "الحد الأقصى" : "Max budget",
                      )}
                      value={form.max_price}
                      onChange={handlePriceChange}
                    />
                    <LenaTextField
                      name="totalPrice"
                      type="number"
                      label={tr(
                        "dashboard.requirementsDialog.fields.singleBudget",
                        locale === "ar" ? "ميزانية محددة (بديل)" : "Single budget (alt.)",
                      )}
                      value={form.totalPrice}
                      onChange={handlePriceChange}
                    />
                    <LenaTextField
                      name="downPayment"
                      type="number"
                      label={tr(
                        "dashboard.requirementsDialog.fields.downPayment",
                        locale === "ar" ? "المقدم" : "Down Payment",
                      )}
                      value={form.downPayment}
                      onChange={handlePriceChange}
                    />
                    <LenaTextField
                      name="serviceCharges"
                      type="number"
                      label={tr(
                        "dashboard.requirementsDialog.fields.service",
                        locale === "ar" ? "الخدمات" : "Service charges",
                      )}
                      value={form.serviceCharges}
                      onChange={handlePriceChange}
                    />
                  </div>
                </div>
              )}

              {isRent && (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-3">
                    <label className="inline-flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                      <input
                        type="radio"
                        name="rentPriceMode"
                        checked={form.rentPriceMode === "monthly"}
                        onChange={() => set("rentPriceMode", "monthly")}
                        className="accent-primary"
                      />
                      {tr(
                        "dashboard.requirementsDialog.pricing.rentMonthly",
                        locale === "ar" ? "إيجار شهري" : "Monthly rent",
                      )}
                    </label>
                    <label className="inline-flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                      <input
                        type="radio"
                        name="rentPriceMode"
                        checked={form.rentPriceMode === "daily"}
                        onChange={() => set("rentPriceMode", "daily")}
                        className="accent-primary"
                      />
                      {tr(
                        "dashboard.requirementsDialog.pricing.rentDaily",
                        locale === "ar" ? "إيجار يومي" : "Daily rent",
                      )}
                    </label>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    {tr(
                      "dashboard.requirementsDialog.pricing.rentExclusiveHint",
                      locale === "ar"
                        ? "لا تستخدم الشهري واليومي معاً — يُرسل نوع واحد فقط"
                        : "Do not mix monthly and daily — only one type is sent",
                    )}
                  </p>

                  {form.rentPriceMode === "monthly" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      <LenaTextField
                        name="min_price"
                        type="number"
                        label={tr(
                          "dashboard.requirementsDialog.fields.minMonthlyRent",
                          locale === "ar" ? "أقل إيجار شهري" : "Min monthly rent",
                        )}
                        value={form.min_price}
                        onChange={handlePriceChange}
                      />
                      <LenaTextField
                        name="max_price"
                        type="number"
                        label={tr(
                          "dashboard.requirementsDialog.fields.maxMonthlyRent",
                          locale === "ar" ? "أقصى إيجار شهري" : "Max monthly rent",
                        )}
                        value={form.max_price}
                        onChange={handlePriceChange}
                      />
                      <LenaTextField
                        name="totalPrice"
                        type="number"
                        label={tr(
                          "dashboard.requirementsDialog.fields.singleMonthlyRent",
                          locale === "ar" ? "إيجار شهري (بديل)" : "Single monthly (alt.)",
                        )}
                        value={form.totalPrice}
                        onChange={handlePriceChange}
                      />
                      <LenaTextField
                        name="monthlyInstallment"
                        type="number"
                        label={tr(
                          "dashboard.requirementsDialog.fields.monthly",
                          locale === "ar" ? "قسط شهري" : "Monthly installment",
                        )}
                        value={form.monthlyInstallment}
                        onChange={handlePriceChange}
                      />
                      <LenaTextField
                        name="serviceCharges"
                        type="number"
                        label={tr(
                          "dashboard.requirementsDialog.fields.service",
                          locale === "ar" ? "الخدمات" : "Service charges",
                        )}
                        value={form.serviceCharges}
                        onChange={handlePriceChange}
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <LenaTextField
                        name="daily_min_price"
                        type="number"
                        label={tr(
                          "dashboard.requirementsDialog.fields.minDailyRent",
                          locale === "ar" ? "أقل إيجار يومي" : "Min daily rent",
                        )}
                        value={form.daily_min_price}
                        onChange={handlePriceChange}
                      />
                      <LenaTextField
                        name="daily_max_price"
                        type="number"
                        label={tr(
                          "dashboard.requirementsDialog.fields.maxDailyRent",
                          locale === "ar" ? "أقصى إيجار يومي" : "Max daily rent",
                        )}
                        value={form.daily_max_price}
                        onChange={handlePriceChange}
                      />
                    </div>
                  )}
                </div>
              )}
            </section>

            <section className={sectionClassName}>
              <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                {tr(
                  "dashboard.requirementsDialog.sections.notes",
                  locale === "ar" ? "ملاحظات إضافية" : "Additional Notes"
                )}
              </h4>
            <div>
              <label className="text-xs font-medium text-gray-600">
                {tr(
                  "dashboard.requirementsDialog.fields.dealBreakers",
                  locale === "ar"
                    ? "العوامل الحاسمة (مفصولة بفاصلة)"
                    : "Deal Breakers (comma-separated)"
                )}
              </label>
              <textarea
                className={`${inputClassName} min-h-[72px]`}
                value={form.dealBreakers}
                onChange={(e) => set("dealBreakers", e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">
                {tr(
                  "dashboard.requirementsDialog.fields.additionalFeatures",
                  locale === "ar"
                    ? "مميزات إضافية (مفصولة بفاصلة)"
                    : "Additional Features (comma-separated)"
                )}
              </label>
              <textarea
                className={`${inputClassName} min-h-[72px]`}
                value={form.additionalFeatures}
                onChange={(e) => set("additionalFeatures", e.target.value)}
              />
            </div>
            </section>
            </div>
            <div className="flex gap-2 justify-end px-4 py-3 border-t sticky bottom-0 bg-white/95 backdrop-blur-sm">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 border border-gray-200 rounded-md text-sm"
              >
                {tr("buttons.cancel", locale === "ar" ? "إلغاء" : "Cancel")}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-1.5 bg-primary text-white rounded-md text-sm font-medium disabled:opacity-60"
              >
                {saving
                  ? tr("common.saving", locale === "ar" ? "جارٍ الحفظ..." : "Saving...")
                  : tr("common.save", locale === "ar" ? "حفظ" : "Save")}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
