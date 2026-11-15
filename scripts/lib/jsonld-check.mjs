/**
 * Structured-data checks on raw HTML, dependency-free (used by seo-health.mjs).
 *
 * Catches what broke on 2026-11-15: an FAQPage `Answer` without `text` on a live
 * guide. Search engines drop or flag such items, so they are FAILs here.
 */

const LD_JSON_RE = /<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g;

function flatten(node, out = []) {
  if (Array.isArray(node)) {
    for (const item of node) flatten(item, out);
  } else if (node && typeof node === "object") {
    out.push(node);
    if (Array.isArray(node["@graph"])) flatten(node["@graph"], out);
  }
  return out;
}

function typesOf(node) {
  const t = node["@type"];
  return Array.isArray(t) ? t.map(String) : t ? [String(t)] : [];
}

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * @param {string} html
 * @returns {{ blocks: number, types: string[], problems: string[] }}
 */
export function checkJsonLd(html) {
  const problems = [];
  const nodes = [];
  let blocks = 0;
  for (const match of String(html || "").matchAll(LD_JSON_RE)) {
    blocks += 1;
    try {
      flatten(JSON.parse(match[1]), nodes);
    } catch {
      problems.push(`block ${blocks}: invalid JSON`);
    }
  }

  for (const node of nodes) {
    if (!typesOf(node).includes("FAQPage")) continue;
    const questions = Array.isArray(node.mainEntity) ? node.mainEntity : node.mainEntity ? [node.mainEntity] : [];
    if (!questions.length) problems.push("FAQPage without questions");
    questions.forEach((q, i) => {
      const name = text(q?.name);
      if (!name) problems.push(`FAQPage question ${i + 1}: no name`);
      const answer = Array.isArray(q?.acceptedAnswer) ? q.acceptedAnswer[0] : q?.acceptedAnswer;
      if (!text(answer?.text)) problems.push(`FAQPage "${name || i + 1}": answer without text`);
    });
  }

  const types = [...new Set(nodes.flatMap(typesOf))].sort();
  return { blocks, types, problems };
}

/** Expected types missing from a page. */
export function missingTypes(found, expected = []) {
  const have = new Set(found);
  return expected.filter((type) => !have.has(type));
}
