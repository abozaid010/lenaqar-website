/**
 * Writes CONTENT_STATUS.md and patches website fields in
 * broker-market-research/content-progress.json (website keys only).
 */
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const GUIDES = path.join(ROOT, "content", "guides");
const STATUS_MD = path.join(ROOT, "CONTENT_STATUS.md");
const PROGRESS =
  process.env.LENAQAR_CONTENT_PROGRESS ||
  "/Users/abozaid/workspace/broker-market-research/content-progress.json";

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith("_")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.name.endsWith(".md")) files.push(full);
  }
  return files;
}

function loadGuides() {
  return walk(GUIDES).map((filePath) => {
    const { data } = matter(fs.readFileSync(filePath, "utf8"));
    return {
      ...data,
      file: path.relative(ROOT, filePath),
      missing: Array.isArray(data.missing)
        ? data.missing
        : data.missing
          ? [data.missing]
          : [],
    };
  });
}

const guides = loadGuides().sort((a, b) =>
  String(a.date_planned || "").localeCompare(String(b.date_planned || "")),
);

const lines = [
  "# CONTENT_STATUS — دليل المشتري (lenaqar.com)",
  "",
  `Updated: ${new Date().toISOString()}`,
  "",
  "Status flow: `draft` → `needs_numbers` → `in_review` → `approved` → `scheduled` → `published`",
  "",
  "Preview: `/internal/guides/?token=…` and `/internal/content-status?token=…` (env `GUIDES_PREVIEW_TOKEN`, or open in development).",
  "",
  "| date_planned | city | pillar | lead | status | missing | title | file |",
  "|---|---|---|---|---|---|---|---|",
];

for (const g of guides) {
  lines.push(
    `| ${g.date_planned || "—"} | ${g.city_code || "—"} | ${g.pillar || "—"} | ${g.lead_code || "—"} | **${g.status}** | ${(g.missing || []).join("; ") || "—"} | ${g.title} | \`${g.file}\` |`,
  );
}

lines.push("", `Total articles: **${guides.length}**`, "");
fs.writeFileSync(STATUS_MD, lines.join("\n"), "utf8");
console.log("Wrote", STATUS_MD);

// Patch content-progress.json website fields only
if (fs.existsSync(PROGRESS)) {
  const progress = JSON.parse(fs.readFileSync(PROGRESS, "utf8"));
  progress.updated = new Date().toISOString();
  if (!progress.channels) progress.channels = {};
  if (!progress.channels.website) progress.channels.website = {};
  progress.channels.website.guides_hub = "drafted";
  progress.channels.website.guides_count = guides.length;
  progress.channels.website.content_status = "CONTENT_STATUS.md (lenaqar repo)";
  progress.channels.website.preview = "/internal/guides/ and /internal/content-status";

  if (!progress.website) progress.website = {};
  progress.website.articles = guides.map((g) => ({
    slug: g.slug,
    city_code: g.city_code || null,
    pillar: g.pillar,
    lead_code: g.lead_code || null,
    date_planned: g.date_planned || null,
    status: g.status,
    missing: g.missing || [],
    file: g.file,
  }));

  // Per-city website_article status under existing cities[].pillars when present
  if (Array.isArray(progress.cities)) {
    for (const city of progress.cities) {
      const code = city.code;
      const cityGuides = guides.filter((g) => g.city_code === code);
      if (!city.website) city.website = {};
      city.website.articles = cityGuides.map((g) => ({
        slug: g.slug,
        pillar: g.pillar,
        status: g.status,
        date_planned: g.date_planned,
        missing: g.missing,
      }));
      if (city.pillars?.P1_price_map) {
        const p1 = cityGuides.find((g) => g.pillar === "P1");
        if (p1) {
          city.pillars.P1_price_map.website_article = {
            ...(city.pillars.P1_price_map.website_article || {}),
            status: p1.status,
            file: p1.file,
            url: p1.slug,
          };
        }
      }
      if (city.pillars?.P2_red_file) {
        const p2 = cityGuides.find((g) => g.pillar === "P2");
        if (p2) {
          city.pillars.P2_red_file.website = {
            status: p2.status,
            file: p2.file,
            url: p2.slug,
          };
        }
      }
      if (city.pillars?.P3_good_side) {
        const p3 = cityGuides.find((g) => g.pillar === "P3");
        if (p3) {
          city.pillars.P3_good_side.website = {
            status: p3.status,
            file: p3.file,
            url: p3.slug,
          };
        }
      }
      if (city.pillars?.P4_six_units) {
        const p4 = cityGuides.find((g) => g.pillar === "P4");
        if (p4) {
          city.pillars.P4_six_units.website = {
            status: p4.status,
            file: p4.file,
            url: p4.slug,
          };
        }
      }
    }
  }

  fs.writeFileSync(PROGRESS, JSON.stringify(progress, null, 2) + "\n", "utf8");
  console.log("Patched website fields in", PROGRESS);
} else {
  console.warn("content-progress.json not found at", PROGRESS);
}
