/**
 * Places of a buy request. Run with:
 * node --test src/lib/lenaqar/__tests__/request-places.test.js
 */
import test from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_REQUEST_PLACES,
  MAX_REQUEST_PLACES,
  addPlace,
  cleanPlace,
  isCoveredByCity,
  normalizePlaces,
  placesFromRequirement,
  primaryPlace,
  searchPlaces,
  togglePlace,
  typedPlace,
} from "../request-places.js";

const NEW_CAIRO = { city: "new cairo" };
const MADINATY = { city: "new cairo", district: "madinaty" };
const SHOROUK = { city: "cairo", district: "el shorouk city" };

test("default chips carry the exact catalog tokens (audit 2026-11-19)", () => {
  const tokens = DEFAULT_REQUEST_PLACES.map((place) =>
    [place.city, place.district].filter(Boolean).join(" > "),
  );
  assert.deepEqual(tokens, [
    "cairo",
    "new cairo",
    "sheikh zayed",
    "6 october",
    "new cairo > madinaty",
    "new administrative capital",
    "new cairo > fifth settlement",
    "cairo > el shorouk city",
    "new cairo > first settlement",
  ]);
  for (const place of DEFAULT_REQUEST_PLACES) {
    assert.ok(place.labelKey);
    assert.deepEqual(cleanPlace(place), cleanPlace({ city: place.city, district: place.district }));
  }
});

test("cleanPlace lowercases catalog tokens and keeps typed text as written", () => {
  assert.deepEqual(cleanPlace({ city: " New Cairo ", district: "Madinaty" }), MADINATY);
  assert.deepEqual(cleanPlace({ project: "  Mountain   View " }), { project: "Mountain View" });
  assert.equal(cleanPlace({ district: "madinaty" }), null); // a district alone names no city
  assert.equal(cleanPlace({ project: "x".repeat(81) }), null);
  assert.equal(cleanPlace(null), null);
});

test("a whole city covers the places inside it", () => {
  assert.equal(isCoveredByCity([NEW_CAIRO], MADINATY), true);
  assert.equal(isCoveredByCity([NEW_CAIRO], SHOROUK), false);
  assert.deepEqual(normalizePlaces([MADINATY, NEW_CAIRO, SHOROUK]), [NEW_CAIRO, SHOROUK]);

  const added = addPlace([MADINATY, SHOROUK], NEW_CAIRO);
  assert.deepEqual(added.places, [SHOROUK, NEW_CAIRO]);
  assert.equal(added.error, "");

  // Tapping a covered district changes nothing.
  assert.deepEqual(addPlace([NEW_CAIRO], MADINATY), { places: [NEW_CAIRO], error: "" });
});

test("toggle adds, removes, and stops at the limit", () => {
  assert.deepEqual(togglePlace([], MADINATY).places, [MADINATY]);
  assert.deepEqual(togglePlace([MADINATY, SHOROUK], MADINATY).places, [SHOROUK]);

  const full = Array.from({ length: MAX_REQUEST_PLACES }, (_, i) => ({ city: `city ${i}` }));
  const result = togglePlace(full, SHOROUK);
  assert.equal(result.error, "placesLimit");
  assert.deepEqual(result.places, full);
});

test("a saved request fills the picker from preferred_locations, else the flat fields", () => {
  assert.deepEqual(
    placesFromRequirement({
      preferred_locations: [
        { city: "cairo", district: null, sub_district: null, project: null },
        { city: "new cairo", district: "madinaty", sub_district: null, project: null },
      ],
    }),
    [{ city: "cairo" }, MADINATY],
  );
  assert.deepEqual(placesFromRequirement({ city: "Cairo", district: "El Shorouk City" }), [SHOROUK]);
  assert.deepEqual(placesFromRequirement(null), []);
  assert.deepEqual(primaryPlace([{ project: "x" }, SHOROUK]), SHOROUK);
  assert.equal(primaryPlace([{ project: "x" }]), null);
});

const SOURCES = {
  cities: [
    { en_name: "Cairo", ar_name: "القاهرة", aliases: ["كايرو"] },
    { en_name: "New Cairo", ar_name: "القاهرة الجديدة", aliases: [] },
    { en_name: "Sheikh Zayed", ar_name: "الشيخ زايد", aliases: [] },
  ],
  districts: [
    {
      en_name: "El Shorouk City",
      ar_name: "مدينة الشروق",
      aliases: ["الشروق", "Shorouk City"],
      city_en_name: "Cairo",
      city_ar_name: "القاهرة",
    },
    {
      en_name: "Madinaty",
      ar_name: "مدينتي",
      aliases: ["مدينتى"],
      city_en_name: "New Cairo",
      city_ar_name: "القاهرة الجديدة",
    },
  ],
  subDistricts: [
    {
      en_name: "Cairo Festival City",
      ar_name: "كايرو فستيفال سيتي",
      aliases: [],
      city_en_name: "New Cairo",
      city_ar_name: "القاهرة الجديدة",
      district_value: "fifth settlement",
    },
  ],
  projects: [
    { en_name: "Al Shorouk Springs", ar_name: "الشروق سبرينجز", city: "cairo", district: "el shorouk city" },
    { en_name: "Lonely Compound", ar_name: "كمبوند وحيد" },
  ],
};

test("search finds a district by its Arabic alias and returns its exact tokens", () => {
  const hits = searchPlaces("الشر", SOURCES);
  assert.deepEqual(hits[0].place, SHOROUK);
  assert.equal(hits[0].kind, "district");
  assert.equal(hits[0].parentAr, "القاهرة");
  // The project in that district is found too, with its own city and district.
  const project = hits.find((hit) => hit.kind === "project");
  assert.deepEqual(project.place, { ...SHOROUK, project: "Al Shorouk Springs" });
});

test("search folds Arabic spellings and matches English", () => {
  assert.deepEqual(searchPlaces("مدينتى", SOURCES)[0].place, MADINATY);
  assert.deepEqual(searchPlaces("القاهره الجديده", SOURCES)[0].place, NEW_CAIRO);
  assert.deepEqual(searchPlaces("zayed", SOURCES)[0].place, { city: "sheikh zayed" });
  // A name that starts with the query comes before one that only contains it.
  assert.deepEqual(
    searchPlaces("cairo", SOURCES).map((hit) => hit.en),
    ["Cairo", "Cairo Festival City", "New Cairo"],
  );
});

test("search needs two characters and a project without a city is still a place", () => {
  assert.deepEqual(searchPlaces("ا", SOURCES), []);
  assert.deepEqual(searchPlaces("zzzz", SOURCES), []);
  assert.deepEqual(searchPlaces("lonely", SOURCES)[0].place, { project: "Lonely Compound" });
});

test("typed text becomes a place of its own", () => {
  assert.deepEqual(typedPlace("  بيت  الوطن "), { project: "بيت الوطن" });
  assert.equal(typedPlace("ب"), null);
  assert.equal(typedPlace("x".repeat(81)), null);
});
