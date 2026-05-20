"use client";

import { useI18n } from "@/hooks/useI18n";
import Link from "next/link";
import SeoDemoCta from "./SeoDemoCta";

const SECTION_INDICES = [0, 1, 2, 3];

export default function SeoBlogArticle({ postKey }) {
  const { translate } = useI18n();
  const base = `seo.blog.posts.${postKey}`;

  return (
    <article className="container max-w-3xl py-12 md:py-16">
      <Link
        href="/blog"
        className="text-sm font-medium text-primary hover:underline"
      >
        ← {translate("seo.blog.index.title")}
      </Link>

      <p className="mt-8 text-base leading-relaxed text-slate-700 md:text-lg">
        {translate(`${base}.painIntro`)}
      </p>

      <h1 className="mt-6 text-2xl font-bold text-slate-900 md:text-4xl">
        {translate(`${base}.title`)}
      </h1>

      {SECTION_INDICES.map((i) => (
        <section key={i} className="mt-10">
          <h2 className="text-xl font-semibold text-slate-900 md:text-2xl">
            {translate(`${base}.sections.${i}.heading`)}
          </h2>
          {[0, 1].map((p) => (
            <p
              key={p}
              className="mt-4 text-sm leading-relaxed text-slate-600 md:text-base"
            >
              {translate(`${base}.sections.${i}.paragraphs.${p}`)}
            </p>
          ))}
        </section>
      ))}

      <SeoDemoCta
        className="mt-12"
        titleKey={`${base}.ctaTitle`}
        buttonKey={`${base}.ctaButton`}
      />
    </article>
  );
}
