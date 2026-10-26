/**
 * Legacy link helpers for marketplace CTAs.
 * Full guides now live as Markdown under content/guides/; these slugs redirect
 * to /guides/buying/* via next.config redirects and mirror published buying guides.
 */
export const BUYER_GUIDES = [
  {
    slug: "how-to-write-property-request",
    href: "/guides/buying/how-to-write-property-request",
    labelKey: "lenaqar.marketplace.browse.guideRequest",
    title: "إزاي تكتب طلب عقاري واضح يساعدك تلاقي اختيارات أنسب؟",
    description:
      "دليل عملي لكتابة طلب شراء عقار في مصر: المكان، الميزانية، الغرف، الاستلام، والملاحظات اللي بتفرّق — من غير وعود أو أرقام مخترعة.",
    h1: "إزاي تكتب طلب عقاري واضح؟",
  },
  {
    slug: "resale-vs-new-launch",
    href: "/guides/buying/resale-vs-new-launch",
    labelKey: "lenaqar.marketplace.browse.guideResale",
    title: "إيه الفرق بين إعادة البيع والوحدات الجديدة؟",
    description:
      "شرح بسيط للفرق بين وحدات إعادة البيع (ريسيل) والإطلاق الجديد في مصر، وإزاي تختار حسب احتياجك وميزانيتك وموعد الاستلام.",
    h1: "إعادة البيع ولا وحدة جديدة؟",
  },
];

export const BUYER_GUIDE_LINKS = BUYER_GUIDES.map((guide) => ({
  href: guide.href,
  labelKey: guide.labelKey,
}));

export function getBuyerGuide(slug) {
  return BUYER_GUIDES.find((guide) => guide.slug === slug) || null;
}
