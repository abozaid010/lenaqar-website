"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useI18n } from "@/hooks/useI18n";
import { useGoogleAnalytics } from "@/hooks/useGoogleAnalytics";
import { ANALYTICS } from "@/constants/analytics";
import { SITE } from "@/config/site";
import { requirementToUnitsFilter } from "@/lib/match/requirement-to-units-filter";
import { trackBuyRequestSubmitted } from "@/lib/analytics";
import { readAttribution } from "@/lib/lenaqar/attribution";
import {
  buyRequestRepeatKey,
  findRepeatSubmit,
  readLastBuyRequestSubmit,
  saveLastBuyRequestSubmit,
} from "@/lib/lenaqar/buy-request-repeat";
import BuyRequestDialog from "./buy-request-dialog";
import BuyRequestSuccess from "./buy-request-success";
import UnifiedDialog from "@/components/ui/UnifiedDialog";
import {
  loadPublicBuyRequest,
  savePublicBuyRequest,
} from "@/app/(lenaqar)/_actions/buy-request";
import { actionButtonClass } from "@/components/ui/action-button-class";
import { readMatchRef, writeMatchRef } from "@/lib/lenaqar/buy-request-identity";
import ActionButtonArrow from "@/components/ui/action-button-arrow";

let buyRequestHashHandled = false;

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
}) {
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

  useEffect(() => {
    setUserId(readStoredUserId());
    if (isControlled) return;
    if (buyRequestHashHandled) return;
    if (window.location.hash !== "#buy-request") return;
    buyRequestHashHandled = true;
    setOpen(true);
    trackEvent(ANALYTICS.EVENTS.BUY_REQUEST_OPENED, { cta_location: trackingLocation });
  }, [trackEvent, isControlled, setOpen, trackingLocation]);

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
      return raw;
    },
    [translate],
  );

  const saveRequirement = useCallback(
    async (id, payload, extra) => {
      // Same phone again within 5 minutes: reuse the first result, no second post.
      const repeatKey = await buyRequestRepeatKey(extra?.contact?.phone);
      const repeat = findRepeatSubmit(readLastBuyRequestSubmit(), repeatKey);
      if (repeat) {
        return {
          ok: true,
          userId: repeat.userId,
          matchRef: repeat.matchRef || "",
          repeated: true,
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
        throw new Error(
          translate(
            `lenaqar.buyRequest.errors.${code}`,
            translate("lenaqar.buyRequest.saveFailed"),
          ),
        );
      }
      saveLastBuyRequestSubmit({
        key: repeatKey,
        userId: result.userId,
        matchRef: result.matchRef,
      });
      writeMatchRef(browserStorage(), result.userId, result.matchRef);
      return result;
    },
    [translate],
  );

  return (
    <>
      {hideTrigger ? null : (
        <button
          type="button"
          className={actionButtonClass({ variant, tone, size, className })}
          onClick={() => {
            trackEvent(ANALYTICS.EVENTS.BUY_REQUEST_OPENED, { cta_location: trackingLocation });
            setOpen(true);
          }}
        >
          {label || translate("lenaqar.actions.buyUnit", "Buy Unit")}
          <ActionButtonArrow size={size} />
        </button>
      )}
      <BuyRequestDialog
        open={open}
        onClose={() => setOpen(false)}
        userId={userId}
        onUserId={handleUserId}
        title={translate("lenaqar.buyRequest.title")}
        submitLabel={translate("lenaqar.buyRequest.submit")}
        intro={translate("lenaqar.buyRequest.intro")}
        successMessage={translate("lenaqar.buyRequest.saved")}
        initialValues={initialValues}
        prefill={prefill}
        showContactFields
        overlayClassName="!z-[70]"
        loadRequirement={loadRequirement}
        saveRequirement={saveRequirement}
        onSuccess={(requirement, saveResult) => {
          // Ads conversion: Lead = successful buyer request (no PII in payload).
          // A repeat of the same phone is not a second conversion.
          if (!saveResult?.repeated) {
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
            if (pathname === target) router.refresh();
            else router.push(target);
            return;
          }
          // No reference (an older backend): the success screen, as before.
          if (onSubmitted) {
            onSubmitted({ requirement, opportunitiesHref: href, matchRef });
            return;
          }
          // No parent success screen (header / page CTAs): show it here.
          setSubmitted({ requirement, opportunitiesHref: href, matchRef });
        }}
      />
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
