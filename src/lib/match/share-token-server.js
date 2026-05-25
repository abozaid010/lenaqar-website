import crypto from "crypto";

const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function getSecret() {
  return (
    process.env.MATCH_SHARE_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "lena-match-share-dev-secret"
  );
}

function base64UrlEncode(buf) {
  return Buffer.from(buf)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlDecode(str) {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  return Buffer.from(padded + pad, "base64");
}

/**
 * Create opaque signed share token (BFF fallback when backend share API unavailable).
 */
export function signMatchSharePayload(payload, ttlMs = DEFAULT_TTL_MS) {
  const envelope = {
    ...payload,
    exp: Date.now() + ttlMs,
  };
  const body = base64UrlEncode(Buffer.from(JSON.stringify(envelope), "utf8"));
  const sig = crypto
    .createHmac("sha256", getSecret())
    .update(body)
    .digest();
  return `${body}.${base64UrlEncode(sig)}`;
}

export function verifyMatchShareToken(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  const expected = crypto.createHmac("sha256", getSecret()).update(body).digest();
  const actual = base64UrlDecode(sig);
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) {
    return null;
  }
  try {
    const json = JSON.parse(base64UrlDecode(body).toString("utf8"));
    if (!json?.exp || Date.now() > json.exp) return null;
    return json;
  } catch {
    return null;
  }
}

/** In-memory reaction/viewing store keyed by token (BFF fallback). */
const interactionStore = new Map();

export function getMatchInteractions(token) {
  return interactionStore.get(token) || { likedUnitIds: [], viewingRequests: [] };
}

export function setUnitReaction(token, unitId, liked) {
  const current = getMatchInteractions(token);
  const set = new Set(current.likedUnitIds || []);
  if (liked) set.add(unitId);
  else set.delete(unitId);
  const next = { ...current, likedUnitIds: [...set] };
  interactionStore.set(token, next);
  return next;
}

export function addViewingRequest(token, payload) {
  const current = getMatchInteractions(token);
  const next = {
    ...current,
    viewingRequests: [...(current.viewingRequests || []), payload],
  };
  interactionStore.set(token, next);
  return next;
}
