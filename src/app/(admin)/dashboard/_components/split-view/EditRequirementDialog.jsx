"use client";

import {
  BUILDING_TYPE_VALUES,
  FINISHING_TYPE_VALUES,
  FURNISHING_TYPE_VALUES,
} from "@/data/constants";
import { useI18n } from "@/hooks/useI18n";
import { LenaCookiesManager } from "@/lib/LenaCookiesManager";
import {
  getClientRequirements,
  updateUserRequirements,
} from "@/utils/api";
import LenaTextField from "@/components/ui/inputs/lena-text-field";
import UnitsLocationSearch from "@/components/ui/inputs/units-location-search";
import SearchableProjectSelect from "@/components/ui/inputs/searchable-project-select";
import { useProjectsNames } from "@/hooks/use-admin-shared-data";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

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

function toNum(v) {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
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

function numberToFieldValue(v) {
  if (v === null || v === undefined || v === "") return "";
  const n = Number(v);
  return Number.isFinite(n) ? String(n) : "";
}

const PURPOSE_VALUES = ["rent", "buy", "sell"];

function buildPriceFieldsForPayload(form) {
  const purpose = String(form.purpose || "").toLowerCase();
  const priceFields = {
    totalPrice: null,
    min_price: null,
    max_price: null,
    monthlyInstallment: null,
    downPayment: toNum(form.downPayment),
    serviceCharges: null,
  };

  if (purpose === "rent" || purpose === "buy" || purpose === "sell") {
    priceFields.min_price = toNum(form.min_price);
    priceFields.max_price = toNum(form.max_price);
    return priceFields;
  }

  priceFields.min_price = toNum(form.min_price);
  priceFields.max_price = toNum(form.max_price);
  return priceFields;
}

function createEmptyForm(userId = "") {
  return {
    client_id: "",
    user_id: userId,
    city: "",
    district: "",
    sub_district: "",
    project: "",
    buildingType: "",
    finishingType: "",
    furnishingType: "",
    purpose: "",
    land_area: "",
    roomsCount: "",
    bathroomCount: "",
    min_price: "",
    max_price: "",
    downPayment: "",
  };
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
  const [form, setForm] = useState(() => createEmptyForm());

  const tr = (key, fallback) => translate(key, fallback);

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
          ...createEmptyForm(userId),
          client_id: raw.client_id ?? "",
          city: pickSingleValue(raw.city),
          district: pickSingleValue(raw.district),
          sub_district: pickSingleValue(raw.sub_district),
          project: pickSingleValue(raw.project),
          buildingType: pickSingleValue(raw.buildingType),
          finishingType: pickSingleValue(raw.finishingType),
          furnishingType: pickSingleValue(raw.furnishingType),
          purpose: pickSingleValue(raw.purpose ?? raw.propertyPurpose),
          land_area: numberToFieldValue(raw.land_area),
          roomsCount: numberToFieldValue(raw.roomsCount),
          bathroomCount: numberToFieldValue(raw.bathroomCount),
          min_price: numberToFieldValue(raw.min_price),
          max_price: numberToFieldValue(raw.max_price),
          downPayment: numberToFieldValue(raw.downPayment),
        });
      } catch (e) {
        if (!cancelled) {
          toast.error(
            e?.message ||
              tr(
                "dashboard.requirementsDialog.messages.loadFailed",
                locale === "ar"
                  ? "فشل تحميل المتطلبات"
                  : "Failed to load requirements",
              ),
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

  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    if (name === "purpose") {
      setForm((prev) => ({
        ...prev,
        purpose: value,
        min_price: "",
        max_price: "",
      }));
      return;
    }
    set(name, value);
  };

  const handleLocationChange = (payload) => {
    setForm((prev) => {
      const nextCity = payload?.city
        ? String(payload.city).toLowerCase().trim()
        : "";
      const nextDistrict = payload?.district
        ? String(payload.district).toLowerCase().trim()
        : "";
      const nextSubDistrict = payload?.sub_district
        ? String(payload.sub_district).toLowerCase().trim()
        : "";
      const cityChanged = nextCity !== (prev.city || "");
      const districtChanged = nextDistrict !== (prev.district || "");

      return {
        ...prev,
        city: nextCity,
        district: nextDistrict,
        sub_district: nextSubDistrict,
        project: cityChanged || districtChanged ? "" : prev.project || "",
      };
    });
  };

  const handlePriceChange = (e) => {
    const { name, value } = e.target;
    set(name, String(value).replace(/[^0-9.]/g, ""));
  };

  const purposeKey = String(form.purpose || "").toLowerCase();
  const isRent = purposeKey === "rent";
  const isBuyOrSell = purposeKey === "buy" || purposeKey === "sell";

  const dropdownClassName =
    "[&>div>button]:bg-white [&>div>button]:border-gray-200 [&>div>button]:text-gray-900 [&>div>button]:text-sm [&>div>button]:min-h-11 [&>div>button]:w-full";
  const inputClassName =
    "w-full min-h-11 border border-gray-200 rounded-md px-3 py-2.5 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white";
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
    return tr(
      `property.${groupKey}.${stringValue}`,
      toDisplayLabel(stringValue),
    );
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
        city: form.city,
        district: form.district,
        sub_district: form.sub_district,
        project: form.project,
        buildingType: form.buildingType,
        finishingType: form.finishingType,
        furnishingType: form.furnishingType,
        purpose: form.purpose || null,
        land_area: toNum(form.land_area),
        roomsCount: toNum(form.roomsCount),
        bathroomCount: toNum(form.bathroomCount),
        ...buildPriceFieldsForPayload(form),
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
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40 sm:p-3">
      <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-xl w-full sm:max-w-xl max-h-[min(94dvh,100%)] flex flex-col">
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b shrink-0">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-gray-900 truncate">
              {tr(
                "dashboard.requirementsDialog.title",
                locale === "ar" ? "تعديل المتطلبات" : "Edit Requirements",
              )}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 flex items-center justify-center min-h-10 min-w-10 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100"
            aria-label={tr("buttons.cancel", locale === "ar" ? "إلغاء" : "Cancel")}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-gray-500">
            {tr(
              "dashboard.requirementsDialog.loading",
              locale === "ar" ? "جارٍ التحميل..." : "Loading...",
            )}
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col flex-1 min-h-0 text-sm"
          >
            <div className="overflow-y-auto overscroll-contain flex-1 min-h-0 px-4 py-4 space-y-5">
              {/* Location */}
              <section className="space-y-3">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {tr(
                    "dashboard.requirementsDialog.sections.location",
                    locale === "ar" ? "الموقع" : "Location",
                  )}
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  <UnitsLocationSearch
                    name="requirement_location"
                    label={tr(
                      "dashboard.requirementsDialog.fields.location",
                      locale === "ar" ? "الموقع" : "Location",
                    )}
                    city={form.city}
                    district={form.district}
                    subDistrict={form.sub_district}
                    onChange={handleLocationChange}
                    allOptionLabel={notSpecifiedLabel}
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
                    label={tr(
                      "dashboard.requirementsDialog.fields.project",
                      locale === "ar" ? "المشروع" : "Project",
                    )}
                    value={form.project}
                    onChange={handleFieldChange}
                    projects={projectsData || []}
                    city={form.city || ""}
                    district={form.district || ""}
                    isLoading={projectsLoading}
                    placeholder={
                      t?.unitsFilter?.allCompounds ||
                      (locale === "ar" ? "اختر المشروع" : "Select project")
                    }
                    className={dropdownClassName}
                  />
                </div>
              </section>

              {/* Property */}
              <section className="space-y-3">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {tr(
                    "dashboard.requirementsDialog.sections.property",
                    locale === "ar" ? "العقار" : "Property",
                  )}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600">
                      {tr(
                        "dashboard.requirementsDialog.fields.purpose",
                        locale === "ar" ? "الغرض" : "Purpose",
                      )}
                    </label>
                    <select
                      className={inputClassName}
                      value={form.purpose}
                      onChange={(e) =>
                        handleFieldChange({
                          target: { name: "purpose", value: e.target.value },
                        })
                      }
                    >
                      <option value="">{notSpecifiedLabel}</option>
                      {PURPOSE_VALUES.map((v) => (
                        <option key={v} value={v}>
                          {tr(`propertyPurpose.${v}`, toDisplayLabel(v))}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">
                      {tr(
                        "dashboard.requirementsDialog.fields.buildingType",
                        locale === "ar" ? "نوع العقار" : "Building Type",
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
                      {tr(
                        "dashboard.requirementsDialog.fields.finishing",
                        locale === "ar" ? "التشطيب" : "Finishing",
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
                        locale === "ar" ? "الفرش" : "Furnishing",
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
                          {tr(
                            `property.furnishing.${v}`,
                            toDisplayLabel(v),
                          )}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </section>

              {/* Size */}
              <section className="space-y-3">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {tr(
                    "dashboard.requirementsDialog.sections.measurements",
                    locale === "ar" ? "المساحة والغرف" : "Size",
                  )}
                </h4>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <LenaTextField
                    name="roomsCount"
                    type="number"
                    label={tr(
                      "dashboard.requirementsDialog.fields.rooms",
                      locale === "ar" ? "الغرف" : "Rooms",
                    )}
                    value={form.roomsCount}
                    onChange={(e) => set("roomsCount", e.target.value)}
                  />
                  <LenaTextField
                    name="bathroomCount"
                    type="number"
                    label={tr(
                      "dashboard.requirementsDialog.fields.baths",
                      locale === "ar" ? "الحمامات" : "Baths",
                    )}
                    value={form.bathroomCount}
                    onChange={(e) => set("bathroomCount", e.target.value)}
                  />
                  <LenaTextField
                    name="land_area"
                    type="number"
                    label={tr(
                      "dashboard.requirementsDialog.fields.land",
                      locale === "ar" ? "المساحة" : "Area",
                    )}
                    value={form.land_area}
                    onChange={(e) => set("land_area", e.target.value)}
                    adornment="m²"
                  />
                </div>
              </section>

              {/* Budget */}
              <section className="space-y-3">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {tr(
                    "dashboard.requirementsDialog.sections.pricing",
                    locale === "ar" ? "الميزانية" : "Budget",
                  )}
                </h4>

                {!purposeKey && (
                  <p className="text-xs text-gray-500">
                    {tr(
                      "dashboard.requirementsDialog.pricing.selectPurpose",
                      locale === "ar"
                        ? "اختر الغرض أولاً لعرض حقول الميزانية"
                        : "Select purpose first to show budget fields",
                    )}
                  </p>
                )}

                {isBuyOrSell && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <LenaTextField
                      name="min_price"
                      type="money"
                      label={tr(
                        "dashboard.requirementsDialog.fields.minBudget",
                        locale === "ar" ? "الحد الأدنى" : "Min budget",
                      )}
                      value={form.min_price}
                      onChange={handlePriceChange}
                      adornment="EGP"
                    />
                    <LenaTextField
                      name="max_price"
                      type="money"
                      label={tr(
                        "dashboard.requirementsDialog.fields.maxBudget",
                        locale === "ar" ? "الحد الأقصى" : "Max budget",
                      )}
                      value={form.max_price}
                      onChange={handlePriceChange}
                      adornment="EGP"
                    />
                    <LenaTextField
                      name="downPayment"
                      type="money"
                      label={tr(
                        "dashboard.requirementsDialog.fields.downPayment",
                        locale === "ar" ? "المقدم" : "Down payment",
                      )}
                      value={form.downPayment}
                      onChange={handlePriceChange}
                      adornment="EGP"
                    />
                  </div>
                )}

                {isRent && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <LenaTextField
                      name="min_price"
                      type="money"
                      label={tr(
                        "dashboard.requirementsDialog.fields.minMonthlyRent",
                        locale === "ar"
                          ? "أقل إيجار شهري"
                          : "Min monthly rent",
                      )}
                      value={form.min_price}
                      onChange={handlePriceChange}
                      adornment="EGP"
                    />
                    <LenaTextField
                      name="max_price"
                      type="money"
                      label={tr(
                        "dashboard.requirementsDialog.fields.maxMonthlyRent",
                        locale === "ar"
                          ? "أقصى إيجار شهري"
                          : "Max monthly rent",
                      )}
                      value={form.max_price}
                      onChange={handlePriceChange}
                      adornment="EGP"
                    />
                  </div>
                )}
              </section>
            </div>

            <div className="shrink-0 border-t bg-white/95 backdrop-blur px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="min-h-11 flex-1 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {tr("buttons.cancel", locale === "ar" ? "إلغاء" : "Cancel")}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="min-h-11 flex-[1.4] rounded-md bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-60"
              >
                {saving
                  ? tr(
                      "common.saving",
                      locale === "ar" ? "جارٍ الحفظ..." : "Saving...",
                    )
                  : tr("common.save", locale === "ar" ? "حفظ" : "Save")}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
