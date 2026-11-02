import { SITE } from "@/config/site";
import { normalizeSlug, publicGuidePath } from "./load";
import { isPreviewOnly } from "./status";
import { isSearchIndexable } from "./seo-trust";

export function guideMetadata(guide, { preview = false } = {}) {
  if (!guide) return { title: "دليل المشتري" };
  const url = `${SITE.url}${publicGuidePath(guide.slug)}`;
  const title = guide.title;
  const description = guide.description || "";
  const previewOnly = preview || isPreviewOnly(guide);
  const noindex = previewOnly || !isSearchIndexable(guide);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      locale: "ar_EG",
      siteName: SITE.name,
      type: "article",
      images: [
        {
          url: `${SITE.url}/images/logo.png`,
          width: 1200,
          height: 630,
          alt: SITE.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      canonical: url,
      languages: {
        "ar-EG": url,
        "x-default": url,
      },
    },
    // Draft/VERIFY pages: noindex,follow (still crawlable for link equity).
    // Preview-only editorial: noindex,nofollow.
    robots: previewOnly
      ? { index: false, follow: false, nocache: true }
      : noindex
        ? { index: false, follow: true }
        : { index: true, follow: true },
  };
}
