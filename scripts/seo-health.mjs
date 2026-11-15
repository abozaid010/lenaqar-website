#!/usr/bin/env node
/**
 * Technical eligibility check for a fixed set of LenAqar URLs (the "T-set").
 *
 *   node scripts/seo-health.mjs                         # production
 *   node scripts/seo-health.mjs --base https://<preview>.vercel.app
 *   node scripts/seo-health.mjs --out REPORT/seo-health/2026-11-15.json
 *   node scripts/seo-health.mjs --listing kBqU7H1A --listing rXyPb6Lv
 *
 * Per URL: status, redirects, TTFB (3 samples), canonical, meta robots,
 * X-Robots-Tag, sitemap presence, inbound links from the other T-set pages,
 * key facts in the raw HTML (no JavaScript run), robots.txt verdict for each
 * crawler token, and HTTP status per crawler user agent.
 *
 * Crawler user-agent requests are SIMULATED: they come from this machine's IP,
 * not the providers' published ranges. They show what the server returns for
 * that UA string, not how a real crawler is treated by the CDN/firewall.
 *
 * Exit code 1 when any check FAILs. No credentials, no writes besides --out.
 */
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
function argValues(name) {
  const values = [];
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === name && args[i + 1]) values.push(args[i + 1]);
  }
  return values;
}
const BASE = (argValues("--base")[0] || "https://www.lenaqar.com").replace(/\/$/, "");
const CANONICAL_ORIGIN = (argValues("--canonical-origin")[0] || "https://www.lenaqar.com").replace(/\/$/, "");
const OUT = argValues("--out")[0] || null;
const LISTING_CODES = argValues("--listing");
const TTFB_WARN_MS = 1500;
const SAMPLES = 3;

const BROWSER_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36 lenaqar-seo-health";

/** robots token → simulated UA string. Search/retrieval agents first; training last. */
const CRAWLERS = [
  { token: "Googlebot", role: "search (Google Search, AI Overviews, AI Mode)", ua: "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" },
  { token: "OAI-SearchBot", role: "search (ChatGPT search)", ua: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot" },
  { token: "ChatGPT-User", role: "user-initiated retrieval", ua: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ChatGPT-User/1.0; +https://openai.com/bot" },
  { token: "Claude-SearchBot", role: "search (Claude web search)", ua: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Claude-SearchBot/1.0; +Claude-SearchBot@anthropic.com)" },
  { token: "Claude-User", role: "user-initiated retrieval", ua: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Claude-User/1.0; +Claude-User@anthropic.com)" },
  { token: "PerplexityBot", role: "search (Perplexity)", ua: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)" },
  { token: "Bingbot", role: "search (Bing)", ua: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm) Chrome/116.0.1938.76 Safari/537.36" },
  { token: "GPTBot", role: "training", ua: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.1; +https://openai.com/gptbot)" },
  { token: "ClaudeBot", role: "training", ua: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)" },
];
/** Robots-only tokens (no crawler of their own). */
const ROBOTS_ONLY_TOKENS = ["Google-Extended"];

/**
 * The fixed T-set. `expectIndex: false` documents an intentional noindex so a
 * change in either direction is reported. `facts` must be present in raw HTML.
 */
const T_SET = [
  { path: "/", expectIndex: true, facts: [/<h1[\s>]/] },
  { path: "/opportunities", expectIndex: true, facts: [/<h1[\s>]/, /href="\/opportunities\/[A-Za-z0-9]+"/] },
  // The footer links the Madinaty price map on every page, so the hub link is
  // what proves the area page itself links its guides.
  { path: "/apartments-for-sale/madinaty", expectIndex: true, facts: [/<h1[\s>]/, /href="\/guides\/madinaty"/] },
  { path: "/guides/madinaty/prices-2026", expectIndex: true, facts: [/<h1[\s>]/, /جنيه/, /"dateModified"/, /عقارماب/], softLabel: "LenAqar inventory table", softFacts: [/id="guide-inventory"/, /طريقة الحساب/] },
  { path: "/guides/el-shorouk/prices-2026", expectIndex: true, facts: [/<h1[\s>]/, /جنيه/, /"dateModified"/] },
  { path: "/guides/buying/contract-registration-checklist", expectIndex: true, facts: [/<h1[\s>]/, /"dateModified"/, /gov\.eg/], softLabel: "total cost section", softFacts: [/التكاليف اللي غير سعر الشقة/, /eta\.gov\.eg/, /"acceptedAnswer":\{"@type":"Answer","text":"[^"]/] },
  {
    path: "/guides/buying/buying-resale-step-by-step",
    expectIndex: false,
    note: "intentional noindex: legal steps still marked «تحت المراجعة» (REPORT/seo-release-2026-11-03/excluded-guides-triage.json)",
    facts: [/<h1[\s>]/],
  },
  { path: "/verified-prices", expectIndex: true, facts: [/<h1[\s>]/] },
  { path: "/before-you-pay", expectIndex: true, facts: [/<h1[\s>]/] },
];

// ---------- robots.txt (Google semantics: groups, longest match, * and $) ----------
function parseRobots(text) {
  const groups = [];
  let current = null;
  let lastWasAgent = false;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) continue;
    const idx = line.indexOf(":");
    if (idx < 0) continue;
    const key = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();
    if (key === "user-agent") {
      if (!lastWasAgent || !current) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
    } else {
      lastWasAgent = false;
      if (!current) continue;
      if (key === "allow" || key === "disallow") current.rules.push({ type: key, pattern: value });
    }
  }
  return groups;
}

function patternToRegex(pattern) {
  const anchored = pattern.endsWith("$");
  const body = (anchored ? pattern.slice(0, -1) : pattern)
    .split("*")
    .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))
    .join(".*");
  return new RegExp(`^${body}${anchored ? "$" : ""}`);
}

