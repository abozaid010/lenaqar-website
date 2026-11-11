/** Run with: node --test src/lib/lenaqar/__tests__/requirement-feed.test.js */
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  publicRequirementsQuery,
  parseRequirementSort,
} from "../requirement-sort.js";
import { createRequirementFeedLoader } from "../requirement-feed-client.js";

const row = (id) => ({
  id,
  intent: "buy",
  locations: [{ city: "cairo" }],
  propertyTypes: ["apartment"],
});
const response = (rows) => ({
  ok: true,
  json: async () => ({ data: { requirements: rows } }),
});

test("sort query validates all modes and includes the default", () => {
  assert.equal(publicRequirementsQuery().get("sort"), "default");
  for (const sort of ["default", "newest", "highest_score"]) {
    const query = publicRequirementsQuery({ limit: 6, sort });
    assert.equal(query.get("sort"), sort);
    assert.equal(query.get("limit"), "6");
  }
  for (const sort of ["oldest", "", null, ["newest"]]) {
    assert.throws(() => parseRequirementSort(sort), RangeError);
  }
});

test("selector loads six backend-sorted cards and emits loading then success", async () => {
  const events = [];
  const rows = [row("bbbbbbbbbbbb"), row("aaaaaaaaaaaa")];
  const loader = createRequirementFeedLoader({
    fetcher: async (url) => {
      assert.equal(url, "/api/lenaqar/requirements?limit=6&sort=newest");
      return response(rows);
    },
    onStart: () => events.push("loading"),
    onSuccess: (value) => events.push(value),
    onError: () => assert.fail("unexpected error"),
  });
  await loader.load("newest");
  assert.deepEqual(events, ["loading", rows]);
});

test("rapid changes cancel old requests and ignore late responses", async () => {
  const pending = [];
  const successes = [];
  const loader = createRequirementFeedLoader({
    fetcher: (url, options) =>
      new Promise((resolve) =>
        pending.push({ resolve, signal: options.signal })
      ),
    onStart: () => {},
    onSuccess: (rows) => successes.push(rows),
    onError: () => assert.fail("stale failure must not update the UI"),
  });
  const oldRequest = loader.load("newest");
  const currentRequest = loader.load("highest_score");
  assert.equal(pending[0].signal.aborted, true);
  const currentRows = [row("cccccccccccc")];
  pending[1].resolve(response(currentRows));
  await currentRequest;
  pending[0].resolve(response([row("aaaaaaaaaaaa")]));
  await oldRequest;
  assert.deepEqual(successes, [currentRows]);
});

test("cancellation on unmount suppresses updates", async () => {
  let finish;
  const loader = createRequirementFeedLoader({
    fetcher: () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
    onStart: () => {},
    onSuccess: () => assert.fail("unmounted update"),
    onError: () => assert.fail("unmounted update"),
  });
  const request = loader.load("newest");
  loader.cancel();
  finish(response([]));
  await request;
});

test("HTTP, API, malformed payload and network errors show the error state and allow retry", async () => {
  const failures = [
    async () => ({ ok: false, json: async () => ({}) }),
    async () => ({
      ok: true,
      json: async () => ({ data: { error: "unavailable", requirements: [] } }),
    }),
    async () => ({ ok: true, json: async () => ({}) }),
    async () => {
      throw new Error("network");
    },
  ];
  for (const fail of failures) {
    let fetcher = fail;
    const events = [];
    const loader = createRequirementFeedLoader({
      fetcher: (...args) => fetcher(...args),
      onStart: () => events.push("loading"),
      onSuccess: () => events.push("success"),
      onError: () => events.push("error"),
    });
    await loader.load("default");
    fetcher = async () => response([]);
    await loader.load("default");
    assert.deepEqual(events, ["loading", "error", "loading", "success"]);
  }
});

