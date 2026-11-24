/** Run with: node --test src/lib/lenaqar/__tests__/requirement-excluded-places.test.js */
import test from "node:test";
import assert from "node:assert/strict";
import { readPublicPlaces } from "../requirement-public.js";

const placeAr = (name) => (name === "madinaty" ? "مدينتي" : "");

test("public places keep the four fields and their Arabic names", () => {
  assert.deepEqual(
    readPublicPlaces([{ city: "new cairo", district: "madinaty", project: "madinaty b15" }], placeAr),
    [
      {
        city: "new cairo",
        district: "madinaty",
        subDistrict: "",
        project: "madinaty b15",
        cityAr: "",
        districtAr: "مدينتي",
        subDistrictAr: "",
        projectAr: "",
      },
    ],
  );
});

test("malformed or missing lists give no places", () => {
  assert.deepEqual(readPublicPlaces(undefined, placeAr), []);
  assert.deepEqual(readPublicPlaces("madinaty", placeAr), []);
  assert.equal(readPublicPlaces([null, 3, { district: 7 }], placeAr).length, 1);
  assert.equal(readPublicPlaces([{ district: 7 }], placeAr)[0].district, "");
});
