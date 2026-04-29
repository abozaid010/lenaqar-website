import sharp from "sharp";

const DEFAULT_SIZES = [400, 800, 1200, 1600];

/**
 * Process an uploaded image into optimized web formats.
 * - Accepts PNG/JPEG/WebP input
 * - Resizes to configured widths (without enlargement)
 * - Converts to WebP (and optional AVIF)
 * - Strips metadata by default
 */
export async function processImage(
  fileBuffer,
  {
    sizes = DEFAULT_SIZES,
    webpQuality = 75,
    avifQuality = 50,
    includeAvif = false,
  } = {}
) {
  const results = [];

  for (const width of sizes) {
    const webpBuffer = await sharp(fileBuffer)
      .resize({ width, withoutEnlargement: true, fit: "inside" })
      .webp({ quality: webpQuality })
      .toBuffer();

    results.push({
      format: "webp",
      width,
      buffer: webpBuffer,
      filename: `image_${width}.webp`,
      mimeType: "image/webp",
    });

    if (includeAvif) {
      const avifBuffer = await sharp(fileBuffer)
        .resize({ width, withoutEnlargement: true, fit: "inside" })
        .avif({ quality: avifQuality })
        .toBuffer();

      results.push({
        format: "avif",
        width,
        buffer: avifBuffer,
        filename: `image_${width}.avif`,
        mimeType: "image/avif",
      });
    }
  }

  return results;
}
