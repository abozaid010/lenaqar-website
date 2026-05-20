"use client";

import { useI18n } from "@/hooks/useI18n";
import { useState } from "react";
import SeoDemoCta from "./SeoDemoCta";

const FAQ_IDS = [
  "what-is-ai-lead-generator",
  "ai-lead-generation-vs-ads",
  "ai-lead-filtration",
  "ai-agent-vs-chatbot",
  "ai-salesman",
  "ai-crm",
  "ai-ecosystem",
  "arabic-support",
  "mobile",
  "proof-points",
  "who-is-it-for",
  "geo",
  "get-started",
];

export default function SeoFaqPageContent() {
  const { translate } = useI18n();
  const [openId, setOpenId] = useState(FAQ_IDS[0]);

  return (
    <div className="container max-w-3xl py-12 md:py-16">
      <h1 className="text-2xl font-bold text-slate-900 md:text-4xl">
        {translate("seo.faq.title")}
      </h1>
      <p className="mt-4 text-base text-slate-600">
        {translate("seo.faq.subtitle")}
      </p>

      <dl className="mt-10 space-y-3">
        {FAQ_IDS.map((id, index) => {
          const isOpen = openId === id;
          return (
            <div
              key={id}
              className="rounded-xl border border-slate-200 bg-white overflow-hidden"
            >
              <dt>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-start text-sm font-semibold text-slate-900 md:text-base"
                  aria-expanded={isOpen}
                  onClick={() => setOpenId(isOpen ? null : id)}
                >
                  {translate(`seo.faq.items.${index}.question`)}
                  <span className="text-primary text-lg shrink-0">
                    {isOpen ? "−" : "+"}
                  </span>
                </button>
              </dt>
              {isOpen ? (
                <dd className="border-t border-slate-100 px-5 pb-4 pt-2 text-sm leading-relaxed text-slate-600 md:text-base">
                  {translate(`seo.faq.items.${index}.answer`)}
                </dd>
              ) : null}
            </div>
          );
        })}
      </dl>

      <SeoDemoCta
        className="mt-12"
        titleKey="seo.faq.ctaTitle"
        buttonKey="seo.faq.ctaButton"
      />
    </div>
  );
}
