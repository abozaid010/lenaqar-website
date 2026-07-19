/**
 * Pure helpers for estimate request building / validation (no React).
 * Mirrors evaluate-form logic for regression coverage.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

function optionalInt(value) {
  if (value === "" || value == null) return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0) return NaN;
  return n;
}

function formToEstimateRequest(form, locationId) {
  const bedrooms = optionalInt(form.bedrooms);
  const bathrooms = optionalInt(form.bathrooms);
  return {
    location_id: locationId,
    property_type: form.property_type,
    area_sqm: Number(form.area_sqm),
    bedrooms: Number.isNaN(bedrooms) ? null : bedrooms,
    bathrooms: Number.isNaN(bathrooms) ? null : bathrooms,
    view: form.view || null,
    finishing: form.finishing || null,
  };
}

describe("estimate request payload", () => {
  it("builds exact-match style body", () => {
    const body = formToEstimateRequest(
      {
        property_type: "apartment",
        area_sqm: "78",
        bedrooms: "2",
        bathrooms: "1",
        view: "garden",
        finishing: "fully finished",
      },
      "eg__cairo__new-cairo__madinaty"
    );
    assert.deepEqual(body, {
      location_id: "eg__cairo__new-cairo__madinaty",
      property_type: "apartment",
      area_sqm: 78,
      bedrooms: 2,
      bathrooms: 1,
      view: "garden",
      finishing: "fully finished",
    });
  });

  it("sends null for empty optional fields", () => {
    const body = formToEstimateRequest(
      {
        property_type: "villa",
        area_sqm: "200",
        bedrooms: "",
        bathrooms: "",
        view: "",
        finishing: "",
      },
      "eg__cairo"
    );
    assert.equal(body.bedrooms, null);
    assert.equal(body.bathrooms, null);
    assert.equal(body.view, null);
    assert.equal(body.finishing, null);
  });
});