function robotsVerdict(groups, token, urlPath) {
  const t = token.toLowerCase();
  let matched = groups.filter((g) => g.agents.includes(t));
  let via = token;
  if (matched.length === 0) {
    matched = groups.filter((g) => g.agents.includes("*"));
    via = "*";
  }
  const rules = matched.flatMap((g) => g.rules).filter((r) => r.pattern !== "");
  let best = null;
  for (const rule of rules) {
    if (!patternToRegex(rule.pattern).test(urlPath)) continue;
    const len = rule.pattern.length;
    if (!best || len > best.len || (len === best.len && rule.type === "allow")) {
      best = { len, type: rule.type, pattern: rule.pattern };
    }
  }
  return { allowed: !best || best.type === "allow", group: via, rule: best ? `${best.type}: ${best.pattern}` : "no matching rule" };
}

// ---------- HTTP ----------
async function fetchOnce(url, ua) {
  const started = performance.now();
  const chain = [];
  let current = url;
  for (let hop = 0; hop < 5; hop += 1) {
    const res = await fetch(current, { redirect: "manual", headers: { "user-agent": ua, accept: "text/html,*/*" } });
    const ttfbMs = Math.round(performance.now() - started);
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      chain.push({ status: res.status, location: res.headers.get("location") });
      current = new URL(res.headers.get("location"), current).toString();
      await res.arrayBuffer();
      continue;
    }
    const body = await res.text();
    return { status: res.status, ttfbMs, chain, headers: res.headers, body, finalUrl: current };
  }
  return { status: 0, ttfbMs: null, chain, headers: new Headers(), body: "", finalUrl: current, error: "too many redirects" };
}

function attr(html, re) {
  const m = html.match(re);
  return m ? m[1] : null;
}

