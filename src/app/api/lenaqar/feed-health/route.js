import { NextResponse } from "next/server";
import { API_BASE_URL, HAS_X_API_KEY, PUBLIC_X_API_KEY } from "@/lib/apiConfig";
import { SITE, lenaqarInventoryQuery } from "@/config/site";

export const dynamic = "force-dynamic";

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

  if (!HAS_X_API_KEY) {
    apiError = "missing_api_key";
  } else {
    try {
      const response = await fetch(`${API_BASE_URL}/public/v1/units?${qs}`, {
        headers: {
          accept: "application/json",
          "X-API-Key": PUBLIC_X_API_KEY,
        },
        cache: "no-store",
      });
      apiStatus = response.status;
      if (response.ok) {
        const json = await response.json();
        const units = json?.data?.units ?? json?.units ?? [];
        unitCount = Array.isArray(units) ? units.length : 0;
      } else {
        apiError = `http_${response.status}`;
      }
    } catch (error) {
      apiError = error instanceof Error ? error.message : "fetch_failed";
    }
  }

  return NextResponse.json(
    {
      ok: HAS_X_API_KEY && apiStatus === 200 && unitCount > 0,
      hasApiKey: HAS_X_API_KEY,
      tenant,
      apiStatus,
      unitCount,
      apiError,
    },
    {
      headers: { "Cache-Control": "no-store" },
    },
  );
}
