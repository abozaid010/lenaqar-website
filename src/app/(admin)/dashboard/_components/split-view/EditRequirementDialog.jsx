"use client";

import {
  BUILDING_TYPE_VALUES,
  FINISHING_TYPE_VALUES,
  FURNISHING_TYPE_VALUES,
} from "@/data/constants";
import { useI18n } from "@/hooks/useI18n";
import { LenaCookiesManager } from "@/lib/LenaCookiesManager";
import { isHomeyClientId } from "@/lib/dashboard-filters-storage";
import { validateLocationLeaf } from "@/lib/locations/validate-location-leaf";
import { tValidation } from "@/constants/unit-form-validation-keys";
import {
  getClientRequirements,
  updateUserRequirements,
} from "@/utils/api";
import CityManager from "@/utils/city_manager";
import LenaTextField from "@/components/ui/inputs/lena-text-field";
import LenaTextarea from "@/components/ui/inputs/lena-textarea";
import UnitsLocationSearch from "@/components/ui/inputs/units-location-search";
import SearchableDropdownSelect from "@/components/ui/inputs/searchable-dropdown-select";
import SearchableProjectSelect from "@/components/ui/inputs/searchable-project-select";
import UnifiedDialog from "@/components/ui/UnifiedDialog";
import { PhoneField } from "@/components/phone/PhoneField";
import { useProjectsNames } from "@/hooks/use-admin-shared-data";
import {
  buildPublicBuyRequirement,
  toYearMonth,
} from "@/lib/lenaqar/buy-request-payload";
import { parseMoneyInput } from "@/utils/parse-amount";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

/** Homey-only UI default when no location is set. User can still change it. */
const HOMEY_DEFAULT_LOCATION = {
  city: "cairo",
  district: "new cairo",
  sub_district: "madinaty",
};

