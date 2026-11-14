import { isPubliclyVisible } from "./status.js";
import { isSearchIndexable } from "./seo-trust.js";

/**
 * Internal links to Buyer Guides, limited to guides search engines may index.
 *
 * Pure (no fs) so it runs in node:test. `load.js` wraps it with the real guide
 * list. A guide that is noindex (draft markers, `seo_index: false`, not yet
 * published) is skipped, so a page never points crawlers or readers at an
 * unfinished guide; it starts showing up once the guide becomes indexable.
 */

/** "/guides/madinaty/" → "/guides/madinaty" (canonical form, no 308 hop). */
export function canonicalGuidePath(href) {
  let s = String(href || "").trim();
  if (!s) return "";
  if (!s.startsWith("/")) s = `/${s}`;
  return s.length > 1 ? s.replace(/\/+$/, "") : s;
}

/**
 * @param {string[]} hrefs candidate links in priority order (non-guide hrefs are ignored)
 * @param {object[]} guides guide front matter objects (`slug`, `title`, `status`, …)
 * @returns {{ href: string, title: string }[]}
 */
export function pickIndexableGuideLinks(hrefs, guides) {
  const bySlug = new Map(
    (guides || []).map((guide) => [canonicalGuidePath(guide.slug), guide]),
  );
  const seen = new Set();
  const links = [];
  for (const href of hrefs || []) {
    const path = canonicalGuidePath(href);
    if (!path.startsWith("/guides/") || seen.has(path)) continue;
    const guide = bySlug.get(path);
    if (!guide || !isPubliclyVisible(guide) || !isSearchIndexable(guide)) {
      continue;
    }
    const title = String(guide.title || "").trim();
    if (!title) continue;
    seen.add(path);
    links.push({ href: path, title });
  }
  return links;
}
