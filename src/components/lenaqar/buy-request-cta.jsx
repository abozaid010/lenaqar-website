"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useI18n } from "@/hooks/useI18n";
import { useGoogleAnalytics } from "@/hooks/useGoogleAnalytics";
import { ANALYTICS } from "@/constants/analytics";
import { SITE } from "@/config/site";
import { requirementToUnitsFilter } from "@/lib/match/requirement-to-units-filter";
import { trackBuyRequestFormViewed, trackBuyRequestSubmitted } from "@/lib/analytics";
import { readAttribution } from "@/lib/lenaqar/attribution";
import {
  buyRequestSubmitKey,
  findRepeatSubmit,
  isNewBuyRequestConversion,
  readLastBuyRequestSubmit,
  saveLastBuyRequestSubmit,
} from "@/lib/lenaqar/buy-request-repeat";
import BuyRequestDialog from "./buy-request-dialog";
import MatchLoading from "./match-loading";
import BuyRequestSuccess from "./buy-request-success";
import UnifiedDialog from "@/components/ui/UnifiedDialog";
import {
  loadPublicBuyRequest,
  savePublicBuyRequest,
} from "@/app/(lenaqar)/_actions/buy-request";
import { actionButtonClass } from "@/components/ui/action-button-class";
import {
  clearMatchRef,
  readContactHint,
  readMatchRef,
  writeMatchRef,
} from "@/lib/lenaqar/buy-request-identity";
import ActionButtonArrow from "@/components/ui/action-button-arrow";

let buyRequestHashHandled = false;
let inlineFormViewTracked = false;

/**
 * Window event sent when a CTA opens its own dialog. The homepage onboarding listens so
 * a dialog it planned to open (ad journey) is dropped: one form at a time.
 */
export const BUY_REQUEST_CTA_OPENED_EVENT = "lenaqar:buy-request-cta-opened";

function announceCtaOpened() {
  window.dispatchEvent(new Event(BUY_REQUEST_CTA_OPENED_EVENT));
}

/** localStorage key of the lead id this browser's last buy request was saved under. */
export const BUY_REQUEST_USER_ID_KEY = "lenaqar_buy_request_user_id";

const PUBLIC_OPPORTUNITY_QUERY_KEYS = [
  "city",
  "district",
  "sub_district",
  "bedrooms",
  "min_price",
  "max_price",
  "property_type",
];

function opportunityQueryFromRequirement(requirement) {
  const filters = requirementToUnitsFilter(requirement, SITE.clientId);
  const params = new URLSearchParams();
  for (const key of PUBLIC_OPPORTUNITY_QUERY_KEYS) {
    const value = filters[key];
    if (value == null || value === "") continue;
    params.set(key, String(value));
  }
  if (filters.project_name) params.set("project", String(filters.project_name));
  return params.toString();
}

function browserStorage() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function readStoredUserId() {
  if (typeof window === "undefined") return "";
  try {
    return String(window.localStorage.getItem(BUY_REQUEST_USER_ID_KEY) || "").trim();
  } catch {
    return "";
  }
}

function persistUserId(userId) {
  if (!userId || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(BUY_REQUEST_USER_ID_KEY, userId);
  } catch {
    /* private mode */
  }
}

