import { notFound } from "next/navigation";
import { SITE } from "@/config/site";
import { getCityById, isKnownCitySlug } from "@/lib/guides/cities";
import {
  getGuideBySlug,
  loadAllGuidesIncludingDrafts,
  normalizeSlug,
} from "@/lib/guides/load";
import { isPreviewAuthorized } from "@/lib/guides/preview-auth";
import { guideMetadata } from "@/lib/guides/metadata";
import { guideJsonLdScripts } from "@/lib/guides/schema";
import GuideArticleLayout from "@/components/guides/GuideArticleLayout";
import GuideJsonLd from "@/components/guides/GuideJsonLd";

export const dynamic = "force-dynamic";

export const metadata = {
  robots: { index: false, follow: false, nocache: true },
};

function resolveGuideFromParts(parts = []) {
  if (!parts.length) return null;
  const slug = `/guides/${parts.join("/")}/`;
  return getGuideBySlug(slug, { allowPreview: true });
}

export default async function InternalGuidePreviewPage({ params, searchParams }) {
  const sp = await searchParams;
  if (!isPreviewAuthorized(sp?.token)) notFound();

  const { slug: parts } = await params;
  const guide = resolveGuideFromParts(parts || []);
  if (!guide) {
    // List available drafts when visiting /internal/guides
    if (!parts || parts.length === 0) {
      const all = loadAllGuidesIncludingDrafts();
      return (
        <div className="container py-10 max-w-3xl space-y-4">
          <h1 className="text-2xl font-bold text-primary">معاينة دليل المشتري</h1>
          <p className="text-sm text-black/60">داخلي — noindex</p>
          <ul className="space-y-2 text-sm">
            {all.map((g) => (
              <li key={g.slug}>
                <a
                  className="text-primary underline"
                  href={`/internal/guides${normalizeSlug(g.slug).replace(/^\/guides/, "")}?token=${encodeURIComponent(sp?.token || "")}`}
                >
                  [{g.status}] {g.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      );
    }
    notFound();
  }

  const slugParts = normalizeSlug(guide.slug).split("/").filter(Boolean);
  const maybeCity = slugParts[1];
  const cityMeta = isKnownCitySlug(maybeCity) ? getCityById(maybeCity) : null;

  const breadcrumbs = [
    { name: "دليل المشتري", url: `${SITE.url}/guides`, path: "/guides" },
    {
      name: guide.h1 || guide.title,
      url: `${SITE.url}${normalizeSlug(guide.slug)}`,
      path: normalizeSlug(guide.slug),
    },
  ];

  void guideMetadata(guide, { preview: true });

  return (
    <>
      <GuideJsonLd
        blocks={guideJsonLdScripts(guide, { breadcrumbs, city: cityMeta })}
      />
      <GuideArticleLayout
        guide={guide}
        breadcrumbs={breadcrumbs}
        preview
      />
    </>
  );
}
