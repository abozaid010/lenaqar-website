/**
 * Server-only: GET /client/v1/profile with cookies (Bearer + optional x-client-id).
 * Do not use client axios/js-cookie here — RSC has no access token otherwise.
 */

import { createHash } from "node:crypto";

import { cookies } from "next/headers";
import { COOKIE_KEYS } from "@/constants/cookieKeys";
import { API_BASE_URL } from "@/lib/apiConfig";

/** Dedupe concurrent profile fetches (same token + client) across parallel RSC work. */
const inflightProfileFetches = new Map();

/** Short-lived memo for identical principals (reduces duplicate GETs on rapid navigations / dev). */
const profileShortCache = new Map();
const PROFILE_CACHE_MS = 2500;

function inflightKey(token, clientId) {
  return createHash("sha256")
    .update(String(clientId ?? ""))
    .update("|")
    .update(token)
    .digest("hex");
}

function decodeBase64UrlToString(base64Url) {
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");

  if (typeof atob === "function") return atob(padded);
  // eslint-disable-next-line no-undef
  return Buffer.from(padded, "base64").toString("utf8");
}

function decodeJwtPayload(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const json = decodeBase64UrlToString(parts[1]);
    const payload = JSON.parse(json);
    return typeof payload === "object" && payload !== null ? payload : null;
  } catch {
    return null;
  }
}

const PROFILE_PATH = "/client/v1/profile";

/**
 * @returns {Promise<object|null>} Parsed JSON body, or null if unauthenticated / non-OK.
 */
export async function fetchClientProfileFromCookies() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_KEYS.ACCESS_TOKEN)?.value;
  if (!token) return null;

  const payload = decodeJwtPayload(token);
  const clientId =
    payload?.client_id != null && typeof payload.client_id === "string"
      ? payload.client_id
      : null;

  const key = inflightKey(token, clientId);

  const cached = profileShortCache.get(key);
  if (cached && Date.now() - cached.at < PROFILE_CACHE_MS) {
    return cached.value;
  }

  const existing = inflightProfileFetches.get(key);
  if (existing) return existing;

  /** Register in-flight synchronously before any `await` (prevents duplicate parallel fetches). */
  let resolvePromise;
  const promise = new Promise((resolve) => {
    resolvePromise = resolve;
  });
  inflightProfileFetches.set(key, promise);

  void (async () => {
    const startedAt = Date.now();
    const headers = {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    };
    if (clientId) {
      headers["x-client-id"] = clientId;
    }

    try {
      const url = `${API_BASE_URL.replace(/\/$/, "")}${PROFILE_PATH}`;
      const res = await fetch(url, {
        method: "GET",
        headers,
        cache: "no-store",
      });
      const ms = Date.now() - startedAt;
      if (!res.ok) {
        if (process.env.NODE_ENV === "development") {
          console.warn(
            `[auth][profile] GET ${PROFILE_PATH} → ${res.status} ${ms}ms clientId=${clientId ?? "none"} (non_ok)`
          );
        }
        resolvePromise(null);
        return;
      }

      const json = await res.json();
      if (json) {
        profileShortCache.set(key, { at: Date.now(), value: json });
      }
      if (process.env.NODE_ENV === "development") {
        const ma = json?.data?.module_actions;
        const moduleKeys =
          ma && typeof ma === "object" && !Array.isArray(ma)
            ? Object.keys(ma).sort().join(",")
            : "";
        console.log(
          `[auth][profile] GET ${PROFILE_PATH} → ${res.status} ${ms}ms clientId=${clientId ?? "none"} modules=${moduleKeys || "none"}`
        );
      }
      resolvePromise(json);
    } catch {
      const ms = Date.now() - startedAt;
      if (process.env.NODE_ENV === "development") {
        console.error(
          `[auth][profile] GET ${PROFILE_PATH} → error ${ms}ms clientId=${clientId ?? "none"}`
        );
      }
      resolvePromise(null);
    } finally {
      inflightProfileFetches.delete(key);
    }
  })();

  return promise;
}
