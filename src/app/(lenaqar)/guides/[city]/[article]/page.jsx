import { notFound } from "next/navigation";
import { SITE } from "@/config/site";
import { getCityById, isKnownCitySlug } from "@/lib/guides/cities";
import {
  getCityArticles,
  getGuideBySlug,
  normalizeSlug,
} from "@/lib/guides/load";
import { guideMetadata } from "@/lib/guides/metadata";
import { guideJsonLdScripts } from "@/lib/guides/schema";
import GuideArticleLayout from "@/components/guides/GuideArticleLayout";
import GuideJsonLd from "@/components/guides/GuideJsonLd";
import { loadGuideInventorySummary } from "@/lib/guides/inventory-summary.server";

// Price guides carry a live LenAqar asking-price table (GuideInventorySummary);
// refresh it hourly instead of only on deploy.
export const revalidate = 3600;

export async function generateStaticParams() {
  const { loadAllGuides } = await import("@/lib/guides/load");
  return loadAllGuides()
    .filter((g) => {
      const parts = normalizeSlug(g.slug).split("/").filter(Boolean);
      return parts.length === 3 && parts[0] === "guides" && isKnownCitySlug(parts[1]);
    })
    .map((g) => {
      const parts = normalizeSlug(g.slug).split("/").filter(Boolean);
      return { city: parts[1], article: parts[2] };
    });
}

export async function generateMetadata({ params }) {
  const { city, article } = await params;
  if (!isKnownCitySlug(city)) return { title: "دليل المشتري" };
  const guide = getGuideBySlug(`/guides/${city}/${article}/`);
  if (!guide) return { title: "دليل المشتري", robots: { index: false } };
  return guideMetadata(guide);
}

export default async function CityArticlePage({ params }) {
  const { city, article } = await params;
  if (!isKnownCitySlug(city)) notFound();

  const guide = getGuideBySlug(`/guides/${city}/${article}/`);
  if (!guide) notFound();

  const cityMeta = getCityById(city);
  const related = getCityArticles(city)
    .filter((a) => normalizeSlug(a.slug) !== normalizeSlug(guide.slug))
    .slice(0, 4);

  const breadcrumbs = [
    { name: "دليل المشتري", url: `${SITE.url}/guides`, path: "/guides" },
    {
      name: cityMeta.name_ar,
      url: `${SITE.url}/guides/${city}/`,
      path: `/guides/${city}/`,
    },
    {
      name: guide.h1 || guide.title,
      url: `${SITE.url}${normalizeSlug(guide.slug)}`,
      path: normalizeSlug(guide.slug),
    },
  ];

  const blocks = guideJsonLdScripts(guide, { breadcrumbs, city: cityMeta });
  const inventorySummary = await loadGuideInventorySummary(guide.slug);

  return (
    <>
      <GuideJsonLd blocks={blocks} />
      <GuideArticleLayout
        guide={guide}
        breadcrumbs={breadcrumbs}
        related={related}
        inventorySummary={inventorySummary}
      />
    </>
  );
}
