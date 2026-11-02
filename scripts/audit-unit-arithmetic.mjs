#!/usr/bin/env node
/**
 * F-08: audit opportunity arithmetic + indexability against the live public catalog.
 *
 * Resale identity: down + remaining ≈ total + over (أوفر).
 * Indexability: price + area + delivery (arithmetic does not noindex).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2].trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvFile(path.join(root, ".env"));
loadEnvFile(path.join(root, ".env.local"));

function resolveApiBase() {
  const candidates = [
    process.env.NEXT_PUBLIC_API_BASE_URL,
    process.env.API_BASE_URL,
    "https://api.lenaai.net",
  ];
  for (const raw of candidates) {
    if (!raw) continue;
    const base = String(raw).replace(/\/$/, "");
    // Prefer public catalog for this audit — skip local/dev proxies.
    if (/localhost|127\.0\.0\.1|0\.0\.0\.0|:3000|:8000/i.test(base)) continue;
    return base;
  }
  return "https://api.lenaai.net";
}
const API_BASE = resolveApiBase();
const API_KEY = (
  process.env.X_API_KEY ||
  process.env.NEXT_PUBLIC_X_API_KEY ||
  ""
).trim();
const CLIENT_ID = (
  process.env.NEXT_PUBLIC_LENAQAR_TENANT_ID || "lenaqar"
).trim();

function num(value) {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function pick(unit, ...keys) {
  for (const k of keys) {
    if (unit?.[k] != null && unit[k] !== "") return unit[k];
  }
  return null;
}

function withinPct(a, b, pct = 0.01) {
  if (a == null || b == null) return false;
  const denom = Math.max(Math.abs(a), Math.abs(b), 1);
  return Math.abs(a - b) / denom <= pct;
}

function normalize(raw) {
  return {
    code: pick(raw, "code", "unit_code") || "",
    totalPrice: pick(raw, "totalPrice", "total_price", "price"),
    downPayment: pick(raw, "downPayment", "down_payment", "cash_required"),
    remainingAmount: pick(raw, "remainingAmount", "remaining_amount", "remaining"),
    overPrice: pick(raw, "overPrice", "over_price"),
    paidAmount: pick(raw, "paidAmount", "paid_amount"),
    landArea: pick(raw, "landArea", "land_area", "area", "meter"),
    deliveryDate: pick(raw, "deliveryDate", "delivery_date"),
    deliveryYear: pick(raw, "deliveryYear", "delivery_year"),
    paperStatus: pick(raw, "paperStatus", "papers_status", "contract_status"),
    verificationLevel: pick(
      raw,
      "verificationLevel",
      "verification_level",
      "trust_level",
    ),
  };
}

function arithmetic(unit) {
  const total = num(unit.totalPrice);
  const down = num(unit.downPayment);
  const remaining = num(unit.remainingAmount);
  const over = num(unit.overPrice) ?? 0;
  const paid = num(unit.paidAmount);
  if (total == null || down == null || remaining == null) {
    return {
      ok: true,
      skipped: true,
      pct: "",
      total,
      down,
      remaining,
      over,
      sum: "",
      expected: "",
    };
  }
  if (down === 0 && remaining === 0) {
    return {
      ok: true,
      skipped: true,
      pct: "",
      total,
      down,
      remaining,
      over,
      sum: "",
      expected: "",
    };
  }
  const expected = total + over;
  const sum = down + remaining;
  const okPrimary = withinPct(sum, expected);
  const okPaid = paid != null ? withinPct(paid + remaining, total) : false;
  const ok = okPrimary || okPaid;
  const delta = Math.abs(expected - sum);
  const pct = expected === 0 ? null : delta / Math.abs(expected);
  return {
    ok,
    skipped: false,
    pct: pct == null ? "" : (pct * 100).toFixed(2),
    total,
    down,
    remaining,
    over,
    sum,
    expected,
  };
}

function indexable(unit) {
  if (!(num(unit.totalPrice) > 0)) return false;
  if (!(num(unit.landArea) > 0)) return false;
  if (!(unit.deliveryDate || unit.deliveryYear)) return false;
  return true;
}

async function fetchAll() {
  if (!API_KEY) throw new Error("X_API_KEY / NEXT_PUBLIC_X_API_KEY missing");
  const collected = [];
  let cursor = "";
  for (let page = 0; page < 30; page++) {
    const qs = new URLSearchParams({
      client_id: CLIENT_ID,
      purpose: "sell",
      is_primary: "false",
      page_size: "50",
    });
    if (cursor) qs.set("cursor", cursor);
    const url = `${API_BASE}/public/v1/units?${qs}`;
    const res = await fetch(url, {
      headers: {
        "X-API-Key": API_KEY,
        Accept: "application/json",
      },
    });
    if (!res.ok) {
      throw new Error(`API ${res.status} ${await res.text().then((t) => t.slice(0, 200))}`);
    }
    const data = await res.json();
    const units = data?.data?.units ?? data?.units ?? [];
    for (const u of units) collected.push(normalize(u));
    const pagination = data?.data?.pagination ?? data?.pagination ?? {};
    if (!pagination.has_more_next || !pagination.next_cursor) break;
    cursor = pagination.next_cursor;
  }
  return collected;
}

async function main() {
  const units = await fetchAll();
  const header = [
    "code",
    "total",
    "down",
    "remaining",
    "over",
    "sum",
    "expected",
    "delta_pct",
    "arith_ok",
    "has_area",
    "has_delivery",
    "indexable",
    "has_paper",
    "has_verification",
  ];
  const lines = [header.join(",")];
  let badArith = 0;
  let notIndexable = 0;
  for (const unit of units) {
    const a = arithmetic(unit);
    if (!a.skipped && !a.ok) badArith += 1;
    const idx = indexable(unit);
    if (!idx) notIndexable += 1;
    lines.push(
      [
        JSON.stringify(unit.code),
        a.total ?? "",
        a.down ?? "",
        a.remaining ?? "",
        a.over ?? "",
        a.sum ?? "",
        a.expected ?? "",
        a.pct,
        a.skipped ? "skipped" : a.ok,
        num(unit.landArea) > 0,
        Boolean(unit.deliveryDate || unit.deliveryYear),
        idx,
        Boolean(unit.paperStatus),
        Boolean(unit.verificationLevel),
      ].join(","),
    );
  }

  const out = path.join(
    root,
    "../broker-market-research/REPORT/01-unit-data-audit.csv",
  );
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, lines.join("\n") + "\n", "utf8");
  console.log(
    JSON.stringify({
      wrote: out,
      units: units.length,
      bad_arith: badArith,
      not_indexable: notIndexable,
    }),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
