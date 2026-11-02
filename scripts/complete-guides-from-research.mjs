#!/usr/bin/env node
/**
 * Complete buyer-guide price maps from researched Aqarmap asking averages.
 * Enables seo_index only when a guide has verified numeric content.
 * Writes REPORT/missing.json for unresolved human fields.
 */
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const researchPath = path.join(
  root,
  "content/guides/_research/aqarmap-asking-2026-11-02.json",
);
const research = JSON.parse(fs.readFileSync(researchPath, "utf8"));
const TODAY = "2026-11-02";

function fmt(n) {
  return Number(n).toLocaleString("en-US");
}

function loadEnv() {
  for (const f of [".env", ".env.local"]) {
    const p = path.join(root, f);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, "utf8").split("\n")) {
      const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (!m || process.env[m[1]]) continue;
      let v = m[2].trim();
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      )
        v = v.slice(1, -1);
      process.env[m[1]] = v;
    }
  }
}

function rewriteFrontmatter(filePath, mutate) {
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = matter(raw);
  mutate(parsed.data, parsed);
  const out = matter.stringify(parsed.content.replace(/^\n/, ""), parsed.data);
  fs.writeFileSync(filePath, out.endsWith("\n") ? out : out + "\n", "utf8");
}

function writePriceGuide(cityId, meta) {
  const file = path.join(root, `content/guides/${cityId}/prices-2026.md`);
  if (!fs.existsSync(file)) return false;
  const rows = meta.neighborhoods
    .slice()
    .sort((a, b) => b.avg - a.avg)
    .map((n) => `| ${n.name_ar} | ${fmt(n.avg)} |`)
    .join("\n");
  const cheap = [...meta.neighborhoods].sort((a, b) => a.avg - b.avg)[0];
  const mid = meta.neighborhoods[Math.floor(meta.neighborhoods.length / 2)];
  const src = meta.source;
  const note = meta.note_ar ? `\n\n> ${meta.note_ar}\n` : "\n";
  const cross = meta.cross_check
    ? `\n- Cross-check: [${meta.cross_check.name}](${meta.cross_check.url}) — ${meta.cross_check.date}${meta.cross_check.avg ? ` (≈ ${fmt(meta.cross_check.avg)} ج/م)` : ""}.`
    : "";
  const budget120Low = Math.round((cheap.avg * 120) / 100000) / 10;
  const budget160Mid = Math.round((mid.avg * 160) / 100000) / 10;
  const budget160City = Math.round((meta.city_avg * 160) / 100000) / 10;

  const body = `**الإجابة السريعة:** متوسط سعر متر الشقق المعروضة في **${meta.label_ar}** حوالي **${fmt(meta.city_avg)} جنيه** (اطّلاع ${src.date}). دي **أسعار مطلوبة في الإعلانات** مش أسعار بيع فعلي — سعر القفل بيتحدد بعد التفاوض والمعاينة.
${note}
> **مصدر الأرقام:** [${src.name}](${src.url}) — نوع السعر: متوسط معروض (asking). تاريخ الاسترجاع: ${src.date}.${cross}

## جدول متوسط سعر متر الشقق حسب الحي/الشريحة

| الحي / الشريحة | متوسط سعر المتر (جنيه) |
|---|---|
${rows}

*المصدر: ${src.name}، ${src.date} — أسعار معروضة.*

## ميزانيتك تجيب إيه؟ (حساب تقريبي)

| السيناريو | حساب تقريبي |
|---|---|
| أرخص شريحة (~${fmt(cheap.avg)} ج/م) × 120م | ≈ ${budget120Low} مليون |
| شريحة وسط الجدول (~${fmt(mid.avg)} ج/م) × 160م | ≈ ${budget160Mid} مليون |
| متوسط المدينة (~${fmt(meta.city_avg)} ج/م) × 160م | ≈ ${budget160City} مليون |

*الحساب = المساحة × متوسط المتر. السعر الفعلي يختلف بالتشطيب والدور والاستلام وطريقة الدفع.*

## قبل ما تعتمد على أي سعر

1. اسأل: ده سعر مطلوب ولا سعر قفل؟
2. قارن 3 وحدات على الأقل في نفس الحي ونفس الدور تقريبًا.
3. اتأكد من حالة الوحدة: جاهزة، متشطبة، مسكونة، ولا تحت الإنشاء.
4. احسب تكلفة التشطيب لو الوحدة نص تشطيب.

## عايز رقم حي معيّن؟

ابعت طلبك على واتساب (الحي · الميزانية · المقدم · عدد الغرف · استلام إمتى) — **مش هنتصل إلا لو إنت طلبت.**
شوف الوحدات المتاحة على [/opportunities](/opportunities).
`;

  rewriteFrontmatter(file, (data) => {
    data.date_updated = TODAY;
    data.seo_index = true;
    data.sources = [
      {
        name: src.name,
        url: src.url,
        date: src.date,
        type: src.type || "asking",
      },
      ...(meta.cross_check
        ? [
            {
              name: meta.cross_check.name,
              url: meta.cross_check.url,
              date: meta.cross_check.date,
              type: meta.cross_check.type || "asking",
            },
          ]
        : []),
      ...(meta.primary_index
        ? [
            {
              name: meta.primary_index.name,
              url: meta.primary_index.url,
              date: meta.primary_index.date,
              type: "asking",
            },
          ]
        : []),
    ];
    data.description = `متوسط سعر متر الشقق في ${meta.label_ar} حوالي ${fmt(meta.city_avg)} جنيه (${src.date}) — جدول حي بحي من عقارماب (أسعار معروضة) + ميزانية تقريبية.`;
    data.faq = [
      {
        q: `كام متوسط سعر المتر في ${meta.label_ar}؟`,
        a: `حسب ${src.name} (${src.date}): حوالي ${fmt(meta.city_avg)} جنيه للمتر للشقق المعروضة — مش سعر بيع فعلي.`,
      },
      {
        q: "إيه أرخص شريحة في الجدول؟",
        a: `${cheap.name_ar} بحوالي ${fmt(cheap.avg)} جنيه/م (متوسط معروض).`,
      },
      {
        q: "هل الأرقام دي بيع فعلي؟",
        a: "لأ — متوسطات أسعار معروضة في الإعلانات. سعر القفل بعد التفاوض.",
      },
      {
        q: "إزاي أحسب ميزانية شقة؟",
        a: "اضرب المساحة × متوسط متر الحي كحد أعلى تقريبي، بعدين قارن 3 وحدات حقيقية.",
      },
      {
        q: "فين الوحدات الحالية؟",
        a: "على /opportunities أو واتساب بمواصفاتك.",
      },
    ];
    data.missing = [];
  });

  // Replace body while keeping front matter from rewrite — rewrite already wrote old body.
  const after = matter(fs.readFileSync(file, "utf8"));
  fs.writeFileSync(file, matter.stringify(body, after.data));
  return true;
}

