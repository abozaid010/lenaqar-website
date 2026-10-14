import { placeAr } from "./listing-seo.js";

/**
 * High-intent buyer landing pages from the marketing strategy.
 * Content is educational + request-first — never invents inventory counts or prices.
 * `matchKeywords` only filters already-public anonymized requirements for display.
 */
export const BUYER_LANDINGS = [
  {
    slug: "apartments-for-sale/new-cairo",
    href: "/apartments-for-sale/new-cairo",
    labelKey: "lenaqar.marketplace.browse.newCairo",
    title: "شقق للبيع في القاهرة الجديدة — اكتب طلبك حسب ميزانيتك",
    description:
      "بتدور على شقة في القاهرة الجديدة أو التجمع الخامس؟ اكتب طلبك: الميزانية، عدد الغرف، والاستلام. لينا عقار تساعدك تلاقي اختيارات مناسبة لطلبك.",
    h1: "شقق للبيع في القاهرة الجديدة حسب طلبك وميزانيتك",
    intro:
      "القاهرة الجديدة والتجمع من أكتر المناطق اللي بيظهر فيها طلب شراء على المنصة. بدل ما تلف على إعلانات كتير، ابدأ بطلب واضح: الميزانية، عدد الغرف، الاستلام (جاهز أو بالتقسيط)، وأي مشروع أو مواصفات بتفرق معاك.",
    bullets: [
      "حدد ميزانيتك والمقدم أو الكاش المتاح.",
      "وضّح عدد الغرف والمساحة التقريبية لو بتفرق.",
      "اذكر الاستلام: جاهز للسكن، أو خلال سنة/سنتين حسب احتياجك.",
      "لو عندك مشروع مفضّل، اكتبه في الملاحظات — من غير ما تقيّد نفسك لو مش شرط.",
    ],
    faq: [
      {
        q: "هل الصفحة دي قائمة وحدات جاهزة؟",
        a: "لأ. الصفحة بتشرح إزاي تكتب طلب شراء لشقة في القاهرة الجديدة. الوحدات المعروضة للتصفح موجودة في صفحة الفرص، والطلبات العامة بتتعرض بدون بيانات شخصية.",
      },
      {
        q: "لو مفيش مطابقة فورية لطلبي؟",
        a: "مش كل طلب بيلاقي مطابقة فورية. الطلب الواضح بيسهّل البحث، وكمان بيسجّل احتياج حقيقي في السوق حتى لو العرض الحالي محدود.",
      },
    ],
    initialValues: { buildingType: "apartment" },
    matchKeywords: [
      "new cairo",
      "القاهرة الجديدة",
      "fifth settlement",
      "التجمع",
      "تجمع",
      "tag city",
      "تاج",
    ],
    related: [
      "/apartments-for-sale/sheikh-zayed",
      "/ready-to-move-properties",
      "/guides/how-to-write-property-request",
    ],
  },
  {
    slug: "apartments-for-sale/sheikh-zayed",
    href: "/apartments-for-sale/sheikh-zayed",
    labelKey: "lenaqar.marketplace.browse.sheikhZayed",
    title: "شقق للبيع في الشيخ زايد — ابدأ بطلبك العقاري",
    description:
      "عايز شقة في الشيخ زايد؟ اكتب الميزانية وعدد الغرف وموعد الاستلام. لينا عقار بتبدأ من طلبك وتساعدك تلاقي اختيارات مناسبة.",
    h1: "شقق للبيع في الشيخ زايد حسب احتياجك",
    intro:
      "الشيخ زايد من المناطق اللي بتتكرر في طلبات المشترين. اكتب طلبك بمواصفات واضحة — الميزانية، الغرف، الاستلام، وهل بتفضّل كمبوند أو موقع معيّن — وهنساعدك تدور على اختيارات مناسبة لطلبك.",
    bullets: [
      "حدد أقصى ميزانية أو هيكل المقدم والقسط.",
      "اذكر عدد الغرف والموقع المفضّل داخل زايد لو تعرفه.",
      "وضّح لو الاستلام الفوري شرط أساسي.",
    ],
    faq: [
      {
        q: "أكتب طلب ولا أتصفح الفرص؟",
        a: "الاتنين متاحين. الطلب مناسب لو عندك مواصفات محددة. التصفح مناسب لو حابب تشوف المعروض الحالي وتقارن.",
      },
    ],
    initialValues: { buildingType: "apartment" },
    matchKeywords: ["sheikh zayed", "الشيخ زايد", "زايد"],
    related: [
      "/apartments-for-sale/6th-of-october",
      "/apartments-for-sale/new-cairo",
      "/guides/how-to-write-property-request",
    ],
  },
  {
    slug: "apartments-for-sale/6th-of-october",
    href: "/apartments-for-sale/6th-of-october",
    labelKey: "lenaqar.marketplace.browse.october",
    title: "شقق للبيع في 6 أكتوبر — اكتب مواصفاتك وميزانيتك",
    description:
      "بتدور على شقة في 6 أكتوبر أو التوسعات؟ اكتب طلب شراء بالميزانية والغرف والاستلام. لينا عقار تساعدك تلاقي اختيارات مناسبة لطلبك.",
    h1: "شقق للبيع في 6 أكتوبر حسب طلبك",
    intro:
      "أكتوبر والتوسعات الشرقية بتظهر في طلبات شراء بميزانيات ومواصفات مختلفة. ابدأ بطلب واضح عشان البحث يبقى أقرب لاحتياجك، مش لأقرب إعلان.",
    bullets: [
      "حدد المنطقة بدقة لو بتفرق (أكتوبر، التوسعات، أحياء معيّنة).",
      "اكتب الميزانية وهيكل الدفع.",
      "وضّح نوع الوحدة وعدد الغرف.",
    ],
    faq: [
      {
        q: "هل تغطّون التوسعات الشرقية؟",
        a: "تقدر تذكر التوسعات أو أي حي في طلبك. التغطية تعتمد على الطلبات والوحدات المتاحة المطابقة — من غير ضمان مطابقة فورية.",
      },
    ],
    initialValues: { buildingType: "apartment" },
    matchKeywords: ["6 october", "أكتوبر", "اكتوبر", "october", "توسعات"],
    related: [
      "/apartments-for-sale/sheikh-zayed",
      "/villas-for-sale/egypt",
      "/guides/resale-vs-new-launch",
    ],
  },
  {
    slug: "chalets-for-sale/north-coast",
    href: "/chalets-for-sale/north-coast",
    labelKey: "lenaqar.marketplace.browse.northCoast",
    title: "شاليهات للبيع في الساحل الشمالي — اكتب مواصفاتك",
    description:
      "بتدور على شاليه في الساحل الشمالي؟ حدد الميزانية والموقع وعدد الغرف. لينا عقار بتبدأ من طلبك وتساعدك تلاقي اختيارات مناسبة.",
    h1: "شاليهات للبيع في الساحل الشمالي حسب طلبك",
    intro:
      "الساحل موسمي وفيه تفضيلات كتير: موقع، قرب البحر، الميزانية، والاستلام. اكتب طلبك بالتفاصيل اللي تفرق معاك عشان الاختيارات تبقى أوضح.",
    bullets: [
      "حدد الميزانية القصوى أو المقدم المتاح.",
      "اذكر المنطقة المفضّلة لو عندك (من غير ما تخترع توفر).",
      "وضّح عدد الغرف وأي شرط أساسي زي الاستلام أو التشطيب.",
    ],
    faq: [
      {
        q: "هل في ضمان شاليه على البحر؟",
        a: "لأ. بنساعد تدور حسب طلبك والمتاح المطابق. أي شرط زي الواجهة البحرية اكتبه بوضوح في الطلب.",
      },
    ],
    initialValues: { buildingType: "chalet" },
    matchKeywords: ["north coast", "الساحل", "ساحل", "علمين", "alamein"],
    related: [
      "/ready-to-move-properties",
      "/guides/how-to-write-property-request",
      "/apartments-for-sale/new-cairo",
    ],
  },
  {
    slug: "ready-to-move-properties",
    href: "/ready-to-move-properties",
    labelKey: "lenaqar.marketplace.browse.ready",
    title: "شقق ووحدات استلام فوري / جاهزة للسكن في مصر",
    description:
      "بتدور على وحدة جاهزة للسكن أو استلام فوري؟ اكتب طلبك بالمكان والميزانية. لينا عقار تساعدك تلاقي اختيارات مناسبة لطلبك من غير وعود غير مدعومة.",
    h1: "وحدات استلام فوري وجاهزة للسكن — ابدأ بطلبك",
    intro:
      "لو الاستلام الفوري شرط أساسي، اكتبه في الطلب من الأول. ده بيسهّل فلترة الاختيارات وبيقلل الوقت الضائع على وحدات تحت الإنشاء لو مش مناسبة ليك.",
    bullets: [
      "اختار التسليم «مسلّمة / جاهزة» في نموذج الطلب.",
      "حدد المكان والميزانية بوضوح.",
      "اذكر أي شروط تشطيب أو دور أو مساحة لو بتفرق.",
    ],
    faq: [
      {
        q: "هل كل الوحدات المعروضة جاهزة؟",
        a: "لأ. حالة الاستلام تختلف من وحدة لوحدة. اكتب الاستلام الفوري في طلبك عشان نركّز على المطابق، وتأكد من حالة أي وحدة قبل القرار.",
      },
    ],
    initialValues: { deliveryDate: "ready", paymentMode: "cash" },
    matchKeywords: [],
    matchDeliveryReady: true,
    related: [
      "/apartments-for-sale/new-cairo",
      "/guides/resale-vs-new-launch",
      "/opportunities",
    ],
  },
  {
    slug: "villas-for-sale/egypt",
    href: "/villas-for-sale/egypt",
    labelKey: "lenaqar.marketplace.browse.villas",
    title: "فلل للبيع في مصر — اكتب مواصفات الفيلا اللي بتدور عليها",
    description:
      "بتدور على فيلا أو تاون هاوس؟ اكتب الميزانية والمكان وعدد الغرف. لينا عقار بتبدأ من طلبك وتساعدك تلاقي اختيارات مناسبة.",
    h1: "فلل وتاون هاوس للبيع حسب طلبك",
    intro:
      "طلبات الفلل بتختلف جدًا في المساحة والميزانية والموقع. ابدأ بطلب واضح بدل التصفح العشوائي — وحدد زايد، أكتوبر، القاهرة الجديدة، أو أي منطقة بتهمك.",
    bullets: [
      "حدد نوع الوحدة: فيلا، تاون هاوس، أو توين هاوس لو بتفرق.",
      "اكتب الميزانية والمكان.",
      "وضّح الاستلام وعدد الغرف.",
    ],
    faq: [
      {
        q: "أختار فيلا ولا تاون هاوس في الطلب؟",
        a: "لو عندك تفضيل واضح، حدده. لو مرن، اذكر ذلك في الملاحظات عشان الاختيارات تبقى أوسع.",
      },
    ],
    initialValues: { buildingType: "villa" },
    matchKeywords: ["فيلا", "villa", "تاون", "town", "twin"],
    related: [
      "/apartments-for-sale/sheikh-zayed",
      "/apartments-for-sale/6th-of-october",
      "/guides/how-to-write-property-request",
    ],
  },
];

