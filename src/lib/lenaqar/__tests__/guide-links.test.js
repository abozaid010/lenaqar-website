/**
 * Run: node --test src/lib/lenaqar/__tests__/guide-links.test.js
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import {
  canonicalGuidePath,
  pickIndexableGuideLinks,
} from "../../guides/related-links.js";
import {
  areaGuideHrefsForUnit,
  guideAreaForUnit,
} from "../../guides/area-guides.js";
import { BUYER_LANDINGS } from "../buyer-landings.js";

const CONTENT_ROOT = path.join(process.cwd(), "content", "guides");

/** Same walk + front matter shape as src/lib/guides/load.js (which needs Next aliases). */
function readGuides(dir = CONTENT_ROOT, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith("_")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) readGuides(full, out);
    else if (entry.name.endsWith(".md")) {
      const { data, content } = matter(fs.readFileSync(full, "utf8"));
      out.push({ ...data, body: content.trim() });
    }
  }
  return out;
}

const published = (extra) => ({
  status: "published",
  title: "عنوان",
  ...extra,
});

test("canonicalGuidePath drops the trailing slash that 308-redirects", () => {
  assert.equal(canonicalGuidePath("/guides/madinaty/"), "/guides/madinaty");
  assert.equal(canonicalGuidePath("guides/madinaty"), "/guides/madinaty");
  assert.equal(canonicalGuidePath(""), "");
});

test("pickIndexableGuideLinks keeps order, dedupes and skips non-guides", () => {
  const guides = [
    published({ slug: "/guides/a/", title: "A" }),
    published({ slug: "/guides/b/", title: "B" }),
  ];
  const links = pickIndexableGuideLinks(
    ["/guides/b/", "/apartments-for-sale/x", "/guides/a", "/guides/b"],
    guides,
  );
  assert.deepEqual(links, [
    { href: "/guides/b", title: "B" },
    { href: "/guides/a", title: "A" },
  ]);
});

test("pickIndexableGuideLinks skips noindex, draft and unknown guides", () => {
  const guides = [
    published({ slug: "/guides/off/", seo_index: false }),
    published({ slug: "/guides/marker/", body: "*(البند ده لسه تحت المراجعة)*" }),
    { slug: "/guides/draft/", status: "draft", title: "D" },
    { slug: "/guides/later/", status: "scheduled", date_planned: "2999-01-01", title: "L" },
    published({ slug: "/guides/ok/", title: "OK" }),
  ];
  const links = pickIndexableGuideLinks(
    ["/guides/off", "/guides/marker", "/guides/draft", "/guides/later", "/guides/missing", "/guides/ok"],
    guides,
  );
  assert.deepEqual(links, [{ href: "/guides/ok", title: "OK" }]);
});

test("guideAreaForUnit maps known feed tokens only, district first", () => {
  assert.equal(guideAreaForUnit({ city: "new cairo", district: "madinaty" }), "madinaty");
  assert.equal(guideAreaForUnit({ city: "New Cairo", district: "hyde park" }), "new-cairo");
  assert.equal(guideAreaForUnit({ city: "6 october city" }), "6th-of-october");
  assert.equal(guideAreaForUnit({ city: "el shorouk city" }), "el-shorouk");
  assert.equal(guideAreaForUnit({ city: "north coast", district: "marina" }), null);
  assert.equal(guideAreaForUnit({}), null);
  assert.deepEqual(areaGuideHrefsForUnit({ district: "fifth settlement" }), [
    "/guides/fifth-settlement/prices-2026",
    "/guides/fifth-settlement",
  ]);
});

test("every mapped guide area has a hub and a price guide in content/guides", () => {
  const areas = new Set(
    [
      "madinaty", "el shorouk", "mostakbal city", "fifth settlement",
      "new cairo", "sheikh zayed", "6th of october",
    ].map((city) => guideAreaForUnit({ city })),
  );
  for (const area of areas) {
    assert.ok(fs.existsSync(path.join(CONTENT_ROOT, area, "index.md")), `${area}/index.md`);
    assert.ok(fs.existsSync(path.join(CONTENT_ROOT, area, "prices-2026.md")), `${area}/prices-2026.md`);
  }
});

test("area landings link their indexable price guide and hub (real content)", () => {
  const guides = readGuides();
  for (const area of ["madinaty", "el-shorouk", "new-cairo", "fifth-settlement"]) {
    const landing = BUYER_LANDINGS.find((p) => p.href === `/apartments-for-sale/${area}`);
    const hrefs = pickIndexableGuideLinks(landing.related, guides).map((l) => l.href);
    assert.ok(hrefs.includes(`/guides/${area}/prices-2026`), `${area} price guide`);
    assert.ok(hrefs.includes(`/guides/${area}`), `${area} hub`);
    assert.ok(!hrefs.some((h) => h.startsWith("/guides/compare/")), `${area}: unfinished compare guide linked`);
  }
});

test("every guide href in landing data points at an existing guide file", () => {
  const known = new Set(readGuides().map((g) => canonicalGuidePath(g.slug)));
  for (const landing of BUYER_LANDINGS) {
    for (const href of landing.related || []) {
      if (!href.startsWith("/guides/")) continue;
      assert.ok(known.has(canonicalGuidePath(href)), `${landing.href} → ${href}`);
    }
  }
});
