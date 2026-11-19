import axiosInstance from "@/utils/axiosInstance";
import {
  buildPublicBuyRequirement,
  formFromBuiltRequirement,
} from "@/lib/lenaqar/buy-request-payload";
import { sanitizeAttribution } from "@/lib/lenaqar/attribution";
import { publicErrorCode } from "@/lib/lenaqar/buy-request-errors";
import { normalizeMatchRef } from "@/lib/lenaqar/whatsapp-intent";

function apiMessage(error, fallback) {
  return (
    error?.response?.data?.detail ||
    error?.response?.data?.error_message ||
    error?.response?.data?.message ||
    fallback
  );
}

function toPublicError(error, fallbackCode) {
  const code = publicErrorCode(error, fallbackCode);
  const next = new Error(code);
  next.code = code;
  return next;
}

/**
 * Load the caller's own submitted buy request (form fields only) via
 * /public/v1/buy-request/{user_id}. The backend requires the request's matchRef
 * (X-Match-Ref) as proof of ownership; without it there is nothing to load.
 */
export async function loadBuyRequestRequirement(userId, matchRef) {
  if (!userId || !matchRef) return null;
  try {
    const response = await axiosInstance.get(
      `/public/v1/buy-request/${encodeURIComponent(userId)}`,
      { headers: { "X-Match-Ref": String(matchRef) } },
    );
    const data = response.data?.data;
    if (!data || typeof data !== "object") return null;
    return data;
  } catch (error) {
    const status = error?.response?.status;
    if (status === 404) return null;
    console.error(
      "[lenaqar] load buy request failed",
      status || apiMessage(error, error?.message),
    );
    throw toPublicError(error, "load_failed");
  }
}

/**
 * Persist a public buy request via the anonymous, API-key-only
 * /public/v1/buy-request/submit route — no login needed. The backend
 * creates the lead (when new) and upserts the requirement on it, always
 * forcing identity server-side (client_id, platform, campaign_id).
 */
export async function saveBuyRequestRequirement({
  userId,
  matchRef,
  contact,
  payload,
  attribution,
}) {
  const id = typeof userId === "string" ? userId.trim() : "";
  const name = String(contact?.name || "").trim();
  const phone = String(contact?.phone || "").trim();
  if (!id && (!name || !phone)) {
    const error = new Error("contact_required");
    error.code = "contact_required";
    throw error;
  }

  const built = buildPublicBuyRequirement(formFromBuiltRequirement(payload));
  if (!built.ok) {
    const error = new Error("validation_failed");
    error.code = "validation_failed";
    throw error;
  }

  // With a place list, the flat fields only repeat its first entry: sending both
  // would have the backend fold that place in a second time.
  const requirement = { ...built.requirement };
  if (Array.isArray(requirement.preferred_locations) && requirement.preferred_locations.length) {
    delete requirement.city;
    delete requirement.district;
    delete requirement.sub_district;
    delete requirement.project;
  }

  // Ad attribution (utm_* / lead_code): whitelisted here too, sent only when present.
  const ad = sanitizeAttribution(attribution);

  try {
    const response = await axiosInstance.post("/public/v1/buy-request/submit", {
      user_id: id || undefined,
      // The backend updates `id`'s request only with its match reference.
      match_ref: id && matchRef ? String(matchRef) : undefined,
      // Always forward contact when present so the backend can create a
      // dashboard buyer lead if the stored user_id has no dashboard row yet.
      name: name || undefined,
      phone: phone || undefined,
      // Backend attribution: when source === lenaaqar_forum, ensure a dashboard
      // buyer lead exists (name, phone, last_action=new) before saving the requirement.
      source: "lenaaqar_forum",
      requirement,
      attribution: Object.keys(ad).length > 0 ? ad : undefined,
    });
    const savedUserId = String(response.data?.data?.user_id || id || "").trim();
    // Reference for the WhatsApp "send my matching units" message; "" on an older backend.
    const savedMatchRef = normalizeMatchRef(response.data?.data?.match_ref);
    return { userId: savedUserId, matchRef: savedMatchRef };
  } catch (error) {
    console.error(
      "[lenaqar] save buy request requirement failed",
      error?.response?.status || apiMessage(error, error?.message),
    );
    throw toPublicError(error, "save_failed");
  }
}

const UNIT_CODE = /^[A-Za-z0-9_-]{1,32}$/;
const INTEREST_CHANNELS = new Set(["whatsapp", "call"]);

/**
 * Tell the backend the buyer tapped WhatsApp or Call on a unit of their match
 * page: it records the unit on their request and alerts the team. Best effort —
 * returns false instead of throwing, the tap itself must never wait on it.
 */
export async function recordMatchUnitInterest({ matchRef, unitCode, channel }) {
  const ref = normalizeMatchRef(matchRef);
  const code = typeof unitCode === "string" ? unitCode.trim() : "";
  if (!ref || !UNIT_CODE.test(code) || !INTEREST_CHANNELS.has(channel)) return false;
  try {
    await axiosInstance.post(`/public/v1/buy-request/match/${ref}/interest`, {
      unit_code: code,
      channel,
    });
    return true;
  } catch (error) {
    console.error(
      "[lenaqar] record unit interest failed",
      error?.response?.status || error?.code || "error",
    );
    return false;
  }
}
