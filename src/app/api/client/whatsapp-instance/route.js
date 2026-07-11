import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/apiConfig";
import { isRequestFromKingAdmin } from "@/lib/kingAdmin";
import { bffFetch } from "@/lib/bffFetch";

function buildBackendUrl(request) {
  const { searchParams } = new URL(request.url);
  const backendParams = new URLSearchParams();
  const platform = searchParams.get("platform");
  const whatsappNumber = searchParams.get("whatsapp_number");
  const openwaSessionId = searchParams.get("openwa_session_id");
  const whatsappInstanceId = searchParams.get("whatsapp_instance_id");
  const targetClientId = searchParams.get("target_client_id");
  if (platform) backendParams.set("platform", platform);
  if (whatsappNumber) backendParams.set("whatsapp_number", whatsappNumber);
  if (openwaSessionId) backendParams.set("openwa_session_id", openwaSessionId);
  if (whatsappInstanceId) {
    backendParams.set("whatsapp_instance_id", whatsappInstanceId);
  }
  if (targetClientId) backendParams.set("target_client_id", targetClientId);
  const qs = backendParams.toString();
  return `${API_BASE_URL}/client/whatsapp-instance${qs ? `?${qs}` : ""}`;
}

async function forwardRequest(request, method) {
  if (!(await isRequestFromKingAdmin(request))) {
    return NextResponse.json(
      { error: "Unauthorized. King admin access required." },
      { status: 403 }
    );
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  const url = buildBackendUrl(request);

  const init = {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    signal: AbortSignal.timeout(10000),
  };

  if (method === "PUT") {
    init.body = await request.text();
  }

  const response = await bffFetch(url, init);
  const data = await response.json();

  if (!response.ok) {
    return NextResponse.json(
      { error: data.detail || data.error || "WhatsApp instance request failed" },
      { status: response.status }
    );
  }

  return NextResponse.json(data);
}

export async function PUT(request) {
  try {
    return await forwardRequest(request, "PUT");
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[whatsapp-instance] PUT error:", error?.message ?? error);
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    return await forwardRequest(request, "DELETE");
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[whatsapp-instance] DELETE error:", error?.message ?? error);
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
