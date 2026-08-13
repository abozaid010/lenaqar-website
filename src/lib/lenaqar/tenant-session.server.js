import { bffFetch } from "@/lib/bffFetch";
import { API_BASE_URL, PUBLIC_X_API_KEY } from "@/lib/apiConfig";
import {
  decodeJwtClientId,
  decodeJwtExp,
  extractAuthTokens,
} from "@/lib/jwtCookieUtils";
import { SITE } from "@/config/site";

/** In-memory tenant token — never written to visitor cookies. */
let cached = {
  accessToken: null,
  clientId: null,
  exp: 0,
};

function readEnv(name) {
  return String(process.env[name] || "").trim();
}

/**
 * Access token for the LenaQar CRM tenant (LENAQAR_CLIENT_EMAIL / PASSWORD).
 * Used only on the server so public visitors can create a lead + requirement
 * without becoming the tenant admin.
 */
export async function getLenaqarTenantSession() {
  const now = Math.floor(Date.now() / 1000);
  if (cached.accessToken && cached.exp - 60 > now) {
    return {
      accessToken: cached.accessToken,
      clientId: cached.clientId || SITE.clientId || "lenaqar",
    };
  }

  const email = readEnv("LENAQAR_CLIENT_EMAIL");
  const password = readEnv("LENAQAR_CLIENT_PASSWORD");
  if (!email || !password) {
    const error = new Error("tenant_credentials_missing");
    error.code = "tenant_credentials_missing";
    throw error;
  }

  const params = new URLSearchParams();
  params.append("grant_type", "password");
  params.append("username", email);
  params.append("password", password);

  const headers = {
    Accept: "application/json",
    "Content-Type": "application/x-www-form-urlencoded",
  };
  if (PUBLIC_X_API_KEY) headers["X-API-Key"] = PUBLIC_X_API_KEY;

  const loginResponse = await bffFetch(`${API_BASE_URL}/client/login`, {
    method: "POST",
    headers,
    body: params,
  });
  const response = await loginResponse.json().catch(() => null);
  const { accessToken } = extractAuthTokens(response);
  if (!loginResponse.ok || !accessToken) {
    const error = new Error("tenant_login_failed");
    error.code = "tenant_login_failed";
    throw error;
  }

  const nested =
    response.data && typeof response.data === "object" ? response.data : response;
  const userData = nested.user && typeof nested.user === "object" ? nested.user : nested;
  const clientId =
    String(
      nested.client_id || userData.client_id || response.client_id || "",
    ).trim() ||
    decodeJwtClientId(accessToken) ||
    SITE.clientId ||
    "lenaqar";
  const exp = decodeJwtExp(accessToken) || now + 50 * 60;

  cached = { accessToken, clientId, exp };
  return { accessToken, clientId };
}

export function tenantAuthConfig(accessToken) {
  return { headers: { Authorization: `Bearer ${accessToken}` } };
}