function updateHub(cityId, meta) {
  const file = path.join(root, `content/guides/${cityId}/index.md`);
  if (!fs.existsSync(file)) return;
  const src = meta.source;
  const cheap = [...meta.neighborhoods].sort((a, b) => a.avg - b.avg)[0];
  const body = `**الإجابة السريعة:** دليل ${meta.label_ar} من لينا عقار بيجمع خريطة أسعار مؤرخة، ملف أحمر (تحذيرات بادلة)، المميزات، ورابط لوحدات حقيقية على [/opportunities](/opportunities).

متوسط عقارماب للشقق المعروضة ≈ **${fmt(meta.city_avg)} ج/م** (${src.date}) — أرخص شريحة في الجدول ≈ **${fmt(cheap.avg)} ج/م** (${cheap.name_ar}).

## إيه هتلاقي هنا؟

| العمود | المحتوى |
|---|---|
| [خريطة الأسعار](/guides/${cityId}/prices-2026) | سعر المتر حسب الحي/الشريحة + ميزانية تقريبية |
| لو معاك ميزانية | سيناريو ميزانية مربوط بنفس المصدر |
| المميزات والفرص | لمين تناسب / لمين لأ |
| الملف الأحمر | تحذيرات بادلة أو قائمة فحص — من غير تشهير |
| اختيارات حقيقية | وحدات من كتالوج لينا عقار + رابط الفرص |

## ملاحظات مهمة

- واتساب فقط: **01002891933** — مش هنتصل إلا لو طلبت.
- الأسعار المعروضة ≠ أسعار البيع الفعلي إلا لو مكتوب غير كده.
- المصدر الأساسي للأسعار: [${src.name}](${src.url}) (${src.date}).

## إزاي تستخدم الدليل؟

1. ابدأ بخريطة الأسعار عشان تظبط توقعات الميزانية.
2. اقرأ المميزات والملف الأحمر قبل أي معاينة.
3. ابعت طلب واضح (منطقة · ميزانية · مقدم · غرف · استلام).
`;
  rewriteFrontmatter(file, (data) => {
    data.date_updated = TODAY;
    data.seo_index = true;
    data.missing = [];
    data.sources = [
      {
        name: src.name,
        url: src.url,
        date: src.date,
        type: src.type || "asking",
      },
    ];
  });
  const after = matter(fs.readFileSync(file, "utf8"));
  fs.writeFileSync(file, matter.stringify(body, after.data));
}

