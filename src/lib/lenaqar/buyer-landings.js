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
      "بتدور على شقة في القاهرة الجديدة أو التجمع الخامس؟ اكتب طلبك: الميزانية، عدد الغرف، والاستلام. لينا عقار بتساعدك تلاقي اختيارات مناسبة لطلبك.",
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
      "/apartments-for-sale/fifth-settlement",
      "/guides/new-cairo/",
      "/guides/buying/how-to-write-property-request",
      "/ready-to-move-properties",
    ],
  },
  {
    slug: "apartments-for-sale/fifth-settlement",
    href: "/apartments-for-sale/fifth-settlement",
    labelKey: "lenaqar.marketplace.browse.fifthSettlement",
    title: "شقق للبيع في التجمع الخامس — اكتب طلبك وميزانيتك",
    description:
      "بتدور على شقة في التجمع الخامس؟ اكتب الميزانية وعدد الغرف والاستلام. لينا عقار بتبدأ من طلبك — من غير مكالمات باردة.",
    h1: "شقق للبيع في التجمع الخامس حسب طلبك",
    intro:
      "التجمع الخامس من أعلى مناطق البحث شرق القاهرة. ابدأ بطلب واضح (ميزانية، غرف، استلام، كمبوند أو حي) بدل التصفح العشوائي. للأسعار والأحياء شوف دليل التجمع لما يكون منشور.",
    bullets: [
      "حدد الحي أو الكمبوند لو عندك تفضيل (النرجس، اللوتس، …).",
      "فرّق بين الكاش والمقدم والتقسيط.",
      "وضّح جاهز للسكن ولا تحت الإنشاء.",
    ],
    faq: [
      {
        q: "التجمع الخامس ولا القاهرة الجديدة؟",
        a: "التجمع الخامس جزء من القاهرة الجديدة إداريًا في أذهان كتير من المشترين، لكن ناس بتبحث بالاسمين بشكل مختلف. لو مرن، اكتب الاتنين كبدائل في الطلب.",
      },
      {
        q: "فين خريطة الأسعار؟",
        a: "في دليل المشتري: /guides/fifth-settlement/ — الأرقام بتاريخ ومصدر لما تكون مؤكدة.",
      },
    ],
    initialValues: { buildingType: "apartment" },
    matchKeywords: [
      "fifth settlement",
      "التجمع الخامس",
      "تجمع خامس",
      "tagamoa",
      "tagammoa",
    ],
    related: [
      "/apartments-for-sale/new-cairo",
      "/guides/fifth-settlement/",
      "/guides/compare/el-shorouk-vs-fifth-settlement",
    ],
  },
  {
    slug: "apartments-for-sale/madinaty",
    href: "/apartments-for-sale/madinaty",
    labelKey: "lenaqar.marketplace.browse.madinaty",
    title: "شقق للبيع في مدينتي — ابدأ بطلبك العقاري",
    description:
      "عايز شقة في مدينتي؟ اكتب المجموعة أو المرحلة والميزانية وعدد الغرف والاستلام. لينا عقار بتدور حسب طلبك.",
    h1: "شقق للبيع في مدينتي حسب احتياجك",
    intro:
      "مدينتي بتتكرر في طلبات المشترين (مجموعات B، فيلات، مراحل مسلّمة). اكتب طلبك بوضوح عشان المقارنة تبقى على مواصفاتك مش على أقرب إعلان.",
    bullets: [
      "اذكر المجموعة أو المرحلة لو تعرفها.",
      "حدد الميزانية وهيكل الدفع.",
      "وضّح الاستلام: جاهز أو أبعد.",
    ],
    faq: [
      {
        q: "لازم أعرف رقم المجموعة؟",
        a: "لو مش عارف، اكتب الميزانية والغرف والاستلام — والمجموعة تبقى مرنة في الملاحظات.",
      },
    ],
    initialValues: { buildingType: "apartment" },
    matchKeywords: ["madinaty", "مدينتي", "madina ty"],
    related: [
      "/guides/madinaty/",
      "/apartments-for-sale/new-cairo",
      "/guides/compare/madinaty-vs-mostakbal-city",
    ],
  },
  {
    slug: "apartments-for-sale/el-shorouk",
    href: "/apartments-for-sale/el-shorouk",
    labelKey: "lenaqar.marketplace.browse.elShorouk",
    title: "شقق للبيع في الشروق — اكتب ميزانيتك والحي",
    description:
      "بتدور على شقة في مدينة الشروق؟ اكتب الحي والميزانية وعدد الغرف. لينا عقار بتساعدك تلاقي اختيارات مناسبة لطلبك.",
    h1: "شقق للبيع في الشروق حسب طلبك وميزانيتك",
    intro:
      "الشروق فيها فرق كبير بين أحياء وكمبوندات في سعر المتر. ابدأ بطلب واضح، وراجع خريطة الأسعار في دليل الشروق قبل ما تثبت توقعاتك.",
    bullets: [
      "حدد الحي أو «كمبوند» لو ده شرط.",
      "اكتب الميزانية الكلية والمقدم.",
      "وضّح عدد الغرف والاستلام.",
    ],
    faq: [
      {
        q: "أرخص من التجمع؟",
        a: "في كتير من الأحياء متوسطات المعروض أقل من مؤشرات التجمع — لكن قارن حي بحي. شوف دليل الأسعار والمقارنة.",
      },
    ],
    initialValues: { buildingType: "apartment" },
    matchKeywords: ["shorouk", "el shorouk", "الشروق", "مدينة الشروق"],
    related: [
      "/guides/el-shorouk/",
      "/guides/el-shorouk/prices-2026",
      "/apartments-for-sale/fifth-settlement",
    ],
  },
  {
    slug: "apartments-for-sale/mostakbal-city",
    href: "/apartments-for-sale/mostakbal-city",
    labelKey: "lenaqar.marketplace.browse.mostakbalCity",
    title: "شقق للبيع في مدينة المستقبل — اكتب مواصفاتك",
    description:
      "بتدور على شقة في مدينة المستقبل؟ وضّح الميزانية والاستلام (جاهز أو تحت الإنشاء). لينا عقار بتبدأ من طلبك مع فحص حذر للمشاريع.",
    h1: "شقق للبيع في مدينة المستقبل حسب طلبك",
    intro:
      "مدينة المستقبل فيها شريحة كبيرة تحت الإنشاء. اكتب موعد الاستلام بوضوح، واقرأ دليل العناية الواجبة قبل أي مقدم.",
    bullets: [
      "فرّق بين جاهز وتحت الإنشاء من أول الطلب.",
      "حدد الميزانية والمقدم وسنين القسط لو ينطبق.",
      "اذكر مشروع أو مرحلة لو عندك تفضيل — من غير ما تقيّد نفسك لو مش شرط.",
    ],
    faq: [
      {
        q: "أنسب من مدينتي؟",
        a: "مش قاعدة ثابتة — قارن الاستلام والسعر والمخاطر. شوف صفحة المقارنة في الدليل.",
      },
    ],
    initialValues: { buildingType: "apartment" },
    matchKeywords: [
      "mostakbal",
      "mostakbal city",
      "مدينة المستقبل",
      "المستقبل",
    ],
    related: [
      "/guides/mostakbal-city/",
      "/apartments-for-sale/madinaty",
      "/guides/buying/check-developer-project",
    ],
  },
  {
    slug: "apartments-for-sale/noor-city",
    href: "/apartments-for-sale/noor-city",
    labelKey: "lenaqar.marketplace.browse.noorCity",
    title: "شقق للبيع في مدينة نور — اكتب طلبك",
    description:
      "عايز شقة في مدينة نور؟ اكتب الميزانية والغرف والاستلام. لينا عقار بتدور حسب طلبك — من غير اختراع أسعار أو وعود تسليم.",
    h1: "شقق للبيع في مدينة نور حسب طلبك",
    intro:
      "مدينة نور تظهر في طلبات شرق القاهرة. لسه بنبني خريطة أسعار منشورة بمصادر مؤكدة؛ ابدأ بطلب واضح وهنطابق المتاح بدون أرقام مخترعة على الصفحة.",
    bullets: [
      "اكتب الميزانية وهيكل الدفع.",
      "حدد الاستلام المطلوب.",
      "أي مشروع مفضّل اكتبه في الملاحظات.",
    ],
    faq: [
      {
        q: "في جدول أسعار هنا؟",
        a: "لأ حاليًا — مش هننشر متوسطات من غير مصدر وتاريخ. ابعت الطلب ونراجع المتاح.",
      },
    ],
    initialValues: { buildingType: "apartment" },
    matchKeywords: ["noor", "noor city", "نور", "مدينة نور"],
    related: [
      "/apartments-for-sale/new-cairo",
      "/apartments-for-sale/madinaty",
      "/guides/buying/how-to-write-property-request",
    ],
  },
  {
    slug: "apartments-for-sale/new-administrative-capital",
    href: "/apartments-for-sale/new-administrative-capital",
    labelKey: "lenaqar.marketplace.browse.newCapital",
    title: "شقق للبيع في العاصمة الإدارية — اكتب مواصفاتك",
    description:
      "بتدور على شقة في العاصمة الإدارية الجديدة؟ حدد الميزانية والحي/المشروع والاستلام. لينا عقار بتبدأ من طلبك.",
    h1: "شقق للبيع في العاصمة الإدارية حسب طلبك",
    intro:
      "العاصمة الإدارية سوق واسع (أحياء ومشاريع متعددة). من غير ما نخترع سعر متر موحّد، اكتب طلبك بالمرونة بتاعتك وهنساعدك تقارن اختيارات حقيقية.",
    bullets: [
      "حدد الحي أو المحور لو بيفرق.",
      "اكتب الميزانية والاستلام بوضوح.",
      "فرّق بين ريسيل وطرح مطور في الملاحظات لو عندك تفضيل.",
    ],
    faq: [
      {
        q: "ليكم مقر هناك؟",
        a: "عنوان الشركة: 505 ARCHPLAN Square، العاصمة الإدارية، القاهرة — التواصل مع المشترين واتساب.",
      },
    ],
    initialValues: { buildingType: "apartment" },
    matchKeywords: [
      "new capital",
      "administrative capital",
      "العاصمة",
      "العاصمة الإدارية",
      "العاصمه",
    ],
    related: [
      "/apartments-for-sale/new-cairo",
      "/guides/buying/how-to-write-property-request",
      "/ready-to-move-properties",
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
      "حدد أقصى ميزانية، أو المقدم والقسط.",
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
      "/guides/sheikh-zayed/",
      "/guides/buying/how-to-write-property-request",
      "/guides/compare/sheikh-zayed-vs-6th-of-october",
    ],
  },
  {
    slug: "apartments-for-sale/6th-of-october",
    href: "/apartments-for-sale/6th-of-october",
    labelKey: "lenaqar.marketplace.browse.october",
    title: "شقق للبيع في 6 أكتوبر — اكتب مواصفاتك وميزانيتك",
    description:
      "بتدور على شقة في 6 أكتوبر أو التوسعات؟ اكتب طلب شراء بالميزانية والغرف والاستلام. لينا عقار بتساعدك تلاقي اختيارات مناسبة لطلبك.",
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
        q: "بتغطوا التوسعات الشرقية؟",
        a: "تقدر تكتب التوسعات أو أي حي في طلبك. التغطية بتعتمد على الطلبات والوحدات المطابقة — من غير ضمان مطابقة فورية.",
      },
    ],
    initialValues: { buildingType: "apartment" },
    matchKeywords: ["6 october", "أكتوبر", "اكتوبر", "october", "توسعات"],
    related: [
      "/apartments-for-sale/sheikh-zayed",
      "/guides/6th-of-october/",
      "/guides/buying/resale-vs-new-launch",
      "/villas-for-sale/egypt",
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
      "اكتب المنطقة اللي تفضّلها لو عندك منطقة معيّنة.",
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
      "/guides/buying/how-to-write-property-request",
      "/apartments-for-sale/new-cairo",
    ],
  },
  {
    slug: "ready-to-move-properties",
    href: "/ready-to-move-properties",
    labelKey: "lenaqar.marketplace.browse.ready",
    title: "شقق ووحدات استلام فوري / جاهزة للسكن في مصر",
    description:
      "بتدور على وحدة جاهزة للسكن أو استلام فوري؟ اكتب طلبك بالمكان والميزانية. لينا عقار بتساعدك تلاقي اختيارات مناسبة لطلبك من غير وعود مش مدعومة.",
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
      "/guides/buying/resale-vs-new-launch",
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
        q: "أكتب فيلا ولا تاون هاوس في الطلب؟",
        a: "لو عندك تفضيل واضح، اكتبه. لو لسه مرن، اكتب كده في الملاحظات عشان الاختيارات تبقى أوسع.",
      },
    ],
    initialValues: { buildingType: "villa" },
    matchKeywords: ["فيلا", "villa", "تاون", "town", "twin"],
    related: [
      "/apartments-for-sale/sheikh-zayed",
      "/apartments-for-sale/6th-of-october",
      "/guides/buying/how-to-write-property-request",
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
