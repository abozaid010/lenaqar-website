import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readdir, rm, utimes, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createFileSnapshotStore } from "../snapshot-store.js";
import { createSwrMemo } from "../swr-memo.js";

async function tempDir(t) {
  const dir = await mkdtemp(path.join(tmpdir(), "lenaqar-snapshot-"));
  t.after(() => rm(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 20 }));
  return dir;
}

const flush = () => new Promise((resolve) => setImmediate(resolve));

test("write then read returns the value and its original fetchedAt", async (t) => {
  const dir = await tempDir(t);
  const store = createFileSnapshotStore({ dir, name: "catalog", version: "build-1" });
  assert.equal(await store.read("all"), null);

  await store.write("all", [{ code: "A" }], 1234);
  assert.deepEqual(await store.read("all"), { value: [{ code: "A" }], fetchedAt: 1234 });
  // Atomic write leaves no temp files behind.
  assert.deepEqual(await readdir(dir), ["catalog-all-build-1.json"]);
});

test("a snapshot from another build is never read", async (t) => {
  const dir = await tempDir(t);
  await createFileSnapshotStore({ dir, name: "catalog", version: "old" }).write("all", [1], 1);
  const store = createFileSnapshotStore({ dir, name: "catalog", version: "new" });
  assert.equal(await store.read("all"), null);
});

test("serialize/deserialize round-trip Maps", async (t) => {
  const dir = await tempDir(t);
  const store = createFileSnapshotStore({
    dir,
    name: "maps",
    version: "b",
    serialize: (m) => [...m],
    deserialize: (data) => new Map(data),
  });
  await store.write("maps", new Map([["madinaty", "مدينتي"]]), 5);
  const { value } = await store.read("maps");
  assert.equal(value.get("madinaty"), "مدينتي");
});

test("a corrupt or rejected snapshot makes read throw (the memo reports it and walks)", async (t) => {
  const dir = await tempDir(t);
  const store = createFileSnapshotStore({
    dir,
    name: "catalog",
    version: "b",
    deserialize: () => {
      throw new Error("not a list of units");
    },
  });
  await writeFile(store.fileFor("all"), "{not json", "utf8");
  await assert.rejects(store.read("all"), SyntaxError);
  await store.write("all", {}, 1);
  await assert.rejects(store.read("all"), /not a list of units/);
});

test("writing prunes other builds' files only once they are old", async (t) => {
  const dir = await tempDir(t);
  let clock = 10_000_000;
  const now = () => clock;
  await createFileSnapshotStore({ dir, name: "catalog", version: "old", now }).write("all", [], 1);
  const store = createFileSnapshotStore({
    dir,
    name: "catalog",
    version: "new",
    now,
    pruneOtherVersionsAfterMs: 60_000,
  });

  // Same moment: the other colour's file stays (blue/green overlap).
  clock = Date.now();
  await store.write("all", [], 2);
  assert.equal((await readdir(dir)).length, 2);

  const old = path.join(dir, "catalog-all-old.json");
  const past = new Date(Date.now() - 120_000);
  await utimes(old, past, past);
  await store.write("all", [], 3);
  assert.deepEqual(await readdir(dir), ["catalog-all-new.json"]);
});

test("memo with persist: a restart serves the saved value without loading", async (t) => {
  const dir = await tempDir(t);
  const store = createFileSnapshotStore({ dir, name: "catalog", version: "b" });
  let clock = 1_000_000;
  const now = () => clock;
  let loads = 0;
  const options = {
    load: async () => {
      loads += 1;
      return [{ code: `v${loads}` }];
    },
    freshMs: 1000,
    maxStaleMs: 10_000,
    now,
    persist: store,
  };

  const first = createSwrMemo(options);
  assert.deepEqual(await first.get("all"), [{ code: "v1" }]);
  // The save is fire-and-forget; wait for it to land.
  for (let i = 0; i < 100 && !(await store.read("all")); i += 1) await flush();

  // "Restart": a new memo (empty memory) on the same directory.
  clock += 500;
  const restarted = createSwrMemo(options);
  assert.deepEqual(await restarted.get("all"), [{ code: "v1" }]);
  assert.equal(loads, 1, "fresh snapshot: no walk");
  assert.equal(restarted.peek("all").fetchedAt, 1_000_000);
});

test("memo with persist: a stale snapshot is served at once and refreshed in the background", async (t) => {
  const dir = await tempDir(t);
  const store = createFileSnapshotStore({ dir, name: "catalog", version: "b" });
  await store.write("all", [{ code: "saved" }], 1_000_000);

  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  const memo = createSwrMemo({
    load: () => gate.then(() => [{ code: "fresh" }]),
    freshMs: 1000,
    maxStaleMs: 10_000,
    now: () => 1_005_000,
    persist: store,
  });

  assert.deepEqual(await memo.get("all"), [{ code: "saved" }]);
  assert.equal(memo.peek("all").loading, true);
  release();
  await flush();
  await flush();
  assert.deepEqual(await memo.get("all"), [{ code: "fresh" }]);
  // The refreshed value is saved too (and the test waits for that write).
  for (let i = 0; i < 100 && (await store.read("all"))?.value?.[0]?.code !== "fresh"; i += 1) {
    await flush();
  }
  assert.deepEqual((await store.read("all")).value, [{ code: "fresh" }]);
});

test("memo with persist: a snapshot past maxStaleMs is ignored and callers wait for a load", async (t) => {
  const dir = await tempDir(t);
  const store = createFileSnapshotStore({ dir, name: "catalog", version: "b" });
  await store.write("all", [{ code: "ancient" }], 1);
  const memo = createSwrMemo({
    load: async () => [{ code: "loaded" }],
    freshMs: 1000,
    maxStaleMs: 10_000,
    now: () => 1_000_000,
    persist: store,
  });
  assert.deepEqual(await memo.get("all"), [{ code: "loaded" }]);
});

test("memo with persist: read and write failures are reported, never thrown", async () => {
  const errors = [];
  const memo = createSwrMemo({
    load: async () => "loaded",
    freshMs: 1000,
    maxStaleMs: 10_000,
    onBackgroundError: (error) => errors.push(error.message),
    persist: {
      read: async () => {
        throw new Error("read failed");
      },
      write: async () => {
        throw new Error("write failed");
      },
    },
  });
  assert.equal(await memo.get("all"), "loaded");
  await flush();
  assert.deepEqual(errors, ["read failed", "write failed"]);
});

test("memo with persist: concurrent first callers share one snapshot read", async () => {
  let reads = 0;
  let loads = 0;
  const memo = createSwrMemo({
    load: async () => {
      loads += 1;
      return "loaded";
    },
    freshMs: 1000,
    maxStaleMs: 10_000,
    now: () => 1000,
    persist: {
      read: async () => {
        reads += 1;
        return { value: "saved", fetchedAt: 900 };
      },
      write: async () => {},
    },
  });
  const [a, b] = await Promise.all([memo.get("all"), memo.get("all")]);
  assert.equal(a, "saved");
  assert.equal(b, "saved");
  assert.equal(reads, 1);
  assert.equal(loads, 0);
});
