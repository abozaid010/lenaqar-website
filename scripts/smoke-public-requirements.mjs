import { readFileSync } from "fs";
import { toPublicRequirement } from "../src/lib/lenaqar/to-public-requirement.js";

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
process.env.API_BASE_URL = "https://api.lenaai.net";

const base = process.env.API_BASE_URL;
const username = process.env.LENAQAR_CLIENT_EMAIL || process.env.CLIENT;
const password = process.env.LENAQAR_CLIENT_PASSWORD || process.env.PASSWORD;
const headers = {
  "User-Agent": "LenaQar-Marketplace/1.0",
  Accept: "application/json",
  "X-BFF-Secret": process.env.BFF_SECRET || "",
  "X-API-Key":
    process.env.X_API_KEY || process.env.NEXT_PUBLIC_X_API_KEY || "",
};

const loginRes = await fetch(`${base}/client/login`, {
  method: "POST",
  headers: { ...headers, "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ username, password }),
});
const login = await loginRes.json();
const token = login?.data?.access_token;
const pendingRes = await fetch(`${base}/requirements/pending?limit=50`, {
  headers: { ...headers, Authorization: `Bearer ${token}` },
});
const pending = await pendingRes.json();
const raw = pending?.data?.requirements || [];
const publicRows = raw.map(toPublicRequirement).filter(Boolean);
const keys = new Set();
for (const row of publicRows) Object.keys(row).forEach((k) => keys.add(k));
const forbidden = [
  "lead",
  "user_id",
  "assigned_to",
  "phone",
  "name",
  "email",
  "matched_units",
  "notes",
  "score",
  "client_id",
];
const leaked = publicRows.some((row) => forbidden.some((f) => f in row));
const intents = {
  buy: publicRows.filter((r) => r.intent === "buy").length,
  sell: publicRows.filter((r) => r.intent === "sell").length,
};
console.log(
  JSON.stringify(
    {
      raw: raw.length,
      public: publicRows.length,
      intents,
      keys: [...keys].sort(),
      leaked,
      sampleIdLooksHashed: /^[a-f0-9]{12}$/.test(publicRows[0]?.id || ""),
    },
    null,
    2,
  ),
);
