/**
 * Run with: node --test src/lib/lenaqar/__tests__/arabic-labels.test.js
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  applyArabicLabels,
  indexArabicNames,
  lookupArabicName,
  madinatyPhaseAr,
} from "../arabic-labels.js";
import { knownPlaceAr } from "../listing-seo.js";
import { CATALOG_PLACES_AR } from "../places-catalog.js";

function catalogPlaceAr(value) {
  const key = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (!key) return "";
  return knownPlaceAr(key) || CATALOG_PLACES_AR[key] || "";
}

const developers = indexArabicNames([
  { en: "La Vista Developments", ar: "لافيستا" },
  { en: "Talaat Moustafa | TMG", ar: "طلعت مصطفى" },
  { en: "LMD (Landmark Sabbour)", ar: "لاند مارك صبور" },
]);

const projects = indexArabicNames([
  { en: "patio vida", ar: "باتيو فيدا" },
  { en: "madinaty b14", ar: "مدينتي ب 14" },
]);

test("matches developers across pipe and parenthesis variants", () => {
  assert.equal(lookupArabicName(developers, "La Vista Developments"), "لافيستا");
  assert.equal(lookupArabicName(developers, "Talaat Moustafa"), "طلعت مصطفى");
  assert.equal(lookupArabicName(developers, "TMG"), "طلعت مصطفى");
  assert.equal(lookupArabicName(developers, "Landmark Sabbour"), "لاند مارك صبور");
});

test("a project name stored on the developer field uses the project Arabic", () => {
  const labeled = applyArabicLabels(
    { developer: "madinaty b15", developerAr: "", project: "", projectAr: "" },
    { developers, projects, placeAr: () => "" },
  );
  assert.equal(labeled.developerAr, "مدينتي ب 15");
});

test("matches a project after dropping a leading article", () => {
  assert.equal(lookupArabicName(projects, "el patio vida"), "باتيو فيدا");
});

test("madinaty phase codes become Arabic when the catalog has no row", () => {
  assert.equal(madinatyPhaseAr("madinaty b13"), "مدينتي ب 13");
  assert.equal(madinatyPhaseAr("madinaty"), "");
});

test("applyArabicLabels fills the card fields and keeps API Arabic", () => {
  const labeled = applyArabicLabels(
    {
      developer: "La Vista Developments",
      developerAr: "",
      project: "el patio vida",
      projectAr: "",
      city: "new cairo",
      district: "new october",
    },
    {
      developers,
      projects,
      placeAr: catalogPlaceAr,
    },
  );

  assert.equal(labeled.developerAr, "لافيستا");
  assert.equal(labeled.projectAr, "باتيو فيدا");
  assert.equal(labeled.cityAr, "القاهرة الجديدة");
  assert.equal(labeled.districtAr, "6 أكتوبر الجديدة");
});

test("an Arabic name already on the unit is not replaced", () => {
  const labeled = applyArabicLabels(
    {
      developer: "La Vista Developments",
      developerAr: "لا فيستا للتطوير",
      project: "el patio vida",
      projectAr: "إل باتيو فيدا",
      city: "new cairo",
      district: "fifth settlement",
    },
    { developers, projects, placeAr: catalogPlaceAr },
  );

  assert.equal(labeled.developerAr, "لا فيستا للتطوير");
  assert.equal(labeled.projectAr, "إل باتيو فيدا");
  assert.equal(labeled.districtAr, "التجمع الخامس");
});

test("a project that is only a place name uses the place Arabic", () => {
  const labeled = applyArabicLabels(
    { project: "madinaty", projectAr: "", city: "assiut", district: "el rehab" },
    { developers, projects, placeAr: catalogPlaceAr },
  );

  assert.equal(labeled.projectAr, "مدينتي");
  assert.equal(labeled.cityAr, "أسيوط");
  assert.equal(labeled.districtAr, "الرحاب");
});