// Load the actual server modules while replacing server-only transport imports.
// Native Node cannot resolve Next's @/ aliases outside its bundler.
async function loadServerModule(url, mocks) {
  const source = (await readFile(url, "utf8")).replace(
    /from "([^"]+)"/g,
    (match, specifier) => {
      const target = mocks[specifier];
      if (target)
        return `from ${JSON.stringify(`data:text/javascript,${encodeURIComponent(target)}`)}`;
      if (specifier.startsWith("."))
        return `from ${JSON.stringify(new URL(specifier, url).href)}`;
      throw new Error(`Unmocked server dependency: ${specifier}`);
    }
  );
  return import(`data:text/javascript,${encodeURIComponent(source)}`);
}

test("server loader forwards sort and preserves backend order after sanitizing", async () => {
  const requested = [];
  globalThis.__requirementFeedFetch = async (url) => {
    requested.push(url);
    return new Response(
      JSON.stringify({
        status: true,
        data: {
          requirements: [
            row("bbbbbbbbbbbb"),
            { ...row("aaaaaaaaaaaa"), roomsCount: 4, maxPrice: 5000000 },
            row("bbbbbbbbbbbb"),
            { ...row("cccccccccccc"), score: 99 },
          ],
        },
      })
    );
  };
  try {
    const { fetchPublicRequirements } = await loadServerModule(
      new URL("../requirements.server.js", import.meta.url),
      {
        react: "export const cache = fn => fn;",
        "@/lib/apiConfig":
          'export const API_BASE_URL="https://backend.test"; export const PUBLIC_X_API_KEY="test";',
        "@/lib/bffFetch":
          "export const bffFetch=(...args)=>globalThis.__requirementFeedFetch(...args); export const isCloudflareChallenge=()=>false;",
        "./arabic-labels.server": "export const catalogPlaceAr=value=>value;",
      }
    );
    for (const sort of ["default", "newest", "highest_score"]) {
      const result = await fetchPublicRequirements({ sort, limit: 6 });
      assert.equal(new URL(requested.at(-1)).searchParams.get("sort"), sort);
      assert.deepEqual(
        result.requirements.map((r) => r.id),
        ["bbbbbbbbbbbb", "aaaaaaaaaaaa"]
      );
      assert.equal(result.error, null);
    }
    await assert.rejects(
      fetchPublicRequirements({ sort: "oldest" }),
      RangeError
    );
    assert.equal(requested.length, 3);
  } finally {
    delete globalThis.__requirementFeedFetch;
  }
});

test("frontend API validates sort and forwards valid selections", async () => {
  const requested = [];
  globalThis.__requirementFeedLoad = async (options) => {
    requested.push(options);
    return { requirements: [row("bbbbbbbbbbbb")], error: null };
  };
  try {
    const { GET } = await loadServerModule(
      new URL(
        "../../../app/api/lenaqar/requirements/route.js",
        import.meta.url
      ),
      {
        "next/server": "export const NextResponse = Response;",
        "@/lib/lenaqar/requirements.server":
          "export const fetchPublicRequirements=(...args)=>globalThis.__requirementFeedLoad(...args);",
        "@/lib/lenaqar/requirement-sort": `export { parseRequirementSort } from ${JSON.stringify(new URL("../requirement-sort.js", import.meta.url).href)};`,
      }
    );
    for (const sort of ["default", "newest", "highest_score"]) {
      const result = await GET(
        new Request(
          `https://frontend.test/api/lenaqar/requirements?limit=6&sort=${sort}`
        )
      );
      assert.equal(result.status, 200);
      assert.deepEqual(requested.at(-1), { limit: 6, sort });
    }
    const invalid = await GET(
      new Request("https://frontend.test/api/lenaqar/requirements?sort=oldest")
    );
    assert.equal(invalid.status, 400);
    assert.equal(requested.length, 3);
    await GET(new Request("https://frontend.test/api/lenaqar/requirements"));
    assert.equal(requested.at(-1).sort, "default");
  } finally {
    delete globalThis.__requirementFeedLoad;
  }
});
