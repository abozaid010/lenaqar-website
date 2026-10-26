import { notFound } from "next/navigation";
import { SITE } from "@/config/site";
import {
  getBuyingGuides,
  getGuideBySlug,
  normalizeSlug,
} from "@/lib/guides/load";
import { guideMetadata } from "@/lib/guides/metadata";
import { guideJsonLdScripts } from "@/lib/guides/schema";
import GuideArticleLayout from "@/components/guides/GuideArticleLayout";
import GuideJsonLd from "@/components/guides/GuideJsonLd";

export async function generateStaticParams() {
  const { loadAllGuides } = await import("@/lib/guides/load");
  return loadAllGuides()
    .filter((g) => normalizeSlug(g.slug).startsWith("/guides/buying/"))
    .map((g) => {
      const parts = normalizeSlug(g.slug).split("/").filter(Boolean);
      return { slug: parts[2] };
    });
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const guide = getGuideBySlug(`/guides/buying/${slug}/`);
  if (!guide) return { title: "دليل المشتري", robots: { index: false } };
  return guideMetadata(guide);
}

export default async function BuyingGuidePage({ params }) {
  const { slug } = await params;
  const guide = getGuideBySlug(`/guides/buying/${slug}/`);
  if (!guide) notFound();

  const related = getBuyingGuides()
    .filter((a) => normalizeSlug(a.slug) !== normalizeSlug(guide.slug))
    .slice(0, 4);

  const breadcrumbs = [
    { name: "دليل المشتري", url: `${SITE.url}/guides`, path: "/guides" },
    {
      name: guide.h1 || guide.title,
      url: `${SITE.url}${normalizeSlug(guide.slug)}`,
      path: normalizeSlug(guide.slug),
    },
  ];

  return (
    <>
      <GuideJsonLd blocks={guideJsonLdScripts(guide, { breadcrumbs })} />
      <GuideArticleLayout
        guide={guide}
        breadcrumbs={breadcrumbs}
        related={related}
      />
    </>
  );
}
