import { cookies } from "next/headers";
import { COOKIE_KEYS } from "@/constants/cookieKeys";
import { API_BASE_URL } from "@/lib/apiConfig";
import { processImage } from "@/lib/imageProcessor";

export const runtime = "nodejs";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export async function POST(req) {
  try {
    console.log("[/api/upload] POST received", { at: new Date().toISOString() });
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(COOKIE_KEYS.ACCESS_TOKEN)?.value;
    const formData = await req.formData();

    const file = formData.get("file");
    const clientId = formData.get("clientId");
    const shouldGenerateAvif = formData.get("generateAvif") === "true";
    console.log("[/api/upload] parsed formData", {
      clientId,
      hasFile: Boolean(file),
      fileType: file?.type,
      fileSize: file?.size,
      generateAvif: shouldGenerateAvif,
    });

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
    console.log("[/api/upload] file buffer ready", { bytes: originalBuffer.length });
    const variants = await processImage(originalBuffer, {
      includeAvif: shouldGenerateAvif,
    });
    console.log("[/api/upload] image processed", { variantsCount: variants.length });

    // Keep current app contract intact by uploading one optimized source image.
    const primaryUpload = variants.find(
      (variant) => variant.format === "webp" && variant.width === 1200
    );

    if (!primaryUpload) {
      return Response.json(
        { error: "Failed to generate optimized image." },
        { status: 500 }
      );
    }

    const storageFormData = new FormData();
    storageFormData.append(
      "file",
      new File([primaryUpload.buffer], primaryUpload.filename, {
        type: primaryUpload.mimeType,
      })
    );

    const uploadResponse = await fetch(
      `${API_BASE_URL}/gcs/upload?client_id=${encodeURIComponent(clientId)}`,
      {
        method: "POST",
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
        body: storageFormData,
      }
    );
    console.log("[/api/upload] storage response", { status: uploadResponse.status });

    const uploadData = await uploadResponse.json().catch(() => ({}));

    if (!uploadResponse.ok) {
      return Response.json(
        {
          error: uploadData?.error_message || "Image upload failed.",
        },
        { status: uploadResponse.status }
      );
    }

    return Response.json({
      ...uploadData,
      optimized: true,
      sourceFormat: "webp",
      sourceWidth: primaryUpload.width,
      variants: variants.map((variant) => ({
        format: variant.format,
        width: variant.width,
        filename: variant.filename,
        size: variant.buffer.length,
      })),
    });
  } catch (error) {
    console.error("[/api/upload] Upload pipeline failed:", error);
    return Response.json({ error: "Unexpected upload error." }, { status: 500 });
  }
}