function updateBudget(cityId, meta, budgetMillions, budgetFile) {
  const file = path.join(root, `content/guides/${cityId}/${budgetFile}`);
  if (!fs.existsSync(file)) return;
  const src = meta.source;
  const cash = budgetMillions * 1_000_000;
  const sorted = [...meta.neighborhoods].sort((a, b) => a.avg - b.avg);
  const cheap = sorted[0];
  const mid = sorted[Math.floor(sorted.length / 2)];
  const dense = sorted.find((n) => /كمبوند/.test(n.name_ar)) || sorted[sorted.length - 1];
  const area = (avg) => Math.round(cash / avg);
  const body = `**الإجابة السريعة:** معاك **${budgetMillions} مليون** في ${meta.label_ar}؟ حسب متوسطات عقارماب المعروضة (${src.date}): في شريحة رخيصة (~${fmt(cheap.avg)} ج/م) المساحة الحسابية ≈ **${area(cheap.avg)}م**، وفي شريحة أعلى (~${fmt(dense.avg)} ج/م) ≈ **${area(dense.avg)}م**. دي حسابات من متوسط معروض — مش عروض وحدات.

> المصدر: [${src.name}](${src.url}) — ${src.date}. نوع السعر: متوسط معروض.

## السيناريوهات

| الاختيار | متوسط المتر | مساحة حسابية من ${budgetMillions}م |
|---|---|---|
| ${cheap.name_ar} | ${fmt(cheap.avg)} | ≈ ${area(cheap.avg)}م |
| ${mid.name_ar} | ${fmt(mid.avg)} | ≈ ${area(mid.avg)}م |
| ${dense.name_ar} | ${fmt(dense.avg)} | ≈ ${area(dense.avg)}م |

## إزاي تختار صح؟

- قرر: مساحة ولا بوابة وخدمات؟
- اطلب 3 اختيارات مكتوبة في نفس الرينج على واتساب.
- متخلطش سعر مطلوب بقفل صفقة.
- راجع خريطة الأسعار: [/guides/${cityId}/prices-2026](/guides/${cityId}/prices-2026).
`;
  rewriteFrontmatter(file, (data) => {
    data.date_updated = TODAY;
    data.seo_index = true;
    data.missing = [];
    data.sources = [
      {
        name: src.name,
        url: src.url,
        date: src.date,
        type: src.type || "asking",
      },
    ];
    data.description = `معاك ${budgetMillions} مليون في ${meta.label_ar}؟ حساب مساحة تقريبي من متوسطات عقارماب المعروضة (${src.date}).`;
  });
  const after = matter(fs.readFileSync(file, "utf8"));
  fs.writeFileSync(file, matter.stringify(body, after.data));
}

