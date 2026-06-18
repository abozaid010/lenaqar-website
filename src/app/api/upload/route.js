import { cookies } from "next/headers";
import { COOKIE_KEYS } from "@/constants/cookieKeys";
import { API_BASE_URL } from "@/lib/apiConfig";
import { processImage } from "@/lib/imageProcessor";
import { rateLimit, getClientIp, rateLimitExceededResponse } from "@/lib/rateLimit";
import { bffFetch } from "@/lib/bffFetch";

export const runtime = "nodejs";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const UPLOAD_RATE_LIMIT = 10;   // uploads
const UPLOAD_WINDOW_MS = 60_000; // per 60 seconds
const isDev = process.env.NODE_ENV === "development";

export async function POST(req) {
  // ── Rate limiting ──────────────────────────────────────────────────────────
  const ip = getClientIp(req);
  const { allowed, retryAfter } = rateLimit(`upload:${ip}`, UPLOAD_RATE_LIMIT, UPLOAD_WINDOW_MS);
  if (!allowed) return rateLimitExceededResponse(retryAfter);

  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(COOKIE_KEYS.ACCESS_TOKEN)?.value;

    // ── Mandatory auth ─────────────────────────────────────────────────────
    if (!accessToken) {
      return Response.json({ error: "Authentication required." }, { status: 401 });
    }

    const formData = await req.formData();

    const file = formData.get("file");
    const clientId = formData.get("clientId");
    const shouldGenerateAvif = formData.get("generateAvif") === "true";

    if (isDev) {
      console.log("[/api/upload] POST", { clientId, fileType: file?.type, fileSize: file?.size });
    }

    if (!file || typeof file.arrayBuffer !== "function") {
      return Response.json({ error: "No image file provided." }, { status: 400 });
    }

    if (!clientId || typeof clientId !== "string") {
      return Response.json({ error: "Missing client id." }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return Response.json({ error: "Unsupported file type." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return Response.json({ error: "File size exceeds 10MB." }, { status: 400 });
    }

    const originalBuffer = Buffer.from(await file.arrayBuffer());
    const variants = await processImage(originalBuffer, { includeAvif: shouldGenerateAvif });

    const primaryUpload = variants.find(
      (variant) => variant.format === "webp" && variant.width === 1200
    );

    if (!primaryUpload) {
      return Response.json({ error: "Failed to generate optimized image." }, { status: 500 });
    }

    const storageFormData = new FormData();
    storageFormData.append(
      "file",
      new File([primaryUpload.buffer], primaryUpload.filename, { type: primaryUpload.mimeType })
    );

    const uploadResponse = await bffFetch(
      `${API_BASE_URL}/gcs/upload?client_id=${encodeURIComponent(clientId)}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: storageFormData,
      }
    );

    const uploadData = await uploadResponse.json().catch(() => ({}));

    if (!uploadResponse.ok) {
      return Response.json(
        { error: uploadData?.error_message || "Image upload failed." },
        { status: uploadResponse.status }
      );
    }

    return Response.json({
      ...uploadData,
      optimized: true,
      sourceFormat: "webp",
      sourceWidth: primaryUpload.width,
      variants: variants.map((v) => ({
        format: v.format,
        width: v.width,
        filename: v.filename,
        size: v.buffer.length,
      })),
    });
  } catch (error) {
    if (isDev) console.error("[/api/upload] Upload pipeline failed:", error);
    return Response.json({ error: "Unexpected upload error." }, { status: 500 });
  }
}
