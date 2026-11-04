import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";

/**
 * A loading.jsx above a route wraps its page in Suspense, so the 200 shell is
 * flushed before the page can call notFound(). That turned every missing
 * listing and guide into a soft 404 (HTTP 200 + noindex). Verified 2026-11-04:
 * removing these boundaries restores real 404s. Do not re-add them without a
 * not-found status check on /opportunities/<unknown> and /guides/buying/<unknown>.
 */
const BOUNDARIES_THAT_HIDE_404 = [
  "src/app/loading.jsx",
  "src/app/(lenaqar)/loading.jsx",
  "src/app/(lenaqar)/opportunities/loading.jsx",
  "src/app/(lenaqar)/opportunities/[slug]/loading.jsx",
  "src/app/(lenaqar)/guides/loading.jsx",
];

const ROOT = new URL("../../../../", import.meta.url);

for (const path of BOUNDARIES_THAT_HIDE_404) {
  test(`no Suspense loading boundary at ${path} (keeps real 404 status)`, () => {
    assert.ok(!existsSync(new URL(path, ROOT)), `${path} would turn notFound() into HTTP 200`);
  });
}