export const BUYER_LANDING_LINKS = BUYER_LANDINGS.map((page) => ({
  href: page.href,
  labelKey: page.labelKey,
}));

export function getBuyerLanding(slug) {
  return BUYER_LANDINGS.find((page) => page.slug === slug) || null;
}

function locationHaystack(requirement) {
  const locations = Array.isArray(requirement?.locations)
    ? requirement.locations
    : [];
  const parts = [];
  for (const loc of locations) {
    const city = String(loc?.city || "").trim();
    const district = String(loc?.district || "").trim();
    parts.push(city, district, placeAr(city) || "", placeAr(district) || "");
  }
  const notes = String(requirement?.notes || "");
  return `${parts.join(" ")} ${notes}`.toLowerCase();
}

/**
 * Filter public anonymized requirements for a landing page.
 * Returns only rows that already exist — never fabricates demand.
 */
export function filterRequirementsForLanding(requirements, landing) {
  const rows = Array.isArray(requirements) ? requirements : [];
  if (!landing) return [];

  return rows.filter((row) => {
    if (landing.matchDeliveryReady) {
      const delivery = String(row?.deliveryDate || row?.delivery || "")
        .trim()
        .toLowerCase();
      const ready =
        delivery === "ready" ||
        delivery === "immediate" ||
        delivery === "delivered" ||
        delivery.includes("جاهز") ||
        delivery.includes("فوري") ||
        delivery.includes("مسل");
      if (!ready) return false;
      return true;
    }

    const keywords = landing.matchKeywords || [];
    if (keywords.length === 0) return false;
    const hay = locationHaystack(row);
    return keywords.some((kw) => hay.includes(String(kw).toLowerCase()));
  });
}
