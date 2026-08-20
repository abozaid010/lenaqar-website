import { NextResponse } from "next/server";
import { API_BASE_URL, HAS_X_API_KEY, PUBLIC_X_API_KEY } from "@/lib/apiConfig";
import {
  HAS_BFF_SECRET,
  bffFetch,
  isCloudflareChallenge,
} from "@/lib/bffFetch";
import { SITE, lenaqarInventoryQuery } from "@/config/site";

export const dynamic = "force-dynamic";
export const maxDuration = 15;

export async function GET() {
  const tenant = SITE.clientId;
  const query = {
    ...lenaqarInventoryQuery(),
    page_size: 2,
  };
  const qs = new URLSearchParams(
    Object.entries(query).map(([k, v]) => [k, String(v)]),
  ).toString();

  let apiStatus = null;
  let unitCount = 0;
  let apiError = null;
  let blockedBy = null;
  let upstream = null;

  if (!HAS_X_API_KEY) {
    apiError = "missing_api_key";
  } else if (process.env.VERCEL && !HAS_BFF_SECRET) {
    apiError = "missing_bff_secret";
  } else {
    try {
      const response = await bffFetch(`${API_BASE_URL}/public/v1/units?${qs}`, {
        headers: {
          accept: "application/json",
          "X-API-Key": PUBLIC_X_API_KEY,
        },
        cache: "no-store",
      });
      apiStatus = response.status;
      const contentType = response.headers.get("content-type");
      upstream = {
        server: response.headers.get("server"),
        cfRay: response.headers.get("cf-ray"),
        cfMitigated: response.headers.get("cf-mitigated"),
        contentType,
      };
      if (response.ok) {
        const json = await response.json();
        const units = json?.data?.units ?? json?.units ?? [];
        unitCount = Array.isArray(units) ? units.length : 0;
      } else {
        const body = await response.text().catch(() => "");
        if (isCloudflareChallenge(response, body)) {
          blockedBy = "cloudflare";
          apiError = "cloudflare_js_challenge";
        } else {
          apiError = `http_${response.status}${body ? `:${body.slice(0, 120)}` : ""}`;
        }
      }
    } catch (error) {
      apiError = error instanceof Error ? error.message : "fetch_failed";
    }
  }

  return NextResponse.json(
    {
      ok:
        HAS_X_API_KEY &&
        HAS_BFF_SECRET &&
        !blockedBy &&
        apiStatus === 200 &&
        unitCount > 0,
      hasApiKey: HAS_X_API_KEY,
      hasBffSecret: HAS_BFF_SECRET,
      tenant,
      apiHost: (() => {
        try {
          return new URL(API_BASE_URL).hostname;
        } catch {
          return null;
        }
      })(),
      apiStatus,
      unitCount,
      blockedBy,
      upstream,
      apiError,
    },
    {
      headers: { "Cache-Control": "no-store" },
    },
  );
}