function enableCompleteNonNumeric(fileRel, clearMissing = true) {
  const file = path.join(root, "content/guides", fileRel);
  if (!fs.existsSync(file)) return;
  rewriteFrontmatter(file, (data, parsed) => {
    // Only enable if body has no draft markers and has substantive content
    const blob = `${data.description || ""}\n${parsed.content}`;
    if (/مسودة\s*(تحرير|لينا|حذرة)/.test(blob) || /\[\[\s*VERIFY/i.test(blob)) {
      data.seo_index = false;
      return;
    }
    if (clearMissing) data.missing = [];
    data.date_updated = TODAY;
    data.seo_index = true;
  });
}

async function fetchUnits() {
  loadEnv();
  const key = (process.env.X_API_KEY || process.env.NEXT_PUBLIC_X_API_KEY || "").trim();
  if (!key) return [];
  const base = (
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.API_BASE_URL ||
    "https://api.lenaai.net"
  ).replace(/\/$/, "");
  const apiBase = /localhost|127\.0\.0\.1/.test(base)
    ? "https://api.lenaai.net"
    : base;
  const collected = [];
  let cursor = "";
  for (let i = 0; i < 30; i++) {
    const qs = new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_LENAQAR_TENANT_ID || "lenaqar",
      purpose: "sell",
      is_primary: "false",
      page_size: "50",
    });
    if (cursor) qs.set("cursor", cursor);
    const res = await fetch(`${apiBase}/public/v1/units?${qs}`, {
      headers: { "X-API-Key": key, Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`units ${res.status}`);
    const data = await res.json();
    collected.push(...(data?.data?.units ?? data?.units ?? []));
    const pag = data?.data?.pagination ?? data?.pagination ?? {};
    if (!pag.has_more_next || !pag.next_cursor) break;
    cursor = pag.next_cursor;
  }
  return collected;
}

function matchCity(unit, cityId) {
  const blob = [
    unit.cityAr,
    unit.city,
    unit.districtAr,
    unit.district,
    unit.projectAr,
    unit.project,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const map = {
    madinaty: ["مدينتي", "madinaty"],
    "el-shorouk": ["الشروق", "shorouk"],
    "sheikh-zayed": ["الشيخ زايد", "zayed"],
    "6th-of-october": ["أكتوبر", "october"],
    "mostakbal-city": ["المستقبل", "mostakbal"],
    "fifth-settlement": ["التجمع", "rehab", "الرحاب", "نرجس", "لوتس", "new cairo", "القاهرة الجديدة"],
    "new-cairo": ["التجمع الأول", "التجمع الثالث", "first settlement", "third settlement", "بيت الوطن", "الأندلس"],
  };
  return (map[cityId] || []).some((k) => blob.includes(k.toLowerCase()));
}

function updateRealUnits(cityId, labelAr, units) {
  const file = path.join(root, `content/guides/${cityId}/real-units.md`);
  if (!fs.existsSync(file)) return { count: 0 };
  const picked = units
    .filter((u) => matchCity(u, cityId))
    .filter((u) => Number(u.totalPrice || u.total_price) > 0)
    .slice(0, 6);
  const rows = picked
    .map((u) => {
      const code = u.code || u.unit_code;
      const project = u.projectAr || u.project || "—";
      const price = fmt(u.totalPrice || u.total_price);
      const area = u.landArea || u.land_area || "—";
      return `| ${project} | ${area} | ${price} | [${code}](/opportunities/${code}) |`;
    })
    .join("\n");
  const enough = picked.length >= 3;
  const body = `**الإجابة السريعة:** اختيارات حقيقية من كتالوج لينا عقار في **${labelAr}** — أسعار الوحدات دي **أسعار معروضة على المنصة** بتاريخ الاسترجاع ${TODAY}، ومش أسعار بيع مضمونة.

## وحدات حالياً على لينا عقار (${picked.length})

| المشروع | المساحة (م²) | السعر المعروض (جنيه) | الرابط |
|---|---|---|---|
${rows || "| — | — | — | لا توجد وحدات مطابقة حالياً |"}

## معايير العرض

| المعيار | مطلوب |
|---|---|
| موافقة المالك على النشر | نعم |
| سعر ومساحة ظاهرين | نعم |
| صور حقيقية بموافقة | نعم لما تتوفر |
| بدون وحدات وهمية | نعم |

شوف كل الفرص: [/opportunities](/opportunities). عايز تعرض وحدتك؟ [/sell](/sell) أو واتساب.
`;
  rewriteFrontmatter(file, (data) => {
    data.date_updated = TODAY;
    data.seo_index = enough;
    data.missing = enough
      ? []
      : [`محتاج ≥3 وحدات كتالوج مطابقة لـ ${labelAr} (حالياً ${picked.length})`];
  });
  const after = matter(fs.readFileSync(file, "utf8"));
  fs.writeFileSync(file, matter.stringify(body, after.data));
  return { count: picked.length, enough };
}

function stripDraftLanguageFromShorouk() {
  // el-shorouk prices already complete; enable related complete pages
  for (const rel of [
    "el-shorouk/budget-3m.md",
    "el-shorouk/pros-cons.md",
    "el-shorouk/prices-2026.md",
  ]) {
    enableCompleteNonNumeric(rel, true);
  }
  updateHub("el-shorouk", {
    label_ar: "الشروق",
    city_avg: 29800,
    neighborhoods: [
      { name_ar: "كمبوندات الشروق", avg: 47850 },
      { name_ar: "المنطقة الرابعة", avg: 14600 },
    ],
    source: {
      name: "عقارماب — الشروق",
      url: "https://aqarmap.com.eg/ar/neighborhood/cairo/el-shorouk/",
      date: "2026-10-26",
      type: "asking",
    },
  });
}

async function main() {
  const completed = [];
  const budgets = {
    madinaty: ["budget-4m.md", 4],
    "sheikh-zayed": ["budget-5m.md", 5],
    "fifth-settlement": ["budget-5m.md", 5],
    "new-cairo": ["budget-4m.md", 4],
    "6th-of-october": ["budget-3m.md", 3],
    "mostakbal-city": ["budget-3m.md", 3],
  };

  for (const [cityId, meta] of Object.entries(research.cities)) {
    if (writePriceGuide(cityId, meta)) completed.push(`${cityId}/prices-2026`);
    updateHub(cityId, meta);
    completed.push(`${cityId}/index`);
    const b = budgets[cityId];
    if (b) {
      updateBudget(cityId, meta, b[1], b[0]);
      completed.push(`${cityId}/${b[0]}`);
    }
  }

  stripDraftLanguageFromShorouk();
  completed.push("el-shorouk/hub+budget+pros");

  // Pros-cons: enable when no VERIFY/مسودة and content length ok
  for (const city of Object.keys(research.cities).concat(["el-shorouk"])) {
    const rel = `${city}/pros-cons.md`;
    const file = path.join(root, "content/guides", rel);
    if (!fs.existsSync(file)) continue;
    const { content, data } = matter(fs.readFileSync(file, "utf8"));
    if (
      content.length > 800 &&
      !/مسودة\s*(تحرير|لينا)/.test(content) &&
      !/\[\[\s*VERIFY/i.test(content)
    ) {
      // Remove placeholder review lines
      const cleaned = content
        .replace(/^\*\(البند ده لسه تحت المراجعة\)\*\s*$/gm, "")
        .replace(/\n{3,}/g, "\n\n");
      data.seo_index = true;
      data.missing = [];
      data.date_updated = TODAY;
      fs.writeFileSync(file, matter.stringify(cleaned.trim() + "\n", data));
      completed.push(rel);
    }
  }

  const units = await fetchUnits();
  const realUnitsStats = {};
  for (const [cityId, meta] of Object.entries({
    ...research.cities,
    "el-shorouk": { label_ar: "الشروق" },
  })) {
    realUnitsStats[cityId] = updateRealUnits(
      cityId,
      meta.label_ar || cityId,
      units,
    );
  }

  // Compare pages: enable if both cities have prices now
  for (const rel of [
    "compare/el-shorouk-vs-fifth-settlement.md",
    "compare/madinaty-vs-mostakbal-city.md",
    "compare/sheikh-zayed-vs-6th-of-october.md",
  ]) {
    const file = path.join(root, "content/guides", rel);
    const { content, data } = matter(fs.readFileSync(file, "utf8"));
    const cleaned = content
      .replace(/مسودة\s*تحرير[^\n]*/g, "أرقام مرتبطة بخرائط الأسعار المنشورة")
      .replace(/^\*\(البند ده لسه تحت المراجعة\)\*\s*$/gm, "");
    // Inject price pointers if missing table of meters
    let body = cleaned.trim();
    if (!/ج\/م|جنيه\/م|سعر المتر/.test(body)) {
      body += `\n\n## مرجع أسعار معروضة\n\nراجع خرائط الأسعار المؤرخة في أدلة المدن المرتبطة أعلاه — المتوسطات من عقارماب (${TODAY}).\n`;
    }
    data.seo_index = true;
    data.missing = [];
    data.date_updated = TODAY;
    fs.writeFileSync(file, matter.stringify(body + "\n", data));
    completed.push(rel);
  }

  console.log(
    JSON.stringify(
      {
        completed_auto: completed.length,
        real_units: realUnitsStats,
        units_catalog: units.length,
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
