import { test } from "node:test";
import assert from "node:assert/strict";
import {
  MIN_GROUP_UNITS,
  MIN_PROJECT_UNITS,
  PUBLIC_PROJECT_KEYS,
  buildProjectSchema,
  projectMetaText,
  projectSlug,
  summarizeProjectUnits,
  toPublicProject,
  toSummaryUnit,
} from "../project-summary.js";

const NOW = new Date("2026-11-24T12:00:00Z");

function apiUnit(overrides = {}) {
  return {
    code: "ABC123",
    unitId: "u-1",
    author: "someone@example.com",
    clientId: "public",
    notes: "call 01000000000",
    buildingType: "Apartment",
    roomsCount: 3,
    landArea: 150,
    totalPrice: 9_000_000,
    downPayment: 900_000,
    deliveryDate: "2028-06-01T00:00:00Z",
    updatedAt: "2026-11-10T08:00:00Z",
    ...overrides,
  };
}

function units(count, overrides = {}) {
  return Array.from({ length: count }, (_, i) =>
    toSummaryUnit(apiUnit({ totalPrice: 9_000_000 + i * 100_000, ...overrides }), NOW),
  );
}

test("projectSlug makes a Latin hyphenated slug", () => {
  assert.equal(projectSlug("  Il Latini — New Alamein "), "il-latini-new-alamein");
  assert.equal(projectSlug("Vye & Karmell"), "vye-and-karmell");
  assert.equal(projectSlug("ONE33"), "one33");
  assert.equal(projectSlug("مشروع"), "");
});

test("toSummaryUnit keeps only the fields the summary needs", () => {
  const unit = toSummaryUnit(apiUnit(), NOW);
  assert.deepEqual(Object.keys(unit).sort(), [
    "area",
    "deliveryYear",
    "downPayment",
    "perMeter",
    "price",
    "rooms",
    "type",
    "updated",
  ]);
  assert.equal(unit.type, "apartment");
  assert.equal(unit.deliveryYear, 2028);
  assert.equal(unit.updated, "2026-11-10");
});

test("toSummaryUnit rejects units without a usable price, area or plausible price per m²", () => {
  assert.equal(toSummaryUnit(apiUnit({ totalPrice: 0 }), NOW), null);
  assert.equal(toSummaryUnit(apiUnit({ landArea: null }), NOW), null);
  assert.equal(toSummaryUnit(apiUnit({ totalPrice: 1000 }), NOW), null);
  assert.equal(toSummaryUnit(apiUnit({ totalPrice: 9e12 }), NOW), null);
});

test("toSummaryUnit drops a future update date and an impossible down payment", () => {
  const unit = toSummaryUnit(
    apiUnit({ updatedAt: "2999-01-01", downPayment: 99_000_000 }),
    NOW,
  );
  assert.equal(unit.updated, null);
  assert.equal(unit.downPayment, null);
});

test("a project below the minimum sample has no summary", () => {
  assert.equal(summarizeProjectUnits(units(MIN_PROJECT_UNITS - 1)), null);
  assert.equal(summarizeProjectUnits([]), null);
});

test("summary reports count, min, median, max and date range from the same units", () => {
  const summary = summarizeProjectUnits(units(11));
  assert.equal(summary.units, 11);
  assert.equal(summary.priceMin, 9_000_000);
  assert.equal(summary.priceMedian, 9_500_000);
  assert.equal(summary.priceMax, 10_000_000);
  assert.equal(summary.perMeterMedian, Math.round(9_500_000 / 150));
  assert.equal(summary.deliveryYearMin, 2028);
  assert.equal(summary.updatedFrom, "2026-11-10");
  assert.equal(summary.updatedTo, "2026-11-10");
  assert.equal(summary.downPaymentMin, 900_000);
});

test("type and rooms rows need the minimum group size", () => {
  const sample = [
    ...units(8, { buildingType: "apartment", roomsCount: 3 }),
    ...units(MIN_GROUP_UNITS - 1, { buildingType: "villa", roomsCount: 5 }),
  ];
  const summary = summarizeProjectUnits(sample);
  assert.equal(summary.units, 8 + MIN_GROUP_UNITS - 1);
  assert.deepEqual(summary.byType.map((row) => row.type), ["apartment"]);
  assert.deepEqual(summary.byRooms.map((row) => [row.type, row.rooms]), [["apartment", 3]]);
});

