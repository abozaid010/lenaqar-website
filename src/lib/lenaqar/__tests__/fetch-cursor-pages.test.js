import test from "node:test";
import assert from "node:assert/strict";
import {
  fetchCursorPages,
  IncompleteCatalogError,
} from "../fetch-cursor-pages.js";

const defaultLimits = {
  maxPages: 100,
  maxRecords: 5000,
  maxDurationMs: 120_000,
};

function page(records, hasMore = false, nextCursor) {
  return { records, hasMore, nextCursor };
}

test("fetches and deduplicates all 613 records across 39 pages", async () => {
  const records = Array.from({ length: 613 }, (_, index) => ({ code: `OPP-${index}` }));
  const cursors = [];
  const result = await fetchCursorPages({
    ...defaultLimits,
    getRecordKey: (record) => record.code,
    fetchPage: async (cursor) => {
      cursors.push(cursor);
      const pageIndex = cursors.length - 1;
      const items = records.slice(pageIndex * 16, (pageIndex + 1) * 16);
      return page(items, pageIndex < 38, pageIndex < 38 ? `cursor-${pageIndex + 1}` : undefined);
    },
  });

  assert.equal(cursors.length, 39);
  assert.equal(result.length, 613);
  assert.equal(new Set(result.map((record) => record.code)).size, 613);
  assert.equal(cursors[0], null);
  assert.equal(cursors[38], "cursor-38");
});

test("deduplicates repeated records while continuing through pages", async () => {
  let pageIndex = 0;
  const result = await fetchCursorPages({
    ...defaultLimits,
    getRecordKey: (record) => record.code,
    fetchPage: async () => {
      pageIndex += 1;
      return page(
        pageIndex === 1 ? [{ code: "A" }, { code: "B" }] : [{ code: "B" }, { code: "C" }],
        pageIndex === 1,
        pageIndex === 1 ? "next" : undefined,
      );
    },
  });

  assert.deepEqual(result.map((record) => record.code), ["A", "B", "C"]);
});

test("rejects a has-more page without a cursor", async () => {
  await assert.rejects(
    fetchCursorPages({
      ...defaultLimits,
      getRecordKey: (record) => record.code,
      fetchPage: async () => page([{ code: "A" }], true),
    }),
    /reports more results without a cursor/,
  );
});

test("rejects a repeated cursor instead of looping", async () => {
  let pageIndex = 0;
  await assert.rejects(
    fetchCursorPages({
      ...defaultLimits,
      getRecordKey: (record) => record.code,
      fetchPage: async () => {
        pageIndex += 1;
        return page([{ code: `R-${pageIndex}` }], true, "same-cursor");
      },
    }),
    IncompleteCatalogError,
  );
  assert.equal(pageIndex, 2);
});

test("accepts an empty final page", async () => {
  let pageIndex = 0;
  const result = await fetchCursorPages({
    ...defaultLimits,
    getRecordKey: (record) => record.code,
    fetchPage: async () => {
      pageIndex += 1;
      return page(pageIndex === 1 ? [{ code: "A" }] : [], pageIndex === 1, "next");
    },
  });

  assert.equal(pageIndex, 2);
  assert.deepEqual(result.map((record) => record.code), ["A"]);
});

test("rejects an intermediate page failure", async () => {
  let pageIndex = 0;
  await assert.rejects(
    fetchCursorPages({
      ...defaultLimits,
      getRecordKey: (record) => record.code,
      fetchPage: async () => {
        pageIndex += 1;
        if (pageIndex === 2) throw new Error("upstream unavailable");
        return page([{ code: "A" }], true, "next");
      },
    }),
    /upstream unavailable/,
  );
});

test("fails visibly when a resource ceiling would truncate the catalog", async () => {
  let pageIndex = 0;
  await assert.rejects(
    fetchCursorPages({
      ...defaultLimits,
      maxPages: 2,
      getRecordKey: (record) => record.code,
      fetchPage: async () => {
        pageIndex += 1;
        return page([{ code: `R-${pageIndex}` }], true, `cursor-${pageIndex}`);
      },
    }),
    /2-page safety limit/,
  );
  assert.equal(pageIndex, 2);
});

test("fails visibly when the elapsed-time ceiling is reached", async () => {
  let time = 0;
  await assert.rejects(
    fetchCursorPages({
      ...defaultLimits,
      maxDurationMs: 10,
      now: () => time,
      getRecordKey: (record) => record.code,
      fetchPage: async () => {
        time = 10;
        return page([{ code: "A" }], false);
      },
    }),
    /10ms time limit/,
  );
});

test("rejects malformed empty responses and records without unique codes", async () => {
  const options = {
    ...defaultLimits,
    getRecordKey: (record) => record.code,
  };
  await assert.rejects(
    fetchCursorPages({ ...options, fetchPage: async () => null }),
    /invalid response/,
  );
  await assert.rejects(
    fetchCursorPages({ ...options, fetchPage: async () => page([{}]) }),
    /without a unique code/,
  );
});
