/**
 * Run: node --test src/lib/__tests__/seo-health-jsonld.test.js
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { checkJsonLd, missingTypes } from "../../../scripts/lib/jsonld-check.mjs";

const ld = (obj) => `<script type="application/ld+json">${typeof obj === "string" ? obj : JSON.stringify(obj)}</script>`;
const faq = (...pairs) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: pairs.map(([name, text]) => ({
    "@type": "Question",
    name,
    acceptedAnswer: text === undefined ? { "@type": "Answer" } : { "@type": "Answer", text },
  })),
});

test("valid blocks report their types and no problems", () => {
  const html = ld({ "@type": "Organization" }) + ld([{ "@type": "WebSite" }, faq(["س", "ج"])]);
  assert.deepEqual(checkJsonLd(html), {
    blocks: 2,
    types: ["FAQPage", "Organization", "WebSite"],
    problems: [],
  });
});

test("the 2026-11-15 bug: an FAQ answer without text is a problem", () => {
  const html = ld(faq(["العقد الابتدائي كفاية؟", "لا"], ["التسجيل إجباري؟", undefined], ["فاضي", "  "]));
  assert.deepEqual(checkJsonLd(html).problems, [
    'FAQPage "التسجيل إجباري؟": answer without text',
    'FAQPage "فاضي": answer without text',
  ]);
});

test("invalid JSON, empty FAQ and nameless questions are problems", () => {
  const html =
    ld("{not json") +
    ld({ "@type": "FAQPage", mainEntity: [] }) +
    ld(faq(["", "ج"]));
  assert.deepEqual(checkJsonLd(html).problems, [
    "block 1: invalid JSON",
    "FAQPage without questions",
    "FAQPage question 1: no name",
  ]);
});

test("@graph nodes and array types are read", () => {
  const html = ld({ "@context": "https://schema.org", "@graph": [{ "@type": ["Article", "NewsArticle"] }, { "@type": "BreadcrumbList" }] });
  assert.deepEqual(checkJsonLd(html).types, ["Article", "BreadcrumbList", "NewsArticle"]);
});

test("missingTypes lists only expected types that are absent", () => {
  assert.deepEqual(missingTypes(["Article", "WebSite"], ["Article", "FAQPage", "WebSite"]), ["FAQPage"]);
  assert.deepEqual(missingTypes([], []), []);
  assert.deepEqual(checkJsonLd("<html></html>"), { blocks: 0, types: [], problems: [] });
});
