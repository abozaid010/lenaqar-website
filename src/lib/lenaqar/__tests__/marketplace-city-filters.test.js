/**
 * Homepage city-chip matching.
 * node --test src/lib/lenaqar/__tests__/marketplace-city-filters.test.js
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  MARKETPLACE_CITY_FILTERS,
  requirementMatchesCity,
} from "../marketplace-city-filters.js";

test("exposes the six marketplace cities in the requested order", () => {
  assert.deepEqual(
    MARKETPLACE_CITY_FILTERS.map((city) => city.value),
    [
      "cairo",
      "new cairo",
      "6 october",
      "north coast",
      "sheikh zayed",
      "new administrative capital",
    ],
  );
  assert.equal(MARKETPLACE_CITY_FILTERS[1].label, "القاهرة الجديدة");
  assert.equal(MARKETPLACE_CITY_FILTERS[5].label, "العاصمة الإدارية الجديدة");
});

test("empty filter keeps every requirement", () => {
  const row = { locations: [{ city: "assiut" }] };
  assert.equal(requirementMatchesCity(row, ""), true);
});

test("cairo and new cairo stay on separate chips", () => {
  const cairo = { locations: [{ city: "cairo", district: "maadi" }] };
  const newCairoCity = { locations: [{ city: "new cairo" }] };
  const newCairoDistrict = {
    locations: [{ city: "cairo", district: "new cairo" }],
  };

  assert.equal(requirementMatchesCity(cairo, "cairo"), true);
  assert.equal(requirementMatchesCity(cairo, "new cairo"), false);

  assert.equal(requirementMatchesCity(newCairoCity, "cairo"), false);
  assert.equal(requirementMatchesCity(newCairoCity, "new cairo"), true);

  assert.equal(requirementMatchesCity(newCairoDistrict, "cairo"), false);
  assert.equal(requirementMatchesCity(newCairoDistrict, "new cairo"), true);
});

test("matches october, zayed, north coast, and new capital aliases", () => {
  assert.equal(
    requirementMatchesCity(
      { locations: [{ city: "", district: "6th of october" }] },
      "6 october",
    ),
    true,
  );
  assert.equal(
    requirementMatchesCity(
      { locations: [{ city: "6 october", district: "6 october city" }] },
      "6 october",
    ),
    true,
  );
  assert.equal(
    requirementMatchesCity(
      { locations: [{ city: "sheikh zayed", district: "new zayed" }] },
      "sheikh zayed",
    ),
    true,
  );
  assert.equal(
    requirementMatchesCity(
      { locations: [{ city: "north coast", district: "el alamein" }] },
      "north coast",
    ),
    true,
  );
  assert.equal(
    requirementMatchesCity(
      { locations: [{ city: "new administrative capital" }] },
      "new administrative capital",
    ),
    true,
  );
  assert.equal(
    requirementMatchesCity(
      { locations: [{ city: "new capital" }] },
      "new administrative capital",
    ),
    true,
  );
});
