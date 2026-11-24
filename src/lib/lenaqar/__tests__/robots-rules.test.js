import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { AI_CRAWLERS, buildAllow, buildDisallow } from "../robots-rules.js";
import { BUYER_LANDINGS } from "../buyer-landings.js";
import { DOORS } from "../doors.js";
import { parseRobots, robotsVerdict } from "../../../../scripts/lib/robots-parser.mjs";

/** The same text Next renders from src/app/robots.ts. */
function robotsText() {
  const allow = buildAllow({ feedEnabled: true });
  const disallow = buildDisallow();
  const group = (agents) =>
    [
      ...agents.map((agent) => `User-Agent: ${agent}`),
      ...allow.map((rule) => `Allow: ${rule}`),
      ...disallow.map((rule) => `Disallow: ${rule}`),
    ].join("\n");
  return `${group(["*"])}\n\n${group(AI_CRAWLERS)}\n`;
}

const groups = parseRobots(robotsText());
// Search and answer-engine agents; Googlebot and Bingbot fall under `*`.
const AGENTS = ["Googlebot", "Bingbot", "OAI-SearchBot", "ChatGPT-User", "Claude-SearchBot", "Claude-User", "PerplexityBot", "GPTBot"];

function blocked(paths) {
  const out = [];
  for (const agent of AGENTS) {
    for (const path of paths) {
      const verdict = robotsVerdict(groups, agent, path);
      if (!verdict.allowed) out.push(`${agent} ${path} (${verdict.rule})`);
    }
  }
  return out;
}

test("every public page family is crawlable by search and AI agents", () => {
  const paths = [
    "/",
    "/opportunities",
    "/opportunities/21J9EkAY",
    "/guides",
    "/guides/madinaty/prices-2026",
    "/sell",
    "/how-it-works",
    "/calculator",
    "/network",
    "/projects",
    "/projects/talala",
    ...BUYER_LANDINGS.map((page) => page.href),
    ...DOORS.map((door) => door.href),
  ];
  assert.deepEqual(blocked(paths), []);
});

test("every project page in the snapshot is crawlable", () => {
  const snapshot = JSON.parse(
    fs.readFileSync(new URL("../../../../content/projects/projects-snapshot.json", import.meta.url), "utf8"),
  );
  const paths = snapshot.projects.map((project) => `/projects/${project.slug}`);
  assert.ok(paths.length > 0);
  assert.deepEqual(blocked(paths), []);
});

test("retired CRM routes and private routes stay disallowed", () => {
  for (const path of ["/dashboard", "/units/abc", "/acme/projects", "/acme/units", "/developers", "/api/lenaqar/x", "/internal/content-status", "/network/login"]) {
    for (const agent of AGENTS) {
      assert.equal(robotsVerdict(groups, agent, path).allowed, false, `${agent} ${path}`);
    }
  }
});

test("no disallow rule is a prefix of an explicitly allowed public route", () => {
  const disallow = buildDisallow().filter((rule) => !rule.includes("*"));
  const clashes = buildAllow({ feedEnabled: true })
    .filter((rule) => rule !== "/")
    .filter((rule) => disallow.some((blockedPrefix) => rule.replace(/\/\*$/, "").startsWith(blockedPrefix)));
  // /network/signup, /network/login, /network/pending are private on purpose.
  assert.deepEqual(clashes, []);
});
