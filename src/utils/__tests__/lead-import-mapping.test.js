/**
 * Unit tests for lead import column mapping.
 * Run with: node --test src/utils/__tests__/lead-import-mapping.test.js
 */
import test from "node:test";
import assert from "node:assert/strict";

import {
  buildColumnMapping,
  buildMergedNotes,
  getRowUnknownPairs,
  isHeaderLikeValue,
  normalizeHeader,
  LEAD_FIELD_ALIASES,
} from "../lead-import-mapping.js";

const fieldByHeader = (headers) => {
  const { mappedColumns } = buildColumnMapping(headers);
  const out = {};
  for (const col of mappedColumns) out[col.header] = col.field;
  return out;
};

test("case-insensitive header matching", () => {
  for (const header of ["Name", "NAME", "name", "NaMe"]) {
    assert.equal(fieldByHeader([header])[header], "name");
  }
});

test("normalizes spaces, underscores, hyphens and extra whitespace", () => {
  for (const header of [
    "Phone",
    "phone_number",
    "Phone-Number",
    "phone number",
    "  Phone   Number  ",
    "Mobile",
  ]) {
    const { byField } = buildColumnMapping([header]);
    assert.equal(byField.phone, 0, `failed for "${header}"`);
  }
});

test("alias matching for every field (English)", () => {
  const cases = {
    telephone: "phone",
    contact: "phone",
    "Full Name": "name",
    customer: "name",
    remarks: "notes",
    description: "notes",
    "Campaign ID": "campaign_id",
    source: "platform",
    channel: "platform",
  };
  for (const [header, field] of Object.entries(cases)) {
    assert.equal(fieldByHeader([header])[header], field, `failed for "${header}"`);
  }
});

test("alias matching for Arabic headers", () => {
  const cases = {
    "رقم الهاتف": "phone",
    موبايل: "phone",
    الاسم: "name",
    ملاحظات: "notes",
  };
  for (const [header, field] of Object.entries(cases)) {
    assert.equal(fieldByHeader([header])[header], field, `failed for "${header}"`);
  }
});

test("backward compatibility with existing template headers", () => {
  const headers = ["name", "phone", "notes", "campaign_id", "platform"];
  const { byField, unknownColumns } = buildColumnMapping(headers);
  assert.equal(byField.name, 0);
  assert.equal(byField.phone, 1);
  assert.equal(byField.notes, 2);
  assert.equal(byField.campaign_id, 3);
  assert.equal(byField.platform, 4);
  assert.equal(unknownColumns.length, 0);
});

test('legacy "query" header still maps to notes', () => {
  assert.equal(fieldByHeader(["query"])["query"], "notes");
});

test("recommended template display labels map correctly", () => {
  const headers = ["Name", "Phone", "Notes", "Campaign ID", "Platform"];
  const { byField, unknownColumns } = buildColumnMapping(headers);
  assert.deepEqual(byField, {
    name: 0,
    phone: 1,
    notes: 2,
    campaign_id: 3,
    platform: 4,
  });
  assert.equal(unknownColumns.length, 0);
});

test("each column is assigned to at most one field", () => {
  // "Campaign Name" must go to campaign, not be stolen by name via 'name' token.
  const { byField, mappedColumns } = buildColumnMapping(["Campaign Name", "Name"]);
  assert.equal(byField.campaign_id, 0);
  assert.equal(byField.name, 1);
  assert.equal(mappedColumns.length, 2);
});

test("duplicate aliases resolve to the first matching column", () => {
  const { byField } = buildColumnMapping(["Mobile", "Phone Number"]);
  assert.equal(byField.phone, 0); // first phone-like column wins
});

test("unknown columns are collected, not dropped", () => {
  const { unknownColumns, byField } = buildColumnMapping([
    "Name",
    "Phone",
    "Budget",
    "City",
    "Unit Type",
  ]);
  assert.equal(byField.name, 0);
  assert.equal(byField.phone, 1);
  assert.deepEqual(
    unknownColumns.map((c) => c.header),
    ["Budget", "City", "Unit Type"],
  );
});

