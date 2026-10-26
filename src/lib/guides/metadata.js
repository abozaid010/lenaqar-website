import { SITE } from "@/config/site";
import { normalizeSlug } from "./load";
import { isPreviewOnly } from "./status";

export function guideMetadata(guide, { preview = false } = {}) {
  if (!guide) return { title: "دليل المشتري" };
  const url = `${SITE.url}${normalizeSlug(guide.slug)}`;
  const title = guide.title;
  const description = guide.description || "";
  const noindex = preview || isPreviewOnly(guide);

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
    robots: noindex
      ? { index: false, follow: false, nocache: true }
      : { index: true, follow: true },
  };
}
