import { readFileSync } from "fs";
import { createHash } from "crypto";

function loadEnv(path) {
  try {
    for (const line of readFileSync(path, "utf8").split("\n")) {
      if (!line || line.trim().startsWith("#") || !line.includes("=")) continue;
      const i = line.indexOf("=");
      const k = line.slice(0, i).trim();
      let v = line.slice(i + 1).trim();
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1);
      }
      if (!(k in process.env)) process.env[k] = v;
    }
  } catch {
    /* optional */
  }
}

loadEnv(".env");
loadEnv(".env.local");
process.env.API_BASE_URL = process.env.API_BASE_URL || "https://api.lenaai.net";

const base = process.env.API_BASE_URL;
const headers = {
  "User-Agent": "LenaQar-Marketplace/1.0",
  Accept: "application/json",
  "X-BFF-Secret": process.env.BFF_SECRET || "",
  "X-API-Key":
    process.env.X_API_KEY || process.env.NEXT_PUBLIC_X_API_KEY || "",
};

const res = await fetch(`${base}/public/v1/requirements?limit=48`, { headers });
const json = await res.json().catch(() => ({}));
const rows = json?.data?.requirements || [];
const forbidden = [
  "lead",
  "user_id",
  "assigned_to",
  "phone",
  "name",
  "email",
  "matched_units",
  "client_id",
  "score",
  "additionalFeatures",
];
const leaked = rows.some((row) => forbidden.some((f) => f in row));
const keys = new Set();
for (const row of rows) Object.keys(row).forEach((k) => keys.add(k));

console.log(
  JSON.stringify(
    {
      http: res.status,
      apiStatus: json?.status ?? null,
      count: rows.length,
      keys: [...keys].sort(),
      leaked,
      sampleIdLooksHashed: /^[a-f0-9]{12}$/.test(rows[0]?.id || ""),
      hashSmoke: createHash("sha256").update("lenaqar-req:x").digest("hex").slice(0, 12),
    },
    null,
    2,
  ),
);
