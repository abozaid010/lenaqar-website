import test from "node:test";
import assert from "node:assert/strict";
import { createSwrMemo, sharedSwrMemo } from "../swr-memo.js";
import { IncompleteCatalogError } from "../fetch-cursor-pages.js";

function clock(start = 1_000_000) {
  let t = start;
  return {
    now: () => t,
    advance: (ms) => {
      t += ms;
    },
  };
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const flush = () => new Promise((resolve) => setImmediate(resolve));

test("first call waits for the load; fresh calls reuse the value without loading", async () => {
  const c = clock();
  let loads = 0;
  const memo = createSwrMemo({
    load: async (key) => {
      loads += 1;
      return `${key}-v${loads}`;
    },
    freshMs: 1000,
    maxStaleMs: 10_000,
    now: c.now,
  });

  assert.equal(await memo.get("all"), "all-v1");
  c.advance(999);
  assert.equal(await memo.get("all"), "all-v1");
  assert.equal(loads, 1);
});

test("concurrent cold callers share one in-flight load", async () => {
  const gate = deferred();
  let loads = 0;
  const memo = createSwrMemo({
    load: () => {
      loads += 1;
      return gate.promise;
    },
    freshMs: 1000,
    maxStaleMs: 10_000,
  });

  const a = memo.get("all");
  const b = memo.get("all");
  gate.resolve(["unit"]);
  assert.deepEqual(await a, ["unit"]);
  assert.equal(await b, await a);
  assert.equal(loads, 1);
});

test("a stale value is returned at once while one background refresh runs", async () => {
  const c = clock();
  const gates = [];
  const memo = createSwrMemo({
    load: () => {
      const gate = deferred();
      gates.push(gate);
      return gate.promise;
    },
    freshMs: 1000,
    maxStaleMs: 10_000,
    now: c.now,
  });

  const first = memo.get("all");
  await flush();
  gates[0].resolve("v1");
  assert.equal(await first, "v1");

  c.advance(1500);
  // Stale: answered immediately with v1 although the refresh has not finished.
  assert.equal(await memo.get("all"), "v1");
  assert.equal(await memo.get("all"), "v1");
  await flush();
  assert.equal(gates.length, 2, "exactly one background refresh");
  assert.equal(memo.peek("all").loading, true);

  gates[1].resolve("v2");
  await flush();
  assert.equal(await memo.get("all"), "v2");
  assert.equal(gates.length, 2, "fresh again after the refresh");
});

test("a failed background refresh keeps serving the last complete value and retries later", async () => {
  const c = clock();
  const errors = [];
  let call = 0;
  const memo = createSwrMemo({
    load: async () => {
      call += 1;
      if (call === 2) throw new IncompleteCatalogError("Catalog exceeded the 320-page safety limit");
      return `v${call}`;
    },
    freshMs: 1000,
    maxStaleMs: 10_000,
    now: c.now,
    onBackgroundError: (error, key) => errors.push([error.name, key]),
  });

  assert.equal(await memo.get("all"), "v1");
  c.advance(1500);
  assert.equal(await memo.get("all"), "v1");
  await flush();
  assert.deepEqual(errors, [["IncompleteCatalogError", "all"]]);
  // The partial result never replaced v1; the next stale read refreshes again.
  assert.equal(await memo.get("all"), "v1");
  await flush();
  assert.equal(await memo.get("all"), "v3");
});

test("a cold load that fails is not cached and the error reaches the caller", async () => {
  let call = 0;
  const memo = createSwrMemo({
    load: async () => {
      call += 1;
      if (call === 1) throw new IncompleteCatalogError("Catalog page 3 had an invalid response");
      return "ok";
    },
    freshMs: 1000,
    maxStaleMs: 10_000,
  });

  await assert.rejects(memo.get("all"), IncompleteCatalogError);
  assert.equal(memo.peek("all"), null);
  assert.equal(await memo.get("all"), "ok");
});

test("past maxStaleMs callers wait for a fresh load instead of reading very old data", async () => {
  const c = clock();
  let call = 0;
  const memo = createSwrMemo({
    load: async () => {
      call += 1;
      return `v${call}`;
    },
    freshMs: 1000,
    maxStaleMs: 5000,
    now: c.now,
  });

  assert.equal(await memo.get("all"), "v1");
  c.advance(5000);
  assert.equal(await memo.get("all"), "v2");
});

test("keys are independent and the least recently used key is evicted", async () => {
  let loads = 0;
  const memo = createSwrMemo({
    load: async (key) => {
      loads += 1;
      return key;
    },
    freshMs: 1000,
    maxStaleMs: 10_000,
    maxEntries: 2,
  });

  await memo.get("a");
  await memo.get("b");
  await memo.get("a"); // a is now most recent
  await memo.get("c"); // evicts b
  assert.equal(memo.size, 2);
  assert.equal(memo.peek("b"), null);
  assert.ok(memo.peek("a"));
  assert.equal(loads, 3);
});

test("warm starts a load without waiting, and a caller joins it", async () => {
  const gate = deferred();
  let loads = 0;
  const memo = createSwrMemo({
    load: () => {
      loads += 1;
      return gate.promise;
    },
    freshMs: 1000,
    maxStaleMs: 10_000,
  });

  memo.warm("all");
  assert.equal(memo.peek("all").loading, true);
  const reader = memo.get("all");
  gate.resolve("warm");
  assert.equal(await reader, "warm");
  assert.equal(loads, 1);
});

test("warm reports a failed load instead of leaving an unhandled rejection", async () => {
  const errors = [];
  const memo = createSwrMemo({
    load: async () => {
      throw new Error("api down");
    },
    freshMs: 1000,
    maxStaleMs: 10_000,
    onBackgroundError: (error) => errors.push(error.message),
  });

  memo.warm("all");
  await flush();
  assert.deepEqual(errors, ["api down"]);
});

test("sharedSwrMemo returns one memo per name across module copies", () => {
  const options = { load: async () => 1, freshMs: 1000, maxStaleMs: 10_000 };
  const a = sharedSwrMemo("test-shared", options);
  const b = sharedSwrMemo("test-shared", options);
  assert.equal(a, b);
  assert.notEqual(sharedSwrMemo("test-shared-other", options), a);
});

test("rejects invalid options", () => {
  assert.throws(() => createSwrMemo({ freshMs: 1, maxStaleMs: 1 }), TypeError);
  assert.throws(
    () => createSwrMemo({ load: async () => 1, freshMs: 10, maxStaleMs: 5 }),
    TypeError,
  );
});