test("viaAlias flag: direct name vs alias", () => {
  const direct = buildColumnMapping(["phone"]).mappedColumns[0];
  const alias = buildColumnMapping(["Mobile Number"]).mappedColumns[0];
  assert.equal(direct.viaAlias, false);
  assert.equal(alias.viaAlias, true);
});

test("apiField preserves backend contract", () => {
  const byField = {};
  for (const col of buildColumnMapping(["name", "phone", "notes"]).mappedColumns) {
    byField[col.field] = col.apiField;
  }
  assert.equal(byField.name, "user_name");
  assert.equal(byField.phone, "phone_number");
  assert.equal(byField.notes, "query");
});

test("author column is recognized (case/spacing variants), not merged into notes", () => {
  for (const header of ["Author", "author", "AUTHOR", "Author Email", "author_email", "author email"]) {
    const { byField, unknownColumns } = buildColumnMapping(["Phone", header]);
    assert.equal(byField.author, 1, `author not detected for "${header}"`);
    assert.equal(unknownColumns.length, 0, `"${header}" leaked into notes`);
  }
});

test("author maps to top-level api field 'author'", () => {
  const col = buildColumnMapping(["Author"]).mappedColumns[0];
  assert.equal(col.field, "author");
  assert.equal(col.apiField, "author");
});

test("getRowUnknownPairs skips empty values", () => {
  const unknownColumns = [
    { index: 2, header: "Budget" },
    { index: 3, header: "City" },
    { index: 4, header: "Unit Type" },
  ];
  const row = ["Ahmed", "010", "5M", "", "  "];
  assert.deepEqual(getRowUnknownPairs(row, unknownColumns), [
    { header: "Budget", value: "5M" },
  ]);
});

test("buildMergedNotes appends generated text to existing notes", () => {
  const result = buildMergedNotes("Interested after July", [
    { header: "Budget", value: "5M" },
    { header: "City", value: "New Cairo" },
  ]);
  assert.equal(result, "Interested after July\nBudget: 5M, City: New Cairo");
});

test("buildMergedNotes with no existing notes returns generated text only", () => {
  const result = buildMergedNotes("", [
    { header: "Budget", value: "5M" },
    { header: "City", value: "New Cairo" },
  ]);
  assert.equal(result, "Budget: 5M, City: New Cairo");
});

test("buildMergedNotes with only existing notes returns it unchanged", () => {
  assert.equal(buildMergedNotes("Just a note", []), "Just a note");
});

test("buildMergedNotes skips empty pairs entirely", () => {
  assert.equal(buildMergedNotes("", [{ header: "City", value: "  " }]), "");
});

test("invalid spreadsheet: no headers", () => {
  const { byField, mappedColumns, unknownColumns } = buildColumnMapping([]);
  assert.deepEqual(byField, {});
  assert.equal(mappedColumns.length, 0);
  assert.equal(unknownColumns.length, 0);
});

test("invalid spreadsheet: headers present but no phone column", () => {
  const { byField } = buildColumnMapping(["Name", "Budget", "City"]);
  assert.equal(byField.phone, undefined);
});

test("empty header cells are ignored (not treated as unknown)", () => {
  const { unknownColumns } = buildColumnMapping(["Name", "", "  ", "Phone"]);
  assert.equal(unknownColumns.length, 0);
});

test("isHeaderLikeValue detects repeated header titles", () => {
  assert.equal(isHeaderLikeValue("phone", LEAD_FIELD_ALIASES.phone), true);
  assert.equal(isHeaderLikeValue("Mobile", LEAD_FIELD_ALIASES.phone), true);
  assert.equal(isHeaderLikeValue("+201001234567", LEAD_FIELD_ALIASES.phone), false);
});

test("normalizeHeader collapses formatting", () => {
  assert.equal(normalizeHeader("  Phone_Number-Field  "), "phone number field");
});
