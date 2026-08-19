import axiosInstance from "@/utils/axiosInstance";
import { buildPublicBuyRequirement } from "@/lib/lenaqar/buy-request-payload";

function apiMessage(error, fallback) {
  return (
    error?.response?.data?.detail ||
    error?.response?.data?.error_message ||
    error?.response?.data?.message ||
    fallback
  );
}

function toPublicError(error, fallbackCode) {
  const status = error?.response?.status;
  const next = new Error(fallbackCode);
  next.code = status === 429 ? "rate_limited" : fallbackCode;
  return next;
}

/**
 * Load a previously-submitted public buy request via the anonymous,
 * API-key-only /public/v1/buy-request/{user_id} route — no login needed.
 */
export async function loadBuyRequestRequirement(userId) {
  if (!userId) return null;
  try {
    const response = await axiosInstance.get(
      `/public/v1/buy-request/${encodeURIComponent(userId)}`,
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
export async function saveBuyRequestRequirement({ userId, contact, payload }) {
  const id = typeof userId === "string" ? userId.trim() : "";
  const name = String(contact?.name || "").trim();
  const phone = String(contact?.phone || "").trim();
  if (!id && (!name || !phone)) {
    const error = new Error("contact_required");
    error.code = "contact_required";
    throw error;
  }

  const built = buildPublicBuyRequirement(payload);
  if (!built.ok) {
    const error = new Error("validation_failed");
    error.code = "validation_failed";
    throw error;
  }

  try {
    const response = await axiosInstance.post("/public/v1/buy-request/submit", {
      user_id: id || undefined,
      name: id ? undefined : name,
      phone: id ? undefined : phone,
      requirement: built.requirement,
    });
    const savedUserId = String(response.data?.data?.user_id || id || "").trim();
    return { userId: savedUserId };
  } catch (error) {
    console.error(
      "[lenaqar] save buy request requirement failed",
      error?.response?.status || apiMessage(error, error?.message),
    );
    throw toPublicError(error, "save_failed");
  }
}
