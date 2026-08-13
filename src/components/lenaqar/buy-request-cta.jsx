"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/hooks/useI18n";
import { useGoogleAnalytics } from "@/hooks/useGoogleAnalytics";
import { ANALYTICS } from "@/constants/analytics";
import { SITE } from "@/config/site";
import { requirementToUnitsFilter } from "@/lib/match/requirement-to-units-filter";
import EditRequirementDialog from "@/app/(admin)/dashboard/_components/split-view/EditRequirementDialog";
import {
  loadPublicBuyRequest,
  savePublicBuyRequest,
} from "@/app/(lenaqar)/_actions/buy-request";

const STORAGE_KEY = "lenaqar_buy_request_user_id";

const PUBLIC_OPPORTUNITY_QUERY_KEYS = [
  "city",
  "district",
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
  return params.toString();
}

function readStoredUserId() {
  if (typeof window === "undefined") return "";
  try {
    return String(window.localStorage.getItem(STORAGE_KEY) || "").trim();
  } catch {
    return "";
  }
}

function persistUserId(userId) {
  if (!userId || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, userId);
  } catch {
    /* private mode */
  }
}

export default function BuyRequestCta({
  variant = "primary",
  initialValues,
  className = "",
  label,
  autoOpenHash = false,
}) {
  const { translate } = useI18n();
  const { trackEvent } = useGoogleAnalytics();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState("");

  useEffect(() => {
    setUserId(readStoredUserId());
    if (
      autoOpenHash &&
      typeof window !== "undefined" &&
      window.location.hash === "#buy-request"
    ) {
      setOpen(true);
      trackEvent(ANALYTICS.EVENTS.BUY_REQUEST_OPENED);
    }
  }, [autoOpenHash, trackEvent]);

  const handleUserId = useCallback((nextId) => {
    const id = String(nextId || "").trim();
    if (!id) return;
    persistUserId(id);
    setUserId(id);
  }, []);

  const loadRequirement = useCallback(
    async (id) => {
      const raw = await loadPublicBuyRequest(id);
      if (raw?.error) {
        return { error: translate("lenaqar.buyRequest.loadFailed") };
      }
      return raw;
    },
    [translate],
  );

  const saveRequirement = useCallback(
    async (id, payload, extra) => {
      const result = await savePublicBuyRequest({
        userId: id,
        contact: extra?.contact,
        payload,
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
      return result;
    },
    [translate],
  );

  const buttonClass =
    variant === "secondary"
      ? "inline-flex items-center justify-center rounded-md border border-primary text-primary font-medium px-4 py-3 text-sm"
      : "inline-flex items-center justify-center rounded-md bg-primary text-white font-medium px-4 py-3 text-sm";

  return (
    <>
      <button
        type="button"
        className={`${buttonClass} ${className}`}
        onClick={() => {
          trackEvent(ANALYTICS.EVENTS.BUY_REQUEST_OPENED);
          setOpen(true);
        }}
      >
        {label || translate("lenaqar.actions.buyRequest")}
      </button>
      <EditRequirementDialog
        open={open}
        onClose={() => setOpen(false)}
        userId={userId}
        onUserId={handleUserId}
        clientId={SITE.clientId}
        title={translate("lenaqar.buyRequest.title")}
        submitLabel={translate("lenaqar.buyRequest.submit")}
        intro={translate("lenaqar.buyRequest.intro")}
        successMessage={translate("lenaqar.buyRequest.saved")}
        defaultPurpose="buy"
        initialValues={{ purpose: "buy", ...(initialValues || {}) }}
        showContactFields={!userId}
        fetchProjects={false}
        overlayClassName="!z-[70]"
        loadRequirement={loadRequirement}
        saveRequirement={saveRequirement}
        onSuccess={(requirement) => {
          trackEvent(ANALYTICS.EVENTS.BUY_REQUEST_SUBMITTED);
          const qs = opportunityQueryFromRequirement(requirement);
          router.push(qs ? `/opportunities?${qs}` : "/opportunities");
        }}
      />
    </>
  );
}
