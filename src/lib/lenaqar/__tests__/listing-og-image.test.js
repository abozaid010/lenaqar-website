/**
 * Run: node --test src/lib/lenaqar/__tests__/listing-og-image.test.js
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { listingShareImages } from "../listing-og-image.js";

const fallbackUrl = "https://www.lenaqar.com/brand/lenaqar-v1/social-preview.png";

test("uses the first https photo of the listing", () => {
  const unit = { images: [{ url: "http://insecure.example/a.jpg" }, { url: " https://api.lenaai.net/gcs/lenaqar_1 " }, { url: "https://api.lenaai.net/gcs/lenaqar_2" }] };
  assert.deepEqual(listingShareImages(unit, { fallbackUrl, alt: "شقة" }), [{ url: "https://api.lenaai.net/gcs/lenaqar_1", alt: "شقة" }]);
});

test("accepts plain string images", () => {
  assert.equal(listingShareImages({ images: ["https://api.lenaai.net/gcs/x"] }, { fallbackUrl })[0].url, "https://api.lenaai.net/gcs/x");
});

test("falls back to the logo with its known size when there is no usable photo", () => {
  for (const unit of [null, {}, { images: [] }, { images: [{ url: "" }, { url: null }] }]) {
    assert.deepEqual(listingShareImages(unit, { fallbackUrl, alt: "لينا عقار" }), [{ url: fallbackUrl, width: 1200, height: 630, alt: "لينا عقار" }]);
  }
});
