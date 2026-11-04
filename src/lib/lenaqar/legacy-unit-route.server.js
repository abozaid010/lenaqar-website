import { API_BASE_URL, PUBLIC_X_API_KEY } from "@/lib/apiConfig";
import { bffFetch } from "@/lib/bffFetch";
import { SITE } from "@/config/site";
import ar from "../../../public/locales/lenaqar-ar.js";
import { resolveLegacyUnit } from "./legacy-unit-redirect.js";

/**
 * Route-handler response for legacy unit URLs. A route handler (not a page)
 * so crawlers get a real 308 / 404 / 503 status instead of a streamed 200.
 * Cookie-free, read-only public API calls only.
 */
async function publicUnitLookup(path) {
  if (!PUBLIC_X_API_KEY) return { ok: false, status: 503 };
  try {
    const response = await bffFetch(`${API_BASE_URL}${path}`, {
      headers: { accept: "application/json", "X-API-Key": PUBLIC_X_API_KEY },
      next: { revalidate: 900 },
    });
    if (!response.ok) return { ok: false, status: response.status };
    const body = await response.json();
    // The backend reports "not found" as HTTP 200 with code 404 in the body.
    if (body?.status !== true) {
      return { ok: false, status: Number(body?.code) || 404 };
    }
    return { ok: true, status: 200, data: body.data };
  } catch (error) {
    console.error("[lenaqar] legacy unit lookup failed", path, error);
    return { ok: false, status: 503 };
  }
}

const api = {
  byId: (id) => publicUnitLookup(`/public/unit-details/${encodeURIComponent(id)}`),
  byCode: (code) => publicUnitLookup(`/public/unit-by-code/${encodeURIComponent(code)}`),
};

/** Server-rendered copy straight from the Arabic dictionary (no client translate()). */
const copy = ar?.legacyUnit ?? {};

function htmlResponse(status, title, body, extraHeaders = {}) {
  // Minimal standalone document: no app shell, so no theme colors are repeated here.
  const html = `<!doctype html><html lang="ar-EG" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${title} | ${SITE.name}</title></head><body style="font-family:system-ui,sans-serif;max-width:32rem;margin:4rem auto;padding:0 1rem;line-height:1.7"><h1 style="font-size:1.4rem">${title}</h1><p>${body}</p><p><a href="/opportunities">${copy.browseCta}</a></p></body></html>`;
  return new Response(html, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "x-robots-tag": "noindex",
      ...extraHeaders,
    },
  });
}

export async function legacyUnitResponse(param, { allowCode = false } = {}) {
  const outcome = await resolveLegacyUnit(param, api, { allowCode });

  if (outcome.kind === "redirect") {
    return new Response(null, {
      status: 308,
      headers: {
        location: `${SITE.url}${outcome.location}`,
        "cache-control": "public, max-age=0, s-maxage=900",
      },
    });
  }
  if (outcome.kind === "unavailable") {
    return htmlResponse(503, copy.unavailableTitle, copy.unavailableBody, {
      "retry-after": "300",
    });
  }
  return htmlResponse(404, copy.notFoundTitle, copy.notFoundBody);
}