function internalHrefs(html) {
  const out = new Set();
  for (const m of html.matchAll(/href="(\/[^"#?]*)/g)) {
    const href = m[1].replace(/\/+$/, "") || "/";
    if (!href.startsWith("/_next/")) out.add(href);
  }
  return out;
}

async function sitemapPaths() {
  const res = await fetch(`${BASE}/sitemap.xml`, { headers: { "user-agent": BROWSER_UA } });
  const xml = await res.text();
  const paths = new Set();
  for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    try {
      const u = new URL(m[1].trim());
      paths.add(u.pathname.replace(/\/+$/, "") || "/");
    } catch {
      /* ignore malformed loc */
    }
  }
  return { status: res.status, paths };
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

// ---------- main ----------
async function main() {
  const runAt = new Date().toISOString();
  const robotsRes = await fetch(`${BASE}/robots.txt`, { headers: { "user-agent": BROWSER_UA } });
  const robotsText = await robotsRes.text();
  const robotsGroups = parseRobots(robotsText);
  const sitemap = await sitemapPaths();

  const listingPaths = LISTING_CODES.length
    ? LISTING_CODES.map((c) => `/opportunities/${c}`)
    : [...sitemap.paths].filter((p) => /^\/opportunities\/[^/]+$/.test(p)).sort().slice(0, 3);
  const tSet = [
    ...T_SET,
    // Area guide link is soft: listings outside guide areas have none by design.
    ...listingPaths.map((p) => ({ path: p, expectIndex: true, facts: [/<h1[\s>]/, /ج\.م/, /"RealEstateListing"/], softFacts: [/<nav[^>]+aria-label="دليل المشتري"/] })),
  ];

  const pages = [];
  for (const item of tSet) {
    const url = `${BASE}${item.path}`;
    const samples = [];
    for (let i = 0; i < SAMPLES; i += 1) samples.push(await fetchOnce(url, BROWSER_UA));
    const first = samples[0];
    const html = first.body;
    const canonical = attr(html, /<link[^>]+rel="canonical"[^>]+href="([^"]*)"/) || attr(html, /<link[^>]+href="([^"]*)"[^>]+rel="canonical"/);
    const metaRobots = attr(html, /<meta[^>]+name="robots"[^>]+content="([^"]*)"/);
    const xRobots = first.headers.get("x-robots-tag");
    const noindex = /noindex/i.test(`${metaRobots || ""} ${xRobots || ""}`);
    const crawlers = [];
    for (const c of CRAWLERS) {
      const r = await fetchOnce(url, c.ua);
      crawlers.push({ token: c.token, role: c.role, status: r.status, robots: robotsVerdict(robotsGroups, c.token, item.path) });
    }
    for (const token of ROBOTS_ONLY_TOKENS) {
      crawlers.push({ token, role: "robots token only (Gemini Apps grounding/training)", status: null, robots: robotsVerdict(robotsGroups, token, item.path) });
    }
    pages.push({
      ...item,
      facts: undefined,
      softFacts: undefined,
      factPatterns: item.facts.map(String),
      softFactPatterns: (item.softFacts || []).map(String),
      status: first.status,
      redirects: first.chain,
      ttfbMs: samples.map((s) => s.ttfbMs),
      ttfbMedianMs: median(samples.map((s) => s.ttfbMs)),
      vercelCache: first.headers.get("x-vercel-cache"),
      canonical,
      metaRobots,
      xRobots,
      noindex,
      inSitemap: sitemap.paths.has(item.path),
      factsMissing: item.facts.filter((re) => !re.test(html)).map(String),
      softFactsMissing: (item.softFacts || []).filter((re) => !re.test(html)).map(String),
      outLinks: [...internalHrefs(html)],
      crawlers,
    });
  }

  // Inbound links from other T-set pages.
  for (const page of pages) {
    page.inboundFromTSet = pages.filter((p) => p !== page && p.outLinks.includes(page.path)).map((p) => p.path);
  }

  // Verdicts.
  const checks = [];
  const add = (pagePath, check, level, detail) => checks.push({ path: pagePath, check, level, detail });
  for (const p of pages) {
    add(p.path, "status 200", p.status === 200 ? "PASS" : "FAIL", String(p.status));
    if (p.redirects.length) add(p.path, "no redirect", "WARN", p.redirects.map((r) => `${r.status}→${r.location}`).join(" "));
    const wantCanonical = `${CANONICAL_ORIGIN}${p.path === "/" ? "" : p.path}`;
    const canonOk = p.canonical === wantCanonical || (p.path === "/" && p.canonical === `${CANONICAL_ORIGIN}/`);
    add(p.path, "self canonical", canonOk ? "PASS" : "FAIL", p.canonical || "missing");
    const indexOk = p.expectIndex ? !p.noindex : p.noindex;
    add(p.path, p.expectIndex ? "indexable" : "noindex (expected)", indexOk ? "PASS" : "FAIL", `${p.metaRobots || "-"} | x-robots: ${p.xRobots || "-"}${p.note ? ` | ${p.note}` : ""}`);
    add(p.path, p.expectIndex ? "in sitemap" : "not in sitemap", p.inSitemap === p.expectIndex ? "PASS" : "FAIL", String(p.inSitemap));
    add(p.path, "key facts in raw HTML", p.factsMissing.length ? "FAIL" : "PASS", p.factsMissing.join(", ") || "all present");
    if (p.softFactPatterns.length) add(p.path, p.softLabel || "area guide link", p.softFactsMissing.length ? "WARN" : "PASS", p.softFactsMissing.join(", ") || "present");
    add(p.path, "inbound links from T-set", p.inboundFromTSet.length ? "PASS" : "WARN", String(p.inboundFromTSet.length));
    add(p.path, `TTFB median < ${TTFB_WARN_MS}ms`, p.ttfbMedianMs < TTFB_WARN_MS ? "PASS" : "WARN", `${p.ttfbMs.join("/")}ms cache=${p.vercelCache || "-"}`);
    for (const c of p.crawlers) {
      if (!c.robots.allowed && c.role !== "training") add(p.path, `robots.txt allows ${c.token}`, "FAIL", c.robots.rule);
      if (c.status != null && c.status !== p.status) add(p.path, `simulated ${c.token} status`, "FAIL", `${c.status} (browser ${p.status})`);
    }
  }
  const summary = {
    pass: checks.filter((c) => c.level === "PASS").length,
    warn: checks.filter((c) => c.level === "WARN").length,
    fail: checks.filter((c) => c.level === "FAIL").length,
  };

  const report = {
    runAt,
    base: BASE,
    canonicalOrigin: CANONICAL_ORIGIN,
    note: "Crawler UA requests are simulated from this machine's IP; they do not prove how real crawler IPs are treated.",
    robotsTxt: { status: robotsRes.status, groups: robotsGroups.length },
    sitemap: { status: sitemap.status, urls: sitemap.paths.size },
    summary,
    checks,
    pages: pages.map(({ outLinks, ...rest }) => ({ ...rest, outLinkCount: outLinks.length })),
  };

  if (OUT) {
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, `${JSON.stringify(report, null, 2)}\n`);
  }

  console.log(`seo-health ${runAt} base=${BASE} robots=${robotsRes.status} sitemap=${sitemap.status} (${sitemap.paths.size} urls)`);
  console.log(`PASS ${summary.pass} · WARN ${summary.warn} · FAIL ${summary.fail}`);
  for (const c of checks.filter((x) => x.level !== "PASS")) {
    console.log(`${c.level.padEnd(4)} ${c.path} — ${c.check}: ${c.detail}`);
  }
  console.log("Crawler UA checks are simulated (this machine's IP).");
  if (OUT) console.log(`report: ${OUT}`);
  process.exitCode = summary.fail ? 1 : 0;
}

main().catch((error) => {
  console.error(`seo-health failed: ${error.message}`);
  process.exitCode = 2;
});
