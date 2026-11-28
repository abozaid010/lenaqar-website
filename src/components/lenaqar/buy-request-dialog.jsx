"use client";

import { BUILDING_TYPE_VALUES } from "@/data/constants";
import { getBuildingTypeOptions } from "@/lib/enums/buildingTypes";
import { useI18n } from "@/hooks/useI18n";
import LenaTextField from "@/components/ui/inputs/lena-text-field";
import LenaTextarea from "@/components/ui/inputs/lena-textarea";
import SearchableDropdownSelect from "@/components/ui/inputs/searchable-dropdown-select";
import UnifiedDialog from "@/components/ui/UnifiedDialog";
import { PhoneField } from "@/components/phone/PhoneField";
import RequestPlacePicker from "@/components/lenaqar/request-place-picker";
import SubmitWhatsAppFallback from "@/components/lenaqar/submit-whatsapp-fallback";
import { FORM_IDS } from "@/constants/analytics";
import {
  buildPublicBuyRequirement,
  inferBuyRequestPaymentMode,
  normalizeBuyRequestPaymentMode,
  normalizeLoadedBuyRequest,
} from "@/lib/lenaqar/buy-request-payload";
import { placeAr } from "@/lib/lenaqar/listing-seo";
import { localizedPlaceName } from "@/lib/lenaqar/place-display";
import { placesFromForm, placesFromRequirement } from "@/lib/lenaqar/request-places";
import { prefillFromRequestText } from "@/lib/lenaqar/request-text-prefill";
import { cleanDraft, clearDraft, readDraft, writeDraft } from "@/lib/lenaqar/request-draft";
import { parsePhonePayload, toPhoneFieldPublicValue } from "@/components/phone/phone-utils";
import { actionButtonClass } from "@/components/ui/action-button-class";
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
import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

function sessionStore() {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

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
    // A landing page may preset one place through the flat city/district fields.
    places: placesFromForm({
      places: initial.places,
      city: pickSingleValue(initial.city),
      district: pickSingleValue(initial.district),
      sub_district: pickSingleValue(initial.sub_district),
      project: pickSingleValue(initial.project),
    }),
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
    precise_location: initial.precise_location === true,
  };
}

function mapLoadedRequirement(loaded) {
  // API returns preferred_locations / preferred_property_types (CRM shape).
  const raw = normalizeLoadedBuyRequest(loaded);
  const paymentMode = inferBuyRequestPaymentMode(raw);
  return {
    paymentMode,
    // Every saved place, not only the newest one.
    places: placesFromRequirement(loaded),
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
    precise_location: loaded?.precise_location === true,
  };
}

/**
 * Overlay a free-text prefill (homepage composer) on a base form. Only fields
 * the prefill actually carries win; everything else (e.g. a returning buyer's
 * saved location) is kept.
 */
function applyPrefill(base, prefill) {
  if (!prefill || typeof prefill !== "object") return base;
  const seeded = createEmptyForm(prefill);
  const next = { ...base };
  for (const key of [
    "buildingType",
    "roomsCount",
    "max_price",
    "downPayment",
    "monthlyInstallment",
    "notes",
  ]) {
    if (seeded[key] !== "") next[key] = seeded[key];
  }
  if (prefill.paymentMode) {
    next.paymentMode = seeded.paymentMode;
    if (seeded.paymentMode === "cash") {
      next.downPayment = "";
      next.monthlyInstallment = "";
      next.deliveryDate = "ready";
    } else if (seeded.deliveryDate) {
      next.deliveryDate = seeded.deliveryDate;
    } else if (base.paymentMode === "cash") {
      next.deliveryDate = "";
    }
  }
  return next;
}

const COMMON_BUILDING_TYPES = [
  "apartment",
  "villa",
  "duplex",
  "townhouse",
  "twinhouse",
  "chalet",
  "studio",
];

/** The dropdown sorts by label unless told otherwise; the type list has its own order. */
const keepGivenOrder = (options) => options;

const DETAIL_ERROR_KEYS = [
  "roomsCount",
  "downPayment",
  "monthlyInstallment",
  "deliveryDate",
  "notes",
];

