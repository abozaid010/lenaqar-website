/**
 * Server-only Lena Network broker signup/login against the existing API contract.
 * Does not create a session after signup — new clients are inactive until approved.
 *
 * Security: never forward browser-supplied `client_id` / `is_active`. The server
 * action may attach a fresh UUID `client_id` and `is_active: false` for older API
 * deployments that still require `client_id` and default `is_active` to true.
 * Once the backend ignores those fields on /client/signup, they remain harmless.
 */
import { randomUUID } from "crypto";
import { bffFetch, isCloudflareChallenge } from "@/lib/bffFetch";
import { API_BASE_URL, PUBLIC_X_API_KEY } from "@/lib/apiConfig";
import { buildNetworkSignupPayload } from "@/lib/lenaqar/network-signup-payload";
import {
  extractApiErrorText,
  mapNetworkLoginStatus,
  mapNetworkSignupStatus,
} from "@/lib/lenaqar/network-auth-errors";

function jsonHeaders() {
  const headers = {
    accept: "application/json",
    "content-type": "application/json",
  };
  if (PUBLIC_X_API_KEY) headers["X-API-Key"] = PUBLIC_X_API_KEY;
  return headers;
}

function formHeaders() {
  const headers = {
    accept: "application/json",
    "content-type": "application/x-www-form-urlencoded",
  };
  if (PUBLIC_X_API_KEY) headers["X-API-Key"] = PUBLIC_X_API_KEY;
  return headers;
}

/**
 * @param {Record<string, unknown>} input
 * @returns {Promise<{ ok: true } | { ok: false, code: string, errors?: Record<string, string> }>}
 */
export async function signupNetworkClient(input) {
  const built = buildNetworkSignupPayload(input);
  if (!built.ok) {
    return { ok: false, code: "validation_failed", errors: built.errors };
  }

  // Production OpenAPI still requires client_id and defaults is_active=true.
  // Generate both server-side only — never accept them from the browser form.
  const payload = {
    ...built.payload,
    client_id: randomUUID(),
    is_active: false,
  };

  let response;
  try {
    response = await bffFetch(`${API_BASE_URL}/client/signup`, {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("[lenaqar] network signup network error", error?.message);
    return { ok: false, code: "save_failed" };
  }

  const text = await response.text().catch(() => "");
  if (isCloudflareChallenge(response, text)) {
    console.error("[lenaqar] network signup blocked by Cloudflare challenge");
    return { ok: false, code: "save_failed" };
  }

  if (!response.ok) {
    let body = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = null;
    }
    const message = extractApiErrorText(body) || text;
    const code = mapNetworkSignupStatus(response.status, message);
    console.error("[lenaqar] network signup failed", response.status, code);
    return { ok: false, code };
  }

  return { ok: true };
}

/**
 * @param {{ email: string, password: string }} credentials
 * @returns {Promise<{ ok: true } | { ok: false, code: string }>}
 */
export async function loginNetworkClient({ email, password }) {
  const username = String(email || "").trim();
  const secret = String(password || "");
  if (!username || !secret) {
    return { ok: false, code: "invalid_credentials" };
  }

  const body = new URLSearchParams({
    grant_type: "password",
    username,
    password: secret,
  });

  let response;
  try {
    response = await bffFetch(`${API_BASE_URL}/client/login`, {
      method: "POST",
      headers: formHeaders(),
      body,
    });
  } catch (error) {
    console.error("[lenaqar] network login network error", error?.message);
    return { ok: false, code: "failed" };
  }

  const text = await response.text().catch(() => "");
  if (isCloudflareChallenge(response, text)) {
    console.error("[lenaqar] network login blocked by Cloudflare challenge");
    return { ok: false, code: "failed" };
  }

  if (!response.ok) {
    let parsed = null;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      parsed = null;
    }
    const message = extractApiErrorText(parsed) || text;
    const code = mapNetworkLoginStatus(response.status, message);
    if (code === "failed") {
      console.error("[lenaqar] network login failed", response.status);
    }
    return { ok: false, code };
  }

  return { ok: true };
}
