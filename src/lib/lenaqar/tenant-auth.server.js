/**
 * Server-only LenaQar tenant login for reading CRM-scoped public marketplace data.
 * Credentials never reach the browser. Prefer LENAQAR_CLIENT_* over legacy CLIENT/PASSWORD.
 */
import { API_BASE_URL, PUBLIC_X_API_KEY } from "@/lib/apiConfig";
import { bffFetch, isCloudflareChallenge } from "@/lib/bffFetch";
import {
  decodeJwtExp,
  extractAuthTokens,
} from "@/lib/jwtCookieUtils";
import { SITE } from "@/config/site";

const REFRESH_SKEW_MS = 60_000;

/** @type {{ accessToken: string | null, expMs: number }} */
let cached = { accessToken: null, expMs: 0 };

function readEnv(name) {
  return String(process.env[name] || "").trim();
}

export function getLenaqarTenantCredentials() {
  const username =
    readEnv("LENAQAR_CLIENT_EMAIL") || readEnv("CLIENT");
  const password =
    readEnv("LENAQAR_CLIENT_PASSWORD") || readEnv("PASSWORD");
  return { username, password };
}

export function hasLenaqarTenantCredentials() {
  const { username, password } = getLenaqarTenantCredentials();
  return Boolean(username && password);
}

/**
 * @returns {Promise<string | null>} Bearer access token scoped to the LenaQar tenant
 */
export async function getLenaqarTenantAccessToken() {
  const now = Date.now();
  if (cached.accessToken && cached.expMs - REFRESH_SKEW_MS > now) {
    return cached.accessToken;
  }

  const { username, password } = getLenaqarTenantCredentials();
  if (!username || !password) {
    console.error(
      "[lenaqar] tenant credentials missing — set LENAQAR_CLIENT_EMAIL / LENAQAR_CLIENT_PASSWORD",
    );
    return null;
  }

  const body = new URLSearchParams({
    username,
    password,
  });

  try {
    const headers = {
      accept: "application/json",
      "content-type": "application/x-www-form-urlencoded",
    };
    if (PUBLIC_X_API_KEY) headers["X-API-Key"] = PUBLIC_X_API_KEY;

    const response = await bffFetch(`${API_BASE_URL}/client/login`, {
      method: "POST",
      headers,
      body,
      next: { revalidate: 0 },
    });

    const text = await response.text().catch(() => "");
    if (!response.ok) {
      const cf = isCloudflareChallenge(response, text);
      console.error(
        "[lenaqar] tenant login failed",
        response.status,
        cf ? "(Cloudflare challenge)" : "",
      );
      cached = { accessToken: null, expMs: 0 };
      return null;
    }

    let json;
    try {
      json = JSON.parse(text);
    } catch {
      console.error("[lenaqar] tenant login returned non-JSON");
      return null;
    }

    const { accessToken } = extractAuthTokens(json);
    if (!accessToken) {
      console.error("[lenaqar] tenant login missing access_token");
      return null;
    }

    const data =
      json?.data && typeof json.data === "object" ? json.data : json;
    const clientId = String(data?.client_id || data?.user?.client_id || "")
      .trim()
      .toLowerCase();
    if (clientId && clientId !== String(SITE.clientId).toLowerCase()) {
      console.error(
        "[lenaqar] tenant login client_id mismatch — refusing marketplace fetch",
        clientId,
      );
      return null;
    }

    const expSec = decodeJwtExp(accessToken);
    const expMs = expSec
      ? expSec * 1000
      : now + Number(data?.expires_in || 3600) * 1000;

    cached = { accessToken, expMs };
    return accessToken;
  } catch (error) {
    console.error("[lenaqar] tenant login error", error);
    cached = { accessToken: null, expMs: 0 };
    return null;
  }
}