/** Project names for the form's project picker. Shared so a page can prefetch it. */
export const CATALOG_PROJECTS_QUERY = {
  queryKey: ["lenaqar", "catalog-projects"],
  queryFn: async () => {
    const response = await fetch("/api/lenaqar/catalog-projects");
    if (!response.ok) return [];
    const json = await response.json();
    const rows = json?.data ?? json;
    return Array.isArray(rows) ? rows : [];
  },
  staleTime: 1000 * 60 * 5,
};

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
  showSuccessToast = true,
  onSavingChange,
  contactHint = null,
  clientId,
  initialValues,
  prefill,
  showContactFields = false,
  overlayClassName,
  loadRequirement,
  saveRequirement,
  // "dialog" (default): the modal. "inline": the same form in the page itself, with the
  // description first, one submit button at the end and the buyer's typing kept as a draft.
  presentation = "dialog",
  className = "",
  // Inline only: put the cursor in the description once, when the form is ready.
  autoFocusNotes = false,
}) {
  const { locale, translate: tr } = useI18n();
  const inline = presentation === "inline";

  const { data: catalogProjects = [], isLoading: catalogProjectsLoading } = useQuery({
    ...CATALOG_PROJECTS_QUERY,
    enabled: open,
    retry: 1,
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  // Set at once on submit (state lags a render): blocks a second submit and the close
  // actions (Escape, the header X) while the request is being saved.
  const savingRef = useRef(false);
  // Inline draft: what the form looked like when seeded (a draft is kept only when the
  // buyer changed something), and a switch that stops writing once the request is saved.
  const baselineRef = useRef("null");
  const draftOffRef = useRef(false);
  // Inline: the lead id a submit just saved while the page moves to its match page. Its
  // request is not read back: that read is a server action, and a server action started
  // during the navigation cancels it, leaving the buyer on an empty form.
  const skipReloadRef = useRef("");
  const notesRef = useRef(null);
  const focusedNotesRef = useRef(false);
  // The saved request was read back for this buyer: they are editing it, and the
  // server already knows who they are.
  const [editingSaved, setEditingSaved] = useState(false);
  // The server asked for a name and phone after all (it no longer accepts the saved proof).
  const [forceContact, setForceContact] = useState(false);
  const [form, setForm] = useState(() => createEmptyForm(initialValues));
  const [placesError, setPlacesError] = useState("");
  // The optional block starts expanded; the buyer can still fold it away.
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [fieldErrors, setFieldErrors] = useState({});
  const [contactName, setContactName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phonePayload, setPhonePayload] = useState(null);
  const [notBrokerConfirmed, setNotBrokerConfirmed] = useState(false);
  // Fields outside the requirement the buyer left empty: name, phone, the broker box.
  // Shown on the fields themselves after a submit attempt, cleared as each is fixed.
  const [missing, setMissing] = useState({});
  const clearMissing = (key) =>
    setMissing((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  const [whatsappFallbackHrefState, setWhatsappFallbackHrefState] = useState("");

  // The types most buyers ask for come first; the rest keep their order.
  const buildingTypeOptions = useMemo(() => {
    const options = getBuildingTypeOptions(tr);
    const rank = (option) => {
      const index = COMMON_BUILDING_TYPES.indexOf(String(option.value).toLowerCase());
      return index === -1 ? COMMON_BUILDING_TYPES.length : index;
    };
    return options
      .map((option, index) => ({ option, index }))
      .sort((a, b) => rank(a.option) - rank(b.option) || a.index - b.index)
      .map(({ option }) => option);
  }, [locale, tr]);

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
    setPlacesError("");
    setDetailsOpen(true);
    setNotBrokerConfirmed(false);
    setMissing({});
    setForceContact(false);
    setWhatsappFallbackHrefState("");
    setFieldErrors((prev) =>
      prev && Object.keys(prev).length === 0 ? prev : {},
    );
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    if (userId && skipReloadRef.current === userId) {
      skipReloadRef.current = "";
      return undefined;
    }
    const seed = (next) => {
      baselineRef.current = JSON.stringify(cleanDraft({ form: next }));
      let merged = next;
      if (inline) {
        // What the buyer typed before moving away from the form comes back.
        const draft = readDraft(sessionStore());
        if (draft) {
          merged = { ...next, ...draft.form };
          setContactName(draft.contactName);
          setPhoneNumber(draft.phoneNumber);
          setPhonePayload(
            toPhoneFieldPublicValue(parsePhonePayload(draft.phoneNumber, "EG")),
          );
        }
      }
      setForm(merged);
      setDetailsOpen(true);
    };
    if (!userId) {
      setEditingSaved(false);
      setContactName("");
      setPhoneNumber("");
      setPhonePayload(null);
      setLoading(false);
      seed(applyPrefill(createEmptyForm(initialValues), prefill));
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
          setEditingSaved(false);
          seed(applyPrefill(createEmptyForm(initialValues), prefill));
          return;
        }
        setEditingSaved(true);
        seed(applyPrefill(mapLoadedRequirement(raw), prefill));
      } catch (e) {
        if (!cancelled) {
          setEditingSaved(false);
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
  }, [open, userId, loadRequirement, initialValues, prefill, tr, inline]);

  useEffect(() => {
    if (!inline || !autoFocusNotes || !open || loading || focusedNotesRef.current) return;
    focusedNotesRef.current = true;
    notesRef.current?.focus?.();
  }, [inline, autoFocusNotes, open, loading]);

  // Inline only: keep the unsaved form for this tab (debounced).
  useEffect(() => {
    if (!inline || !open || loading) return undefined;
    const timer = setTimeout(() => {
      if (draftOffRef.current) return;
      const storage = sessionStore();
      const untouched =
        JSON.stringify(cleanDraft({ form })) === baselineRef.current &&
        !contactName.trim() &&
        !phoneNumber;
      if (untouched) clearDraft(storage);
      else writeDraft(storage, { form, contactName, phoneNumber });
    }, 300);
    return () => clearTimeout(timer);
  }, [inline, open, loading, form, contactName, phoneNumber]);

  // Inline: the description is the first thing typed; once the buyer leaves it, the
  // fields it already answers (type, rooms, budget, payment) are filled when still empty.
  const handleNotesBlur = () => {
    if (!form.notes.trim()) return;
    const parsed = prefillFromRequestText(form.notes);
    const fill = {};
    for (const key of ["buildingType", "roomsCount", "max_price", "downPayment", "monthlyInstallment"]) {
      if (form[key] === "" && parsed[key] != null) fill[key] = parsed[key];
    }
    if (!form.paymentMode && parsed.paymentMode) {
      fill.paymentMode = parsed.paymentMode;
      if (parsed.deliveryDate) fill.deliveryDate = parsed.deliveryDate;
    }
    if (Object.keys(fill).length) setForm((prev) => applyPrefill(prev, fill));
  };

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

  const handlePlacesChange = (places) => {
    setForm((prev) => ({ ...prev, places }));
    setPlacesError("");
  };

  const handlePaymentModeChange = (nextMode) => {
    const picked = normalizeBuyRequestPaymentMode(nextMode);
    setForm((prev) => {
      // Tapping the selected mode again clears it: the buyer need not say.
      const mode = prev.paymentMode === picked ? "" : picked;
      if (!mode) {
        return {
          ...prev,
          paymentMode: "",
          downPayment: "",
          monthlyInstallment: "",
          deliveryDate: "",
        };
      }
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

  // Contact is asked of a new request; the owner of a saved request is not asked again.
  const knownContact = showContactFields && editingSaved && !forceContact;
  const askContact = showContactFields && !knownContact;
  const hintParts = [
    contactHint?.name,
    contactHint?.phoneTail ? `••• ${contactHint.phoneTail}` : "",
  ].filter(Boolean);

  const handleClose = () => {
    if (savingRef.current) return;
    onClose?.();
  };

  const isCash = form.paymentMode === "cash";
  const isInstallment = form.paymentMode === "installment";
  const placeName = (place) =>
    place.project ||
    localizedPlaceName(
      place.sub_district || place.district || place.city,
      placeAr(place.sub_district || place.district || place.city),
      locale,
    );

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (savingRef.current) return;
    if (!userId && !showContactFields) return;

    // Check everything at once, so every empty required field is marked together.
    const built = buildPublicBuyRequirement(form);
    const gaps = {};
    if (askContact) {
      if (!contactName.trim()) gaps.contact_name = true;
      if (!phonePayload?.combined) gaps.contact_phone = true;
    }
    if (!notBrokerConfirmed) gaps.not_broker = true;
    const builtErrors = built.ok ? {} : built.errors;

    if (!built.ok || Object.keys(gaps).length) {
      setFieldErrors(builtErrors);
      setMissing(gaps);
      setPlacesError(
        builtErrors.places ? tr(`lenaqar.buyRequest.errors.${builtErrors.places}`) : "",
      );
      // An error inside the optional block must not stay hidden behind its toggle.
      if (DETAIL_ERROR_KEYS.some((key) => builtErrors[key])) setDetailsOpen(true);
      toast.error(
        locale === "ar"
          ? "كمّل الحقول المعلّمة بالأحمر"
          : "Complete the highlighted fields",
      );
      // Bring the first marked field (in form order) into view.
      const order = [
        "notes",
        "places",
        "buildingType",
        "max_price",
        "contact_name",
        "contact_phone",
        "not_broker",
      ];
      const failing = new Set([...Object.keys(builtErrors), ...Object.keys(gaps)]);
      const firstKey = order.find((key) => failing.has(key));
      requestAnimationFrame(() => {
        const target = firstKey
          ? document.querySelector(`[data-field="${firstKey}"]`)
          : null;
        target?.scrollIntoView({ block: "center", behavior: "smooth" });
      });
      return;
    }
    setMissing({});
    setFieldErrors({});
    setPlacesError("");

    savingRef.current = true;
    setSaving(true);
    onSavingChange?.(true);
    setWhatsappFallbackHrefState("");
    try {
      const extra = {
        notBrokerConfirmed: true,
        ...(askContact
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
      // With a match reference the parent navigates to the match page (see skipReloadRef).
      if (inline && saveResult?.matchRef && savedUserId && savedUserId !== userId) {
        skipReloadRef.current = savedUserId;
      }
      if (savedUserId) onUserId?.(savedUserId);

      if (inline) {
        draftOffRef.current = true;
        clearDraft(sessionStore());
      }
      if (showSuccessToast) {
        toast.success(
          successMessage ||
            tr("lenaqar.buyRequest.saved", "Request saved"),
        );
      }
      onSuccess?.(built.requirement, saveResult);
      onClose();
    } catch (err) {
      if (err?.code === "contact_required") {
        // Nothing was saved and the server needs to know who this is: show the
        // contact fields (empty, to be typed) instead of the WhatsApp fallback.
        setForceContact(true);
        toast.error(tr("lenaqar.buyRequest.errors.contact_required"));
        return;
      }
      const buildingTypeLabel = form.buildingType
        ? tr(`buildingTypes.${form.buildingType}`, form.buildingType)
        : "";
      const message = composeBuyRequestWhatsAppMessage({
        form: {
          ...form,
          // One line for every place the buyer picked.
          city: form.places.map(placeName).join("، "),
          buildingType: buildingTypeLabel,
        },
        contact: askContact
          ? {
              name: contactName.trim(),
              phone: phonePayload?.combined,
            }
          : {},
        intro: tr("lenaqar.buyRequest.whatsappFallbackIntro"),
        labels: {
          name: tr("lenaqar.buyRequest.name"),
          phone: tr("lenaqar.buyRequest.phone"),
          city: tr("lenaqar.buyRequest.places.label"),
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
      savingRef.current = false;
      setSaving(false);
      onSavingChange?.(false);
    }
  };

  const dropdownClassName = "w-full";

  const submitDisabled = loading || saving || (!userId && !showContactFields);
  const submitText = saving
    ? tr("lenaqar.buyRequest.sending", "بنبعت الطلب...")
    : submitLabel || tr("lenaqar.buyRequest.submit", "Submit");

  const content = (
    <>
      {loading ? (
        <div role="status" aria-busy="true" className="space-y-5 py-1">
          <span className="sr-only">
            {tr("common.loading", locale === "ar" ? "بنحمّل..." : "Loading...")}
          </span>
          {[0, 1, 2, 3].map((row) => (
            <div key={row} aria-hidden="true" className="skeleton-shimmer h-12 rounded-md" />
          ))}
        </div>
      ) : (
        <>
          {intro ? <p className="text-sm text-gray-600 -mt-1">{intro}</p> : null}

          {whatsappFallbackHrefState ? (
            <SubmitWhatsAppFallback
              href={whatsappFallbackHrefState}
              formId={FORM_IDS.BUY_REQUEST}
              title={tr("lenaqar.buyRequest.saveFailedTitle")}
              body={tr("lenaqar.buyRequest.saveFailedWhatsAppBody")}
              countdownLabel={tr("lenaqar.buyRequest.saveFailedWhatsAppCountdown")}
              ctaLabel={tr("lenaqar.buyRequest.saveFailedWhatsAppCta")}
            />
          ) : null}

          {inline ? (
            <div data-field="notes" onBlur={handleNotesBlur}>
              <LenaTextarea
                ref={notesRef}
                name="notes"
                label={tr("lenaqar.buyRequest.notesTopLabel")}
                value={form.notes}
                onChange={handleFieldChange}
                rows={3}
                helperText={tr("lenaqar.buyRequest.notesTopHint")}
                error={Boolean(compactError("notes"))}
                errorMessage={compactError("notes")}
              />
            </div>
          ) : null}

          <div data-field="places">
            <RequestPlacePicker
              value={form.places}
              onChange={handlePlacesChange}
              projects={catalogProjects}
              enabled={open}
              error={placesError}
            />
            <label className="mt-2 flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="precise_location"
                checked={form.precise_location === true}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, precise_location: event.target.checked }))
                }
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-black/30 text-primary focus:ring-primary/30"
              />
              <span className="min-w-0 text-sm text-black/80 leading-relaxed">
                <span className="block font-medium">{tr("lenaqar.buyRequest.places.preciseOnly")}</span>
                <span className="block text-xs text-black/60">{tr("lenaqar.buyRequest.places.preciseOnlyHint")}</span>
              </span>
            </label>
          </div>

          <div data-field="buildingType">
            <SearchableDropdownSelect
              name="buildingType"
              label={tr("lenaqar.buyRequest.buildingType", "Property type")}
              value={form.buildingType}
              onChange={handleFieldChange}
              options={buildingTypeOptions}
              sortOptions={keepGivenOrder}
              required
              error={Boolean(compactError("buildingType"))}
              errorMessage={compactError("buildingType")}
              placeholder={tr("lenaqar.buyRequest.selectType", "Select type")}
              className={dropdownClassName}
            />
          </div>

          <div data-field="max_price">
            <LenaTextField
              name="max_price"
              type="money"
              label={tr("lenaqar.buyRequest.maxPrice", "Total price budget")}
              value={form.max_price}
              onChange={handleFieldChange}
              placeholder={tr("lenaqar.buyRequest.maxPricePlaceholder")}
              adornment={tr("lenaqar.unit.egp")}
              required
              error={Boolean(compactError("max_price"))}
              errorMessage={compactError("max_price")}
            />
          </div>

          {knownContact && hintParts.length ? (
            <p className="rounded-lg bg-primary/5 px-3 py-2.5 text-sm text-gray-700">
              {tr("lenaqar.buyRequest.contactKnown")}{" "}
              <bdi className="font-semibold text-primary">{hintParts.join(" · ")}</bdi>
            </p>
          ) : null}

          {askContact ? (
            <section className="space-y-3">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {tr("lenaqar.buyRequest.contactSection", "Contact")}
              </h4>
              <div data-field="contact_name">
                <LenaTextField
                  name="contact_name"
                  label={tr("lenaqar.buyRequest.name", "Name")}
                  value={contactName}
                  onChange={(e) => {
                    setContactName(e.target.value);
                    if (e.target.value.trim()) clearMissing("contact_name");
                  }}
                  required
                  error={Boolean(missing.contact_name)}
                  errorMessage={
                    missing.contact_name
                      ? tr("lenaqar.buyRequest.nameRequired", "Name is required")
                      : ""
                  }
                />
              </div>
              <div data-field="contact_phone">
                <PhoneField
                  className="w-full"
                  name="contact_phone"
                  label={tr("lenaqar.buyRequest.phone", "Phone")}
                  required
                  defaultCountry="EG"
                  value={phoneNumber}
                  error={
                    missing.contact_phone
                      ? // Digits typed but not a valid number: say so, not "required".
                        phoneNumber
                        ? tr("lenaqar.buyRequest.phoneInvalid", "Enter a valid mobile number")
                        : tr("lenaqar.buyRequest.phoneRequired", "Phone is required")
                      : undefined
                  }
                  onChange={(next) => setPhoneNumber(next ?? "")}
                  onValueChange={(payload) => {
                    setPhonePayload(payload);
                    if (payload?.combined) clearMissing("contact_phone");
                  }}
                />
              </div>
            </section>
          ) : null}

          <section className="rounded-xl border border-black/10">
            <button
              type="button"
              aria-expanded={detailsOpen}
              aria-controls="buy-request-details"
              onClick={() => setDetailsOpen((value) => !value)}
              className="flex min-h-11 w-full items-center justify-between gap-3 px-3.5 py-2 text-start text-sm font-medium text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <span>
                {tr("lenaqar.buyRequest.detailsToggle")}{" "}
                <span className="ms-1 text-xs font-normal text-gray-500">
                  {tr("lenaqar.buyRequest.detailsOptional")}
                </span>
              </span>
              <ChevronDown
                aria-hidden="true"
                className={`size-4 shrink-0 transition-transform ${detailsOpen ? "rotate-180" : ""}`}
              />
            </button>
            {detailsOpen ? (
              <div id="buy-request-details" className="space-y-3 border-t border-black/10 p-3.5">
                <LenaTextField
                  name="roomsCount"
                  label={tr("lenaqar.buyRequest.roomsCount", "Bedrooms")}
                  value={form.roomsCount}
                  onChange={handleFieldChange}
                  inputMode="numeric"
                  error={Boolean(compactError("roomsCount"))}
                  errorMessage={compactError("roomsCount")}
                />

                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-800">
                    {tr("lenaqar.buyRequest.paymentModeLabel", "Payment method")}
                  </p>
                  <div
                    role="group"
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
                          aria-pressed={selected}
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
                </div>

                {isCash ? (
                  <p className="text-xs text-gray-600">
                    {tr("lenaqar.buyRequest.cashDeliveryNote")}
                  </p>
                ) : null}

                {isInstallment ? (
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
                ) : null}

                {inline ? null : (
                  <LenaTextarea
                    name="notes"
                    label={tr("lenaqar.buyRequest.notes", "Notes")}
                    value={form.notes}
                    onChange={handleFieldChange}
                    rows={3}
                    helperText={tr(
                      "lenaqar.buyRequest.notesHint",
                      "اكتب أي تفاصيل إضافية عن اللي بتدور عليه",
                    )}
                    error={Boolean(compactError("notes"))}
                    errorMessage={compactError("notes")}
                  />
                )}
              </div>
            ) : null}
          </section>

          {/* Yellow so nobody misses it; red once a submit found it unchecked. */}
          <div data-field="not_broker">
            <label
              className={`flex items-start gap-3 cursor-pointer rounded-xl border-2 p-3.5 transition-colors ${
                missing.not_broker
                  ? "border-red-500 bg-red-50"
                  : "border-amber-400 bg-amber-50"
              }`}
            >
              <input
                type="checkbox"
                name="not_broker_confirm"
                checked={notBrokerConfirmed}
                aria-invalid={Boolean(missing.not_broker)}
                onChange={(event) => {
                  setNotBrokerConfirmed(event.target.checked);
                  if (event.target.checked) clearMissing("not_broker");
                }}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-black/30 text-primary focus:ring-primary/30"
              />
              <span className="text-sm font-medium text-black/80 leading-relaxed">
                {tr("lenaqar.buyRequest.notBrokerConfirm")}
              </span>
            </label>
            {missing.not_broker ? (
              <p role="alert" className="mt-1.5 text-xs font-medium text-red-600">
                {tr("lenaqar.buyRequest.notBrokerRequired", "You must confirm you are not a broker")}
              </p>
            ) : null}
          </div>
        </>
      )}
    </>
  );

  // Inline: the same fields in the page's own layout. No overlay, no close button; the one
  // submit action closes the form.
  if (inline) {
    return (
      <form
        onSubmit={handleSubmit}
        noValidate
        aria-busy={saving}
        className={`space-y-5 text-sm ${className}`}
      >
        {content}
        <button
          type="submit"
          disabled={submitDisabled}
          className={actionButtonClass({
            variant: "primary",
            size: "large",
            className: "w-full disabled:pointer-events-none disabled:opacity-60",
          })}
        >
          {submitText}
        </button>
      </form>
    );
  }

  return (
    <UnifiedDialog
      isOpen={open}
      onClose={handleClose}
      title={title || tr("lenaqar.buyRequest.title", "Buy request")}
      cancelLabel={tr("common.cancel", locale === "ar" ? "إلغاء" : "Cancel")}
      onCancel={handleClose}
      submitLabel={submitText}
      onSubmit={handleSubmit}
      submitDisabled={submitDisabled}
      submitLoading={saving}
      closeOnEscape
      overlayClassName={overlayClassName}
      dialogClassName="w-full sm:max-w-xl"
      bodyClassName="space-y-5 text-sm !p-4 pb-8"
    >
      {content}
    </UnifiedDialog>
  );
}
