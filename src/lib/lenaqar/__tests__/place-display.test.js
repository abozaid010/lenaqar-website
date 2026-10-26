/**
 * Run with: node --test src/lib/lenaqar/__tests__/place-display.test.js
 */
import test from "node:test";
import assert from "node:assert/strict";
import { knownPlaceAr } from "../listing-seo.js";
import { CATALOG_PLACES_AR } from "../places-catalog.js";
import { englishPlaceName, localizedPlaceName } from "../place-display.js";

function arabicPlaceName(value) {
  const key = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (!key) return "";
  return knownPlaceAr(key) || CATALOG_PLACES_AR[key] || "";
}

test("catalog places used on buy-request cards have Arabic names", () => {
  assert.equal(arabicPlaceName("the small investor"), "المستثمر الصغير");
  assert.equal(arabicPlaceName("tenth district"), "الحي العاشر");
});

test("Arabic is the default place label; English is the other locale", () => {
  const projectAr = arabicPlaceName("the small investor");
  const districtAr = arabicPlaceName("tenth district");

  assert.equal(
    localizedPlaceName("the small investor", projectAr),
    "المستثمر الصغير",
  );
  assert.equal(localizedPlaceName("tenth district", districtAr, "ar"), "الحي العاشر");
  assert.equal(
    localizedPlaceName("the small investor", projectAr, "en"),
    "The Small Investor",
  );
  assert.equal(
    localizedPlaceName("tenth district", districtAr, "en"),
    "Tenth District",
  );
});

test("an unmapped token still shows, in Arabic script when that is what was stored", () => {
  assert.equal(englishPlaceName("the gate"), "The Gate");
  assert.equal(localizedPlaceName("the gate", "", "ar"), "The Gate");
  assert.equal(localizedPlaceName("مدينتي", "", "en"), "مدينتي");
});
