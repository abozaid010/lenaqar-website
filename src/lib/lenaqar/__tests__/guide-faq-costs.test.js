/**
 * Run: node --test src/lib/lenaqar/__tests__/guide-faq-costs.test.js
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { answeredFaq, isSearchIndexable } from "../../guides/seo-trust.js";
import { isPubliclyVisible } from "../../guides/status.js";

const CONTENT_ROOT = path.join(process.cwd(), "content", "guides");

function readGuides(dir = CONTENT_ROOT, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith("_")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) readGuides(full, out);
    else if (entry.name.endsWith(".md")) {
      const { data, content } = matter(fs.readFileSync(full, "utf8"));
      out.push({ ...data, body: content.trim(), file: full });
    }
  }
  return out;
}

test("answeredFaq drops items without a question or an answer", () => {
  assert.deepEqual(
    answeredFaq([
      { q: "سؤال", a: "إجابة" },
      { q: "فاضي", a: "" },
      { q: "مسافات", a: "   " },
      { q: "", a: "إجابة بلا سؤال" },
      { question: "بديل", answer: "نعم" },
      null,
    ]),
    [{ q: "سؤال", a: "إجابة" }, { question: "بديل", answer: "نعم" }],
  );
  assert.deepEqual(answeredFaq(undefined), []);
});

test("no indexable guide ships an FAQ item without an answer", () => {
  for (const guide of readGuides()) {
    if (!isPubliclyVisible(guide) || !isSearchIndexable(guide)) continue;
    for (const item of guide.faq || []) {
      const answer = String(item.a || item.answer || "").trim();
      assert.ok(answer, `${path.relative(CONTENT_ROOT, guide.file)}: "${item.q}" has no answer`);
    }
  }
});

test("contract checklist stays indexable and carries the sourced cost section", () => {
  const guide = readGuides().find((g) => g.slug === "/guides/buying/contract-registration-checklist/");
  assert.ok(guide);
  assert.ok(isPubliclyVisible(guide) && isSearchIndexable(guide), "checklist must stay indexable");
  assert.match(guide.body, /## التكاليف اللي غير سعر الشقة/);
  assert.match(guide.body, /2\.5%/);
  // Every fee figure in the section points at an official source.
  assert.ok(guide.sources.some((s) => s.type === "official" && s.url.includes("eta.gov.eg")));
  assert.ok(guide.sources.some((s) => s.type === "official" && s.url.includes("realestate.gov.eg")));
});