export default function BuyRequestCta({
  variant = "primary",
  tone = "default",
  size = "default",
  initialValues,
  className = "",
  label,
  // Controlled mode (homepage composer): the parent owns `open`, renders its
  // own trigger, passes a free-text `prefill`, and handles success itself.
  open: controlledOpen,
  onOpenChange,
  hideTrigger = false,
  prefill,
  onSubmitted,
  trackingLocation = "unknown",
  // "inline": the form itself sits in the page (no trigger, no dialog); `className`
  // then styles the form's wrapper.
  presentation = "dialog",
  autoFocus = false,
}) {
  const inline = presentation === "inline";
  const { translate } = useI18n();
  const { trackEvent } = useGoogleAnalytics();
  const router = useRouter();
  const pathname = usePathname();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = typeof controlledOpen === "boolean";
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = useCallback(
    (next) => {
      if (!isControlled) setUncontrolledOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );
  const [userId, setUserId] = useState("");
  const [submitted, setSubmitted] = useState(null);
  // Saving (set by the dialog) and the navigation to the match page (a transition) are
  // one "matching" state for the buyer: the loading screen covers both, and goes away
  // when the save fails or the match page has rendered.
  const [saving, setSaving] = useState(false);
  const [navigating, startNavigation] = useTransition();
  const [contactHint, setContactHint] = useState(null);

  useEffect(() => {
    setUserId(readStoredUserId());
    if (isControlled || inline) return;
    if (buyRequestHashHandled) return;
    if (window.location.hash !== "#buy-request") return;
    // The homepage onboarding owns #buy-request there (ad visitors see it first).
    if (document.querySelector("[data-buy-request-hash-owner]")) return;
    buyRequestHashHandled = true;
    setOpen(true);
    trackEvent(ANALYTICS.EVENTS.BUY_REQUEST_OPENED, { cta_location: trackingLocation });
  }, [trackEvent, isControlled, inline, setOpen, trackingLocation]);

  useEffect(() => {
    setContactHint(
      (open || inline) && userId ? readContactHint(browserStorage(), userId) : null,
    );
  }, [open, inline, userId]);

  // Inline: record the form being shown (once per page view, when about half of it is on
  // screen) — there is no dialog-open event to rely on.
  const viewRef = useRef(null);
  useEffect(() => {
    if (!inline) return undefined;
    const node = viewRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          // Once per page view: replaying the onboarding remounts the form.
          if (!inlineFormViewTracked) {
            inlineFormViewTracked = true;
            trackBuyRequestFormViewed({ location: trackingLocation });
          }
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [inline, trackingLocation]);

  const handleUserId = useCallback((nextId) => {
    const id = String(nextId || "").trim();
    if (!id) return;
    persistUserId(id);
    setUserId(id);
  }, []);

  const loadRequirement = useCallback(
    async (id) => {
      // No saved proof for this request (older visit): start from an empty form.
      const matchRef = readMatchRef(browserStorage(), id);
      if (!matchRef) return null;
      const raw = await loadPublicBuyRequest(id, matchRef);
      if (raw?.error) {
        return { error: translate("lenaqar.buyRequest.loadFailed") };
      }
      // The backend no longer knows this proof: forget it, so the form asks for contact.
      if (!raw) clearMatchRef(browserStorage());
      return raw;
    },
    [translate],
  );

  const saveRequirement = useCallback(
    async (id, payload, extra) => {
      // The buyer is editing a request this browser saved (the server accepts the proof).
      const isEdit = Boolean(id && readMatchRef(browserStorage(), id));

      // The identical submission again within 5 minutes reuses the first result; a
      // changed request (budget, place, ...) is always posted.
      const repeatKey = await buyRequestSubmitKey({
        userId: isEdit ? id : "",
        phone: extra?.contact?.phone,
        name: extra?.contact?.name,
        requirement: payload,
      });
      const repeat = findRepeatSubmit(readLastBuyRequestSubmit(), repeatKey);
      if (repeat) {
        return {
          ok: true,
          userId: repeat.userId,
          matchRef: repeat.matchRef || "",
          repeated: true,
          isEdit,
        };
      }

      const result = await savePublicBuyRequest({
        userId: id,
        // Proof that this browser submitted `id`'s request; without it the backend
        // treats the submit as a new one (matched by phone).
        matchRef: readMatchRef(browserStorage(), id),
        contact: extra?.contact,
        payload,
        notBrokerConfirmed: extra?.notBrokerConfirmed === true,
        attribution: readAttribution(),
      });
      if (!result?.ok) {
        const code = result?.code || "save_failed";
        throw Object.assign(
          new Error(
            translate(
              `lenaqar.buyRequest.errors.${code}`,
              translate("lenaqar.buyRequest.saveFailed"),
            ),
          ),
          { code },
        );
      }
      saveLastBuyRequestSubmit({
        key: repeatKey,
        userId: result.userId,
        matchRef: result.matchRef,
      });
      writeMatchRef(browserStorage(), result.userId, result.matchRef, extra?.contact);
      return { ...result, isEdit };
    },
    [translate],
  );

  return (
    <>
      {hideTrigger || inline ? null : (
        <button
          type="button"
          className={actionButtonClass({ variant, tone, size, className })}
          onClick={() => {
            trackEvent(ANALYTICS.EVENTS.BUY_REQUEST_OPENED, { cta_location: trackingLocation });
            announceCtaOpened();
            setOpen(true);
          }}
        >
          {label || translate("lenaqar.actions.buyUnit", "Buy Unit")}
          <ActionButtonArrow size={size} />
        </button>
      )}
      <div ref={viewRef} className={inline ? className : "contents"}>
      <BuyRequestDialog
        presentation={presentation}
        autoFocusNotes={autoFocus}
        open={inline ? true : open}
        onClose={() => (inline ? undefined : setOpen(false))}
        userId={userId}
        onUserId={handleUserId}
        title={translate("lenaqar.buyRequest.title")}
        submitLabel={translate(
          inline ? "lenaqar.buyRequest.inlineSubmit" : "lenaqar.buyRequest.submit",
        )}
        intro={inline ? undefined : translate("lenaqar.buyRequest.intro")}
        successMessage={translate("lenaqar.buyRequest.saved")}
        showSuccessToast={false}
        onSavingChange={setSaving}
        contactHint={contactHint}
        initialValues={initialValues}
        prefill={prefill}
        showContactFields
        overlayClassName="!z-[70] lq-overlay-in"
        loadRequirement={loadRequirement}
        saveRequirement={saveRequirement}
        onSuccess={(requirement, saveResult) => {
          // Ads conversion: Lead = successful buyer request (no PII in payload).
          // A repeat of the same phone is not a second conversion.
          // An edit of a saved request is not a new lead either.
          if (isNewBuyRequestConversion(saveResult || {})) {
            trackBuyRequestSubmitted({ location: trackingLocation, city: requirement?.city });
          }
          const qs = opportunityQueryFromRequirement({
            ...requirement,
            purpose: "buy",
          });
          const href = qs ? `/opportunities?${qs}` : "/opportunities";
          const matchRef = saveResult?.matchRef || "";
          if (matchRef) {
            // Straight to the units that match what the buyer just sent. A request
            // edited from that page keeps its reference, so the same URL is re-read.
            // One navigation only: a `router.refresh()` right after `router.push()`
            // wins in a production build and leaves the buyer on the page they came
            // from. The match page is dynamic, so a push already reads it fresh;
            // from that same page (an edited request) a refresh re-reads it.
            const target = `/requests/match/${matchRef}`;
            // In a transition, so the loading screen stays up until the page has rendered.
            startNavigation(() => {
              if (pathname === target) router.refresh();
              else router.push(target);
            });
            return;
          }
          // No reference (an older backend): the success screen, as before.
          toast.success(translate("lenaqar.buyRequest.saved"));
          if (onSubmitted) {
            onSubmitted({ requirement, opportunitiesHref: href, matchRef });
            return;
          }
          // No parent success screen (header / page CTAs): show it here.
          setSubmitted({ requirement, opportunitiesHref: href, matchRef });
        }}
      />
      </div>
      {saving || navigating ? <MatchLoading modal /> : null}
      <UnifiedDialog
        isOpen={Boolean(submitted)}
        onClose={() => setSubmitted(null)}
        title={translate("lenaqar.onboarding.successTitle")}
        cancelLabel={translate("lenaqar.onboarding.successClose")}
        closeOnEscape
        closeOnOutsideClick
        overlayClassName="!z-[70]"
        dialogClassName="max-w-lg"
      >
        {submitted ? (
          <BuyRequestSuccess
            requirement={submitted.requirement}
            opportunitiesHref={submitted.opportunitiesHref}
            matchRef={submitted.matchRef}
            trackingLocation={`${trackingLocation}_success`}
            showTitle={false}
          />
        ) : null}
      </UnifiedDialog>
    </>
  );
}
