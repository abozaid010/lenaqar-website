"use client";

import { useI18n } from "@/hooks/useI18n";

const SECTIONS = [
  "nature",
  "estimates",
  "commission",
  "liability",
  "owners",
  "guarantee",
  "data",
];

export default function PrivacyPageContent() {
  const { translate } = useI18n();

  return (
    <article className="container py-12 max-w-3xl">
      <h1 className="text-3xl font-bold text-primary leading-snug">
        {translate("lenaqar.privacy.title")}
      </h1>
      <p className="mt-4 text-sm text-black/60 leading-relaxed">
        {translate("lenaqar.privacy.draftNote")}
      </p>

      {SECTIONS.map((section) => (
        <section key={section} className="mt-10">
          <h2 className="text-xl font-bold text-primary mb-3">
            {translate(`lenaqar.privacy.${section}Title`)}
          </h2>
          <p className="text-black/80 leading-relaxed">
            {translate(`lenaqar.privacy.${section}Body`)}
          </p>
        </section>
      ))}

      <p className="mt-10 text-black/80 leading-relaxed">
        {translate("lenaqar.privacy.appendNote")}
      </p>
    </article>
  );
}