/** Prefill Homey default only when city/district/sub_district are all empty. */
function withDefaultLocation(clientId, location = {}) {
  const city = location.city || "";
  const district = location.district || "";
  const sub_district = location.sub_district || "";
  if (city || district || sub_district) {
    return { city, district, sub_district };
  }
  if (isHomeyClientId(clientId)) {
    return { ...HOMEY_DEFAULT_LOCATION };
  }
  return { city: "", district: "", sub_district: "" };
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

/** API stores free-text notes in `additionalFeatures` (string[] | null). */
function additionalFeaturesToNotes(value) {
  if (Array.isArray(value)) {
    return value
      .filter((item) => item != null && String(item).trim() !== "")
      .map((item) => String(item).trim())
      .join(", ");
  }
  if (value == null || value === "") return "";
  return String(value).trim();
}

function notesToAdditionalFeatures(notes) {
  const trimmed = typeof notes === "string" ? notes.trim() : "";
  return trimmed ? [trimmed] : null;
}

/** Map API/display values onto the canonical English enum sent to the API. */
function normalizeEnumValue(raw, allowedValues) {
  const picked = pickSingleValue(raw);
  if (!picked) return "";
  const needle = picked.trim().toLowerCase();
  const match = allowedValues.find(
    (v) => String(v).trim().toLowerCase() === needle,
  );
  return match || "";
}

function numberToFieldValue(v) {
  if (v === null || v === undefined || v === "") return "";
  const n = Number(v);
  return Number.isFinite(n) ? String(n) : "";
}

const PURPOSE_VALUES = ["rent", "buy", "sell"];

/** CamelCase i18n keys — avoid spaces/& in translate() paths (sanitizer rejects them). */
const FINISHING_LABEL_KEYS = {
  "fully finished": "property.finishing.fullyFinished",
  "semi finished": "property.finishing.semiFinished",
  "core & shell": "property.finishing.coreShell",
  flixy: "property.finishing.flixy",
  "white box": "property.finishing.whiteBox",
  turnkey: "property.furnishing.turnkey",
};

const FURNISHING_LABEL_KEYS = {
  furnished: "property.furnishing.furnished",
  unfurnished: "property.furnishing.unfurnished",
  hotel_furnished: "property.furnishing.hotelFurnished",
  "partially furnished": "property.furnishing.partiallyFurnished",
  "semi furnished": "property.furnishing.semiFurnished",
  flixy: "property.furnishing.flixy",
  turnkey: "property.furnishing.turnkey",
};

function buildPriceFieldsForPayload(form) {
  const totalPrice = toNum(form.totalPrice);
  const maxPrice = toNum(form.max_price);
  return {
    totalPrice,
    min_price: toNum(form.min_price),
    // Matching still uses max_price; fall back to contract price when budget is empty.
    max_price: maxPrice ?? totalPrice,
    monthlyInstallment: toNum(form.monthlyInstallment),
    downPayment: toNum(form.downPayment),
    serviceCharges: toNum(form.serviceCharges),
  };
}

function createEmptyForm(userId = "", overrides = {}) {
  const client_id = String(
    overrides.clientId || LenaCookiesManager.getClientId() || "",
  ).trim();
  const initial =
    overrides.initialValues && typeof overrides.initialValues === "object"
      ? overrides.initialValues
      : {};
  return {
    client_id,
    user_id: userId,
    ...withDefaultLocation(client_id, {
      city: initial.city,
      district: initial.district,
      sub_district: initial.sub_district,
    }),
    project: pickSingleValue(initial.project),
    buildingType: pickSingleValue(initial.buildingType),
    finishingType: "",
    furnishingType: "",
    purpose: pickSingleValue(initial.purpose) || overrides.defaultPurpose || "",
    land_area: "",
    roomsCount: numberToFieldValue(initial.roomsCount),
    bathroomCount: "",
    min_price: "",
    max_price: numberToFieldValue(initial.max_price ?? initial.totalPrice),
    totalPrice: numberToFieldValue(initial.totalPrice),
    downPayment: numberToFieldValue(initial.downPayment),
    monthlyInstallment: numberToFieldValue(initial.monthlyInstallment),
    overPrice: numberToFieldValue(initial.overPrice),
    deliveryDate: toYearMonth(initial.deliveryDate),
    notes: "",
  };
}

export default function EditRequirementDialog({
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
  defaultPurpose = "",
  initialValues,
  showContactFields = false,
  fetchProjects = true,
  /** Public LenaQar buy-request only: name, phone, location, optional project,
   * budget — no purpose selector (forced buy), no property/size/notes sections. */
  compact = false,
  overlayClassName,
  loadRequirement = getClientRequirements,
  saveRequirement = updateUserRequirements,
}) {
  const { locale, translate, t } = useI18n();
  const { data: projectsData, isLoading: projectsLoading } = useProjectsNames(
    false,
    { enabled: fetchProjects && !compact },
  );
  const { data: catalogProjects, isLoading: catalogProjectsLoading } = useQuery({
    queryKey: ["lenaqar", "catalog-projects"],
    queryFn: async () => {
      const response = await fetch("/api/lenaqar/catalog-projects");
      if (!response.ok) return [];
      const json = await response.json();
      const rows = json?.data ?? json;
      return Array.isArray(rows) ? rows : [];
    },
    enabled: compact,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
  const projectOptions = compact ? catalogProjects : projectsData;
  const projectsListLoading = compact
    ? catalogProjectsLoading
    : projectsLoading;
  const formOptions = { clientId, defaultPurpose, initialValues };
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => createEmptyForm("", formOptions));
  const [locationError, setLocationError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [contactName, setContactName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phonePayload, setPhonePayload] = useState(null);

  const tr = (key, fallback) => translate(key, fallback);

  useEffect(() => {
    if (!open) {
      setLocationError("");
      setFieldErrors({});
      return undefined;
    }
    if (!userId) {
      setForm(createEmptyForm("", formOptions));
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
        // API returns response.data.data — can be null when the lead has no requirement.
        // Save still works: PATCH /requirements/{user_id} upserts (create or update).
        if (raw?.error || !raw || typeof raw !== "object") {
          if (raw?.error) toast.error(String(raw.error));
          setForm(createEmptyForm(userId, formOptions));
          return;
        }
        const resolvedClientId =
          String(
            raw.client_id || clientId || LenaCookiesManager.getClientId() || "",
          ).trim();
        setForm({
          ...createEmptyForm(userId, formOptions),
          client_id: resolvedClientId,
          ...withDefaultLocation(resolvedClientId, {
            city: pickSingleValue(raw.city),
            district: pickSingleValue(raw.district),
            sub_district: pickSingleValue(raw.sub_district),
          }),
          project: pickSingleValue(raw.project),
          buildingType: normalizeEnumValue(
            raw.buildingType,
            BUILDING_TYPE_VALUES,
          ),
          finishingType: normalizeEnumValue(
            raw.finishingType,
            FINISHING_TYPE_VALUES,
          ),
          furnishingType: normalizeEnumValue(
            raw.furnishingType,
            FURNISHING_TYPE_VALUES,
          ),
          purpose: normalizeEnumValue(
            raw.purpose ?? raw.propertyPurpose,
            PURPOSE_VALUES,
          ),
          land_area: numberToFieldValue(raw.land_area),
          roomsCount: numberToFieldValue(raw.roomsCount),
          bathroomCount: numberToFieldValue(raw.bathroomCount),
          min_price: numberToFieldValue(raw.min_price),
          max_price: numberToFieldValue(raw.max_price ?? raw.totalPrice),
          totalPrice: numberToFieldValue(raw.totalPrice),
          downPayment: numberToFieldValue(raw.downPayment),
          monthlyInstallment: numberToFieldValue(raw.monthlyInstallment),
          overPrice: numberToFieldValue(raw.overPrice),
          deliveryDate: toYearMonth(raw.deliveryDate),
          notes:
            additionalFeaturesToNotes(raw.additionalFeatures) ||
            (raw.notes == null || raw.notes === ""
              ? ""
              : String(raw.notes)),
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

  const set = (k, v) => {
    setFieldErrors((prev) => {
      if (!prev[k]) return prev;
      const next = { ...prev };
      delete next[k];
      return next;
    });
    setForm((prev) => ({ ...prev, [k]: v }));
  };

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
    if (name === "project") {
      setLocationError("");
    }
    set(name, value);
  };

  const handleLocationChange = (payload) => {
    setLocationError("");
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
    set(name, parseMoneyInput(value));
  };

  const purposeKey = String(form.purpose || "").toLowerCase();
  const isRent = purposeKey === "rent";
  const isBuyOrSell = purposeKey === "buy" || purposeKey === "sell";

  const dropdownClassName =
    "[&>div>button]:bg-white [&>div>button]:border-gray-200 [&>div>button]:text-gray-900 [&>div>button]:text-sm [&>div>button]:min-h-11 [&>div>button]:w-full";
  const inputClassName =
    "w-full min-h-11 border border-gray-200 rounded-md px-3 py-2.5 mt-1 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white";
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

  const getPurposeLabel = (value) =>
    tr(`basicDetails.purposes.${value}`, toDisplayLabel(value));

  const getBuildingTypeLabel = (value) =>
    tr(
      `buildingTypes.${value}`,
      tr(`property.buildingTypes.${value}`, toDisplayLabel(value)),
    );

  const buildingTypeOptions = useMemo(
    () =>
      BUILDING_TYPE_VALUES.map((value) => ({
        value,
        label: getBuildingTypeLabel(value),
      })),
    [locale],
  );

  const getFinishingLabel = (value) => {
    const key = FINISHING_LABEL_KEYS[String(value).toLowerCase()];
    return key ? tr(key, toDisplayLabel(value)) : toDisplayLabel(value);
  };

  const getFurnishingLabel = (value) => {
    const key = FURNISHING_LABEL_KEYS[String(value).toLowerCase()];
    return key ? tr(key, toDisplayLabel(value)) : toDisplayLabel(value);
  };

  const compactError = (key) =>
    fieldErrors[key]
      ? tr(`lenaqar.buyRequest.errors.${fieldErrors[key]}`)
      : "";

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (!userId && !showContactFields) return;

    if (showContactFields) {
      if (!contactName.trim()) {
        toast.error(
          tr(
            "lenaqar.buyRequest.nameRequired",
            locale === "ar" ? "الاسم مطلوب" : "Name is required",
          ),
        );
        return;
      }
      if (!phonePayload?.combined) {
        toast.error(
          tr(
            "lenaqar.buyRequest.phoneRequired",
            locale === "ar" ? "رقم الموبايل مطلوب" : "Phone number is required",
          ),
        );
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
      const message = tValidation(translate, locationResult.key);
      setLocationError(message);
      toast.error(message);
      return;
    }
    setLocationError("");

    let payload;
    if (compact) {
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
      payload = built.requirement;
    } else {
      const resolvedClientId =
        form.client_id || clientId || LenaCookiesManager.getClientId() || "";
      const purpose = normalizeEnumValue(form.purpose, PURPOSE_VALUES) || null;
      payload = {
        client_id: resolvedClientId,
        user_id: userId || "",
        city: form.city,
        district: form.district,
        sub_district: form.sub_district,
        project: form.project,
        buildingType:
          normalizeEnumValue(form.buildingType, BUILDING_TYPE_VALUES) || null,
        finishingType:
          normalizeEnumValue(form.finishingType, FINISHING_TYPE_VALUES) ||
          null,
        furnishingType:
          normalizeEnumValue(form.furnishingType, FURNISHING_TYPE_VALUES) ||
          null,
        purpose,
        land_area: toNum(form.land_area),
        roomsCount: toNum(form.roomsCount),
        bathroomCount: toNum(form.bathroomCount),
        ...buildPriceFieldsForPayload({ ...form, purpose: purpose || "" }),
        additionalFeatures: notesToAdditionalFeatures(form.notes),
        score: {},
      };
    }

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
      const saveResult = await saveRequirement(userId, payload, extra);
      const savedUserId = String(saveResult?.userId || userId || "").trim();
      if (savedUserId) onUserId?.(savedUserId);

      // Confirm notes persist via additionalFeatures (API has no `notes` field).
      const wantedNotes = additionalFeaturesToNotes(payload.additionalFeatures);
      if (!compact && wantedNotes && savedUserId) {
        const refreshed = await loadRequirement(savedUserId);
        const savedNotes =
          refreshed && !refreshed.error
            ? additionalFeaturesToNotes(refreshed.additionalFeatures)
            : "";
        if (savedNotes !== wantedNotes) {
          toast.error(
            tr(
              "dashboard.requirementsDialog.messages.notesNotPersisted",
              locale === "ar"
                ? "تم حفظ المتطلبات، لكن الملاحظات لم تُحفظ من الـ API. تحقق من دعم حقل additionalFeatures في المتطلب."
                : "Requirements saved, but notes were not stored by the API. Confirm the requirement `additionalFeatures` field is supported.",
            ),
          );
          onSuccess?.(payload);
          return;
        }
      }

      toast.success(
        successMessage ||
          tr(
            "common.requirementsSaved",
            locale === "ar" ? "تم حفظ المتطلبات بنجاح" : "Requirements saved",
          ),
      );
      onSuccess?.(payload);
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
    <UnifiedDialog
      isOpen={open}
      onClose={onClose}
      title={
        title ||
        tr(
          "dashboard.requirementsDialog.title",
          locale === "ar" ? "تعديل المتطلبات" : "Edit Requirements",
        )
      }
      cancelLabel={tr("buttons.cancel", locale === "ar" ? "إلغاء" : "Cancel")}
      onCancel={onClose}
      submitLabel={
        saving
          ? tr(
              "common.saving",
              locale === "ar" ? "جارٍ الحفظ..." : "Saving...",
            )
          : submitLabel || tr("common.save", locale === "ar" ? "حفظ" : "Save")
      }
      onSubmit={handleSubmit}
      submitDisabled={loading || saving || (!userId && !showContactFields)}
      submitLoading={saving}
      closeOnEscape
      overlayClassName={overlayClassName}
      dialogClassName="sm:max-w-xl"
      bodyClassName="space-y-5 text-sm !p-4"
    >
      {loading ? (
        <div className="p-6 text-center text-sm text-gray-500">
          {tr(
            "dashboard.requirementsDialog.loading",
            locale === "ar" ? "جارٍ التحميل..." : "Loading...",
          )}
        </div>
      ) : (
        <>
          {intro ? (
            <p className="text-sm text-gray-600 -mt-1">{intro}</p>
          ) : null}

          {showContactFields ? (
            <section className="space-y-3">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {tr(
                  "lenaqar.buyRequest.contactSection",
                  locale === "ar" ? "بيانات التواصل" : "Contact",
                )}
              </h4>
              <LenaTextField
                name="contact_name"
                label={tr(
                  "lenaqar.buyRequest.name",
                  locale === "ar" ? "الاسم" : "Name",
                )}
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                required
              />
              <PhoneField
                className="w-full"
                name="contact_phone"
                label={tr(
                  "lenaqar.buyRequest.phone",
                  locale === "ar" ? "موبايل" : "Phone",
                )}
                required
                defaultCountry="EG"
                value={phoneNumber}
                onChange={(next) => setPhoneNumber(next ?? "")}
                onValueChange={setPhonePayload}
              />
            </section>
          ) : null}

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
                required
                error={Boolean(locationError)}
                errorMessage={locationError}
                showAllOption={false}
                placeholder={tr(
                  "basicDetails.locationSearchPlaceholder",
                  locale === "ar"
                    ? "ابحث عن مدينة أو منطقة أو حي…"
                    : "Search city, district, or area…",
                )}
                className={dropdownClassName}
              />
              {!compact ? (
                <p className="text-xs text-gray-500 -mt-1">
                  {tr(
                    "basicDetails.locationSearchHint",
                    locale === "ar"
                      ? "اختر موقعاً نهائياً: حي فرعي، أو منطقة بلا أحياء فرعية، أو مشروع."
                      : "Select a leaf location: sub-district, a district with no sub-districts, or a project.",
                  )}
                </p>
              ) : null}
              <SearchableProjectSelect
                name="project"
                label={tr(
                  compact
                    ? "lenaqar.buyRequest.project"
                    : "dashboard.requirementsDialog.fields.project",
                  locale === "ar" ? "المشروع" : "Project",
                )}
                value={form.project}
                onChange={handleFieldChange}
                projects={projectOptions || []}
                city={form.city || ""}
                district={form.district || ""}
                isLoading={projectsListLoading}
                placeholder={
                  compact
                    ? tr(
                        "lenaqar.buyRequest.selectProject",
                        locale === "ar" ? "اختياري — اختر المشروع" : "Optional — select project",
                      )
                    : t?.unitsFilter?.allCompounds ||
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
                compact
                  ? "lenaqar.buyRequest.propertySection"
                  : "dashboard.requirementsDialog.sections.property",
                locale === "ar" ? "العقار" : "Property",
              )}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {!compact ? (
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
                      {getPurposeLabel(v)}
                    </option>
                  ))}
                </select>
              </div>
              ) : null}
              <SearchableDropdownSelect
                name="buildingType"
                label={tr(
                  compact
                    ? "lenaqar.buyRequest.buildingType"
                    : "dashboard.requirementsDialog.fields.buildingType",
                  locale === "ar" ? "نوع الوحدة" : "Property type",
                )}
                value={form.buildingType}
                onChange={(e) => set("buildingType", e.target.value)}
                required={compact}
                error={Boolean(compact && compactError("buildingType"))}
                errorMessage={compact ? compactError("buildingType") : ""}
                options={buildingTypeOptions}
                getValue={(opt) => opt.value}
                getLabel={(opt) => opt.label}
                placeholder={
                  compact
                    ? tr(
                        "lenaqar.sellRequest.selectType",
                        locale === "ar" ? "اختر النوع" : "Select type",
                      )
                    : notSpecifiedLabel
                }
                searchPlaceholder={tr(
                  "lenaqar.sellRequest.selectType",
                  locale === "ar" ? "ابحث عن النوع…" : "Search type…",
                )}
                className={dropdownClassName}
              />
              {compact ? (
                <LenaTextField
                  name="roomsCount"
                  type="number"
                  min="1"
                  step="1"
                  label={tr(
                    "lenaqar.buyRequest.roomsCount",
                    locale === "ar" ? "عدد الغرف" : "Rooms",
                  )}
                  value={form.roomsCount}
                  onChange={(e) => set("roomsCount", e.target.value)}
                  error={Boolean(compactError("roomsCount"))}
                  errorMessage={compactError("roomsCount")}
                />
              ) : (
              <>
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
                      {getFinishingLabel(v)}
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
                      {getFurnishingLabel(v)}
                    </option>
                  ))}
                </select>
              </div>
              </>
              )}
            </div>
          </section>

          {/* Size */}
          {!compact ? (
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
          ) : null}

          {/* Budget */}
          <section className="space-y-3">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {tr(
                "dashboard.requirementsDialog.sections.pricing",
                locale === "ar" ? "الميزانية" : "Budget",
              )}
            </h4>

            {compact ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <LenaTextField
                  name="max_price"
                  type="money"
                  required
                  label={tr(
                    "lenaqar.buyRequest.maxPrice",
                    locale === "ar" ? "أقصى سعر" : "Max price",
                  )}
                  value={form.max_price}
                  onChange={handlePriceChange}
                  adornment="EGP"
                  error={Boolean(compactError("max_price"))}
                  errorMessage={compactError("max_price")}
                />
                <LenaTextField
                  name="downPayment"
                  type="money"
                  label={tr(
                    "lenaqar.buyRequest.downPayment",
                    locale === "ar" ? "المقدم" : "Down payment",
                  )}
                  value={form.downPayment}
                  onChange={handlePriceChange}
                  adornment="EGP"
                  error={Boolean(compactError("downPayment"))}
                  errorMessage={compactError("downPayment")}
                />
                <LenaTextField
                  name="monthlyInstallment"
                  type="money"
                  label={tr(
                    "lenaqar.buyRequest.monthlyInstallment",
                    locale === "ar" ? "القسط الشهري" : "Monthly installment",
                  )}
                  value={form.monthlyInstallment}
                  onChange={handlePriceChange}
                  adornment="EGP"
                  error={Boolean(compactError("monthlyInstallment"))}
                  errorMessage={compactError("monthlyInstallment")}
                />
                <LenaTextField
                  name="overPrice"
                  type="money"
                  label={tr(
                    "lenaqar.buyRequest.overPrice",
                    locale === "ar" ? "الأوفر" : "Over-price",
                  )}
                  value={form.overPrice}
                  onChange={handlePriceChange}
                  adornment="EGP"
                  error={Boolean(compactError("overPrice"))}
                  errorMessage={compactError("overPrice")}
                />
                <LenaTextField
                  name="deliveryDate"
                  type="month"
                  label={tr(
                    "lenaqar.buyRequest.deliveryDate",
                    locale === "ar" ? "تاريخ التسليم" : "Delivery date",
                  )}
                  value={form.deliveryDate}
                  onChange={(e) => set("deliveryDate", e.target.value)}
                  error={Boolean(compactError("deliveryDate"))}
                  errorMessage={compactError("deliveryDate")}
                />
              </div>
            ) : (
              <>
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
                    <LenaTextField
                      name="totalPrice"
                      type="money"
                      label={tr(
                        "dashboard.requirementsDialog.fields.totalPrice",
                        locale === "ar" ? "سعر العقد" : "Contract price",
                      )}
                      value={form.totalPrice}
                      onChange={handlePriceChange}
                      adornment="EGP"
                    />
                    <LenaTextField
                      name="monthlyInstallment"
                      type="money"
                      label={tr(
                        "dashboard.requirementsDialog.fields.monthly",
                        locale === "ar" ? "القسط الشهري" : "Monthly installment",
                      )}
                      value={form.monthlyInstallment}
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
              </>
            )}
          </section>

          {!compact ? (
          <section className="space-y-3">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {tr(
                "dashboard.requirementsDialog.sections.notes",
                locale === "ar" ? "ملاحظات إضافية" : "Additional Notes",
              )}
            </h4>
            <LenaTextarea
              name="notes"
              label={tr(
                "dashboard.requirementsDialog.fields.notes",
                locale === "ar" ? "ملاحظات" : "Notes",
              )}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder={tr(
                "dashboard.requirementsDialog.fields.notesPlaceholder",
                locale === "ar"
                  ? "أضف ملاحظات إضافية عن المتطلب..."
                  : "Add more notes about this requirement…",
              )}
              rows={4}
              className="text-sm"
            />
          </section>
          ) : null}
        </>
      )}
    </UnifiedDialog>
  );
}
