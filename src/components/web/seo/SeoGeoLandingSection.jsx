"use client";

import { useI18n } from "@/hooks/useI18n";
import Link from "next/link";
import SeoDemoCta from "./SeoDemoCta";

const DIFF_KEYS = [
  "realEstate",
  "arabic",
  "mobile",
  "qualify",
  "followUp",
];

export default function SeoGeoLandingSection() {
  const { translate } = useI18n();

  return (
    <section className="bg-slate-50 py-16 md:py-20" id="seo-geo-landing">
      <div className="container max-w-5xl">
        <p className="text-sm font-medium uppercase tracking-wide text-primary">
          Egypt · UAE · MENA
        </p>
        <p className="mt-4 text-base leading-relaxed text-slate-700 md:text-lg">
          {translate("seo.landing.painIntro")}
        </p>
        <h2 className="mt-6 text-2xl font-bold text-slate-900 md:text-3xl">
          {translate("seo.landing.headline")}
        </h2>
        <p className="mt-4 text-base leading-relaxed text-slate-600 md:text-lg">
          {translate("seo.landing.subheadline")}
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {DIFF_KEYS.map((key) => (
            <article
              key={key}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <h3 className="text-base font-semibold text-slate-900">
                {translate(`seo.landing.differentiators.${key}.title`)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {translate(`seo.landing.differentiators.${key}.body`)}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-10 rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-slate-900">
            {translate("seo.landing.proofTitle")}
          </h3>
          <ul className="mt-4 space-y-3 text-sm text-slate-700 md:text-base">
            <li className="flex gap-2">
              <span className="font-semibold text-primary">40%</span>
              <span>{translate("seo.landing.proofItems.conversions")}</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-primary">80%</span>
              <span>{translate("seo.landing.proofItems.manualWork")}</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-primary">26%</span>
              <span>{translate("seo.landing.proofItems.sales")}</span>
            </li>
          </ul>
        </div>

        {["0", "1", "2"].map((i) => (
          <p
            key={i}
            className="mt-6 text-sm leading-relaxed text-slate-600 md:text-base"
          >
            {translate(`seo.landing.bodyParagraphs.${i}`)}
          </p>
        ))}

        <p className="mt-6 text-sm font-medium text-slate-500">
          {translate("seo.landing.geoLine")}
        </p>

        <div className="mt-8 flex flex-wrap gap-4 text-sm">
          <Link
            href="/blog"
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            {translate("seo.blog.index.title")}
          </Link>
          <Link
            href="/faq"
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            {translate("seo.faq.title")}
          </Link>
        </div>

        <SeoDemoCta
          className="mt-10"
          titleKey="seo.landing.ctaTitle"
          subtextKey="seo.landing.ctaSubtext"
        />
      </div>
    </section>
  );
}
