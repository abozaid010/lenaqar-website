/**
 * Fetch a cursor-paginated catalog to exhaustion under explicit resource bounds.
 * A bound or malformed response is an error, never a successful partial result.
 */
export class IncompleteCatalogError extends Error {
  constructor(message) {
    super(message);
    this.name = "IncompleteCatalogError";
  }
}

export async function fetchCursorPages({
  fetchPage,
  getRecordKey,
  maxPages,
  maxRecords,
  maxDurationMs,
  now = Date.now,
}) {
  if (typeof fetchPage !== "function" || typeof getRecordKey !== "function") {
    throw new TypeError("fetchPage and getRecordKey are required");
  }
  if (![maxPages, maxRecords, maxDurationMs].every((value) => Number.isFinite(value) && value > 0)) {
    throw new TypeError("Catalog page, record, and duration limits must be positive numbers");
  }

  const startedAt = now();
  const records = [];
  const seenKeys = new Set();
  const seenCursors = new Set();
  let cursor = null;
  let pages = 0;
  let rawRecords = 0;

  while (true) {
    if (pages >= maxPages) {
      throw new IncompleteCatalogError(`Catalog exceeded the ${maxPages}-page safety limit`);
    }
    if (now() - startedAt >= maxDurationMs) {
      throw new IncompleteCatalogError(`Catalog exceeded the ${maxDurationMs}ms time limit`);
    }
    if (cursor != null) {
      if (typeof cursor !== "string" || cursor.length === 0) {
        throw new IncompleteCatalogError("Catalog returned an invalid next cursor");
      }
      if (seenCursors.has(cursor)) {
        throw new IncompleteCatalogError("Catalog repeated a cursor");
      }
      seenCursors.add(cursor);
    }

    const page = await fetchPage(cursor);
    pages += 1;
    if (now() - startedAt >= maxDurationMs) {
      throw new IncompleteCatalogError(`Catalog exceeded the ${maxDurationMs}ms time limit`);
    }
    if (!page || !Array.isArray(page.records) || typeof page.hasMore !== "boolean") {
      throw new IncompleteCatalogError(`Catalog page ${pages} had an invalid response`);
    }

    rawRecords += page.records.length;
    if (rawRecords > maxRecords) {
      throw new IncompleteCatalogError(`Catalog exceeded the ${maxRecords}-record safety limit`);
    }

    for (const record of page.records) {
      const key = getRecordKey(record);
      if (key == null || String(key).trim() === "") {
        throw new IncompleteCatalogError(`Catalog page ${pages} contained a record without a unique code`);
      }
      const normalizedKey = String(key).trim();
      if (!seenKeys.has(normalizedKey)) {
        seenKeys.add(normalizedKey);
        records.push(record);
      }
    }

    if (!page.hasMore) return records;
    if (typeof page.nextCursor !== "string" || page.nextCursor.length === 0) {
      throw new IncompleteCatalogError(`Catalog page ${pages} reports more results without a cursor`);
    }
    if (seenCursors.has(page.nextCursor) || page.nextCursor === cursor) {
      throw new IncompleteCatalogError("Catalog repeated a cursor");
    }
    cursor = page.nextCursor;
  }
}
