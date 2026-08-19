import { bffFetch } from "@/lib/bffFetch";
import { API_BASE_URL, PUBLIC_X_API_KEY } from "@/lib/apiConfig";
import { SITE } from "@/config/site";
import { buildSaleUnitPayload } from "@/lib/lenaqar/sale-unit-payload";

function toApiError(status) {
  const error = new Error("add_sale_failed");
  error.code = status === 429 ? "rate_limited" : "save_failed";
  return error;
}

/**
 * Submit a public sell-unit request. Always lands as pending_approval under
 * the LenaQar tenant (backend-forced) — this never publishes directly.
 */
export async function submitPublicSaleUnit(formValues) {
  const payload = buildSaleUnitPayload(formValues);

  const headers = { "Content-Type": "application/json", Accept: "application/json" };
  if (PUBLIC_X_API_KEY) headers["X-API-Key"] = PUBLIC_X_API_KEY;

  let response;
  try {
    response = await bffFetch(`${API_BASE_URL}/units/public/v1/add-sale`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("[lenaqar] add-sale network error", error?.message);
    throw toApiError(0);
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    console.error(
      "[lenaqar] add-sale failed",
      response.status,
      body?.error_message || body?.detail,
    );
    throw toApiError(response.status);
  }

  const body = await response.json().catch(() => null);
  if (body?.status === false) {
    throw toApiError(422);
  }

  return { unitId: body?.data?.unit_id || null, clientId: SITE.clientId };
}
