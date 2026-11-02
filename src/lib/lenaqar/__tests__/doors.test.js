/**
 * Run: node --test src/lib/lenaqar/__tests__/doors.test.js
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DOORS, DOOR_SLUGS, getDoor } from "../doors.js";

describe("doors", () => {
  it("exposes the four Phase 2 door slugs", () => {
    assert.deepEqual(
      DOORS.map((d) => d.slug),
      DOOR_SLUGS,
    );
  });

  it("each door has SEO fields and no draft markers", () => {
    for (const door of DOORS) {
      assert.ok(door.href.startsWith("/"));
      assert.ok(door.title.length > 10);
      assert.ok(door.h1.length > 10);
      assert.ok(door.description.length > 20);
      assert.ok(door.intro.length > 40);
      assert.ok(door.bullets.length >= 3);
      assert.ok(door.faq.length >= 2);
      const blob = JSON.stringify(door);
      assert.equal(blob.includes("VERIFY"), false);
      assert.equal(blob.includes("مسودة"), false);
      assert.equal(blob.includes("تحت المراجعة"), false);
    }
  });

  it("getDoor resolves known slugs", () => {
    assert.equal(getDoor("no-calls")?.href, "/no-calls");
    assert.equal(getDoor("missing"), null);
  });
});
