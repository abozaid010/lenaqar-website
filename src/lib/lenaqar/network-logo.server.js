/**
 * Upload a company logo for Lena Network signup via the existing GCS pipeline.
 * Uses API-key / BFF egress only — no CRM service-account password.
 * client_id is forced server-side to the LenaQar tenant.
 */
import { bffFetch, isCloudflareChallenge } from "@/lib/bffFetch";
import { API_BASE_URL, PUBLIC_X_API_KEY } from "@/lib/apiConfig";
import { SITE } from "@/config/site";
import {
  NETWORK_LOGO_MAX_BYTES,
  NETWORK_LOGO_MIME_TYPES,
} from "@/lib/lenaqar/network-logo";

function pickLogoUrl(body) {
  if (!body || typeof body !== "object") return "";
  const root = /** @type {Record<string, unknown>} */ (body);
  const nested =
    root.data && typeof root.data === "object" && !Array.isArray(root.data)
      ? /** @type {Record<string, unknown>} */ (root.data)
      : root;
  const url =
    (typeof nested.url === "string" && nested.url) ||
    (typeof nested.logo_url === "string" && nested.logo_url) ||
    (typeof nested.image_url === "string" && nested.image_url) ||
    "";
  return url.trim();
}

/**
 * @param {File} file
 * @returns {Promise<{ ok: true, url: string } | { ok: false, code: string }>}
 */
export async function uploadNetworkLogo(file) {
  if (!file || typeof file.arrayBuffer !== "function") {
    return { ok: false, code: "logoInvalid" };
  }
  if (!NETWORK_LOGO_MIME_TYPES.has(file.type)) {
    return { ok: false, code: "logoType" };
  }
  if (file.size > NETWORK_LOGO_MAX_BYTES) {
    return { ok: false, code: "logoTooLarge" };
  }

  const storageForm = new FormData();
  storageForm.append("file", file, file.name || "logo.webp");

  const headers = {};
  if (PUBLIC_X_API_KEY) headers["X-API-Key"] = PUBLIC_X_API_KEY;

  let response;
  try {
    response = await bffFetch(
      `${API_BASE_URL}/gcs/upload?client_id=${encodeURIComponent(SITE.clientId)}`,
      {
        method: "POST",
        headers,
        body: storageForm,
        signal: AbortSignal.timeout(30_000),
      },
    );
  } catch (error) {
    console.error("[lenaqar] network logo upload network error", error?.message);
    return { ok: false, code: "logoFailed" };
  }

  const text = await response.text().catch(() => "");
  if (isCloudflareChallenge(response, text)) {
    console.error("[lenaqar] network logo upload blocked by Cloudflare challenge");
    return { ok: false, code: "logoFailed" };
  }

  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }

  if (!response.ok) {
    console.error("[lenaqar] network logo upload failed", response.status);
    return { ok: false, code: "logoFailed" };
  }

  const url = pickLogoUrl(body);
  if (!url) {
    console.error("[lenaqar] network logo upload missing url");
    return { ok: false, code: "logoFailed" };
  }

  return { ok: true, url };
}
