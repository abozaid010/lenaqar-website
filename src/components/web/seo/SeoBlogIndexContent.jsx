"use client";

import { SEO_BLOG_POST_KEYS } from "@/content/seo";
import { useI18n } from "@/hooks/useI18n";
import Link from "next/link";

export default function SeoBlogIndexContent() {
  const { translate } = useI18n();

  return (
    <div className="container max-w-3xl py-12 md:py-16">
      <h1 className="text-2xl font-bold text-slate-900 md:text-4xl">
        {translate("seo.blog.index.title")}
      </h1>
      <p className="mt-4 text-base text-slate-600">
        {translate("seo.blog.index.subtitle")}
      </p>

      <ul className="mt-10 space-y-6">
        {SEO_BLOG_POST_KEYS.map((postKey) => {
          const slug = translate(`seo.blog.posts.${postKey}.slug`);
          return (
            <li
              key={postKey}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h2 className="text-lg font-semibold text-slate-900">
                <Link
                  href={`/blog/${slug}`}
                  className="hover:text-primary transition-colors"
                >
                  {translate(`seo.blog.posts.${postKey}.title`)}
                </Link>
              </h2>
              <p className="mt-2 text-sm text-slate-600 line-clamp-2">
                {translate(`seo.blog.posts.${postKey}.painIntro`)}
              </p>
              <Link
                href={`/blog/${slug}`}
                className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
              >
                {translate("seo.blog.index.readMore")} →
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
