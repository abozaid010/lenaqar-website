import { notFound } from "next/navigation";
import Link from "next/link";
import { SITE } from "@/config/site";
import { getCityById, isKnownCitySlug } from "@/lib/guides/cities";
import { getCityArticles, getCityHub, normalizeSlug } from "@/lib/guides/load";
import { guideMetadata } from "@/lib/guides/metadata";
import { guideJsonLdScripts } from "@/lib/guides/schema";
import GuideArticleLayout from "@/components/guides/GuideArticleLayout";
import GuideJsonLd from "@/components/guides/GuideJsonLd";
import GuideStickyWhatsApp from "@/components/guides/GuideStickyWhatsApp";

const PILLAR_LABELS = {
  P1: "خريطة الأسعار",
  P2: "الملف الأحمر",
  P3: "المميزات والفرص",
  P4: "اختيارات حقيقية",
  insight: "لو معاك ميزانية…",
};

export async function generateStaticParams() {
  const { loadAllGuides, normalizeSlug } = await import("@/lib/guides/load");
  const { isKnownCitySlug } = await import("@/lib/guides/cities");
  const cities = new Set();
  for (const g of loadAllGuides()) {
    const parts = normalizeSlug(g.slug).split("/").filter(Boolean);
    if (parts[0] === "guides" && parts.length === 2 && isKnownCitySlug(parts[1])) {
      cities.add(parts[1]);
    }
  }
  return [...cities].map((city) => ({ city }));
}

export async function generateMetadata({ params }) {
  const { city } = await params;
  if (!isKnownCitySlug(city)) return { title: "دليل المشتري" };
  const hub = getCityHub(city);
  if (!hub) {
    const cityMeta = getCityById(city);
    return {
      title: cityMeta ? `دليل ${cityMeta.name_ar}` : "دليل المشتري",
      robots: { index: false, follow: false },
    };
  }
  return guideMetadata(hub);
}

export default async function CityHubPage({ params }) {
  const { city } = await params;
  if (!isKnownCitySlug(city)) notFound();

  const cityMeta = getCityById(city);
  const hub = getCityHub(city);
  if (!hub) notFound();

  const articles = getCityArticles(city);
  const breadcrumbs = [
    { name: "دليل المشتري", url: `${SITE.url}/guides`, path: "/guides" },
    {
      name: cityMeta.name_ar,
      url: `${SITE.url}/guides/${city}/`,
      path: `/guides/${city}/`,
    },
  ];

  const blocks = guideJsonLdScripts(hub, { breadcrumbs, city: cityMeta });

  const pillarRows = ["P1", "insight", "P3", "P2", "P4"]
    .map((pillar) => {
      const article = articles.find((a) => a.pillar === pillar);
      if (!article) return null;
      return {
        pillar,
        label: PILLAR_LABELS[pillar] || pillar,
        title: article.title,
        href: normalizeSlug(article.slug),
      };
    })
    .filter(Boolean);

  return (
    <>
      <GuideJsonLd blocks={blocks} />
      <GuideArticleLayout
        guide={hub}
        breadcrumbs={breadcrumbs}
        related={articles.slice(0, 6)}
      />
      {pillarRows.length > 0 || (cityMeta.districts || []).length > 0 ? (
        <div className="container max-w-3xl -mt-8 mb-16 space-y-8">
          {pillarRows.length > 0 ? (
            <section aria-labelledby="pillars-table">
              <h2 id="pillars-table" className="text-xl font-bold text-primary mb-3">
                ملخص أدلة {cityMeta.name_ar}
              </h2>
              <div className="overflow-x-auto rounded-xl border border-primary/15">
                <table className="min-w-full text-sm">
                  <thead className="bg-primary/[0.06] text-primary">
                    <tr>
                      <th className="px-3 py-2 text-start">العمود</th>
                      <th className="px-3 py-2 text-start">المقال</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pillarRows.map((row) => (
                      <tr key={row.pillar} className="border-t border-primary/10">
                        <td className="px-3 py-2">{row.label}</td>
                        <td className="px-3 py-2">
                          <Link
                            href={row.href}
                            className="text-primary font-semibold hover:underline"
                          >
                            {row.title}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          {(cityMeta.districts || []).length > 0 ? (
            <section aria-labelledby="districts-list">
              <h2 id="districts-list" className="text-xl font-bold text-primary mb-3">
                أحياء ومناطق قيد التغطية
              </h2>
              <ul className="list-disc pe-6 space-y-1 text-black/75">
                {cityMeta.districts.map((d) => (
                  <li key={d.name_ar}>
                    {d.name_ar}
                    {d.status === "to_confirm" ? (
                      <span className="text-black/45 text-sm"> (للتأكيد)</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      ) : null}
      <GuideStickyWhatsApp leadCode={hub.lead_code} />
    </>
  );
}