test("down-payment figures are withheld when too few units carry one", () => {
  const sample = [
    ...units(MIN_GROUP_UNITS - 1),
    ...units(8, { downPayment: null }),
  ];
  const summary = summarizeProjectUnits(sample);
  assert.equal(summary.downPaymentMin, null);
  assert.equal(summary.downPaymentMedian, null);
});

test("toPublicProject keeps allowlisted facts only", () => {
  const project = toPublicProject({
    id: "p-1",
    client_id: "public",
    author: "someone@example.com",
    description: "اتصل على 01000000000",
    google_map_link: "https://maps.example/x",
    latitude: 30.1,
    payment_plans: [{ name: "5% down" }],
    images: [{ url: "https://example.com/a.jpg" }],
    en_name: "Lyv Caesar",
    ar_name: "ليف سيزار",
    developer_name: "Gates Developments",
    city: "North Coast",
    district: "Ras El Hekma",
    finishing_type: ["Fully Finished"],
    properties_types: ["Chalet", "chalet", "Townhouse"],
    primary_units_sold_out: null,
  });
  assert.deepEqual(project, {
    slug: "lyv-caesar",
    nameEn: "Lyv Caesar",
    nameAr: "ليف سيزار",
    developer: "Gates Developments",
    city: "north coast",
    district: "ras el hekma",
    subDistrict: null,
    finishing: ["fully finished"],
    propertyTypes: ["chalet", "townhouse"],
    soldOut: false,
  });
  for (const key of Object.keys(project)) assert.ok(PUBLIC_PROJECT_KEYS.includes(key), key);
});

test("the summary carries no unit identifier or free text", () => {
  const summary = summarizeProjectUnits(units(12));
  const text = JSON.stringify(summary);
  for (const banned of ["ABC123", "u-1", "example.com", "01000000000", "author", "code", "notes", "clientId"]) {
    assert.equal(text.includes(banned), false, banned);
  }
});

test("project schema mirrors the visible summary and dates itself from the unit records", () => {
  const summary = summarizeProjectUnits(units(12));
  const schema = buildProjectSchema({
    project: { nameEn: "Lyv Caesar", summary },
    labels: { name: "ليف سيزار", city: "الساحل الشمالي", district: "رأس الحكمة" },
    url: "https://www.lenaqar.com/projects/lyv-caesar",
    title: "أسعار ليف سيزار",
    description: "ملخص",
  });
  assert.equal(schema["@type"], "WebPage");
  assert.equal(schema.dateModified, "2026-11-10");
  assert.equal(schema.datePublished, undefined);
  assert.deepEqual(schema.mainEntity, {
    "@type": "AggregateOffer",
    priceCurrency: "EGP",
    lowPrice: summary.priceMin,
    highPrice: summary.priceMax,
    offerCount: 12,
  });
  assert.equal(schema.about.address.addressCountry, "EG");
  assert.equal(buildProjectSchema({ project: { nameEn: "x" } }), null);
});

test("page title drops a long developer name; description quotes the summary", () => {
  const project = { summary: summarizeProjectUnits(units(12)) };
  const short = projectMetaText(project, { name: "طلاله", developer: "مدينة مصر", city: "القاهرة الجديدة", district: "التجمع الخامس" });
  assert.equal(short.title, "أسعار طلاله — مدينة مصر");
  assert.match(short.description, /12 وحدة/);
  assert.match(short.description, /9,000,000/);
  assert.match(short.description, /مش أسعار بيع/);
  assert.match(short.description, /التجمع الخامس/);
  assert.ok(short.description.length <= 170, String(short.description.length));
  const long = projectMetaText(project, { name: "مشروع باسم طويل جدًا في العاصمة", developer: "شركة تطوير عقاري باسم طويل جدًا جدًا للاستثمار" });
  assert.equal(long.title, "أسعار مشروع باسم طويل جدًا في العاصمة");
  const far = projectMetaText(project, {
    name: "مشروع باسم طويل جدًا في العاصمة",
    city: "العاصمة الإدارية الجديدة",
    district: "منطقة باسم طويل جدًا في العاصمة الإدارية الجديدة",
  });
  assert.doesNotMatch(far.description, /منطقة باسم طويل/);
  assert.ok(far.description.length <= 170, String(far.description.length));
});
