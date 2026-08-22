"use client";

import { useI18n } from "@/hooks/useI18n";
import { FAQ_IDS, faqAnswerKey, faqQuestionKey } from "@/lib/lenaqar/faq";

/**
 * Visible counterpart to `FaqSchema` — same entries, same order.
 *
 * Plain headings and paragraphs rather than <details>: answer engines and
 * crawlers read the text either way, but collapsed content is weaker for both,
 * and there are only five entries.
 */
export default function FaqSection() {
  const { translate } = useI18n();

  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-bold text-primary">
        {translate("lenaqar.faq.title")}
      </h2>
      <dl className="space-y-4">
        {FAQ_IDS.map((id) => (
          <div
            key={id}
            className="rounded-lg border border-black/10 p-5 bg-white"
          >
            <dt className="font-semibold mb-2">
              {translate(faqQuestionKey(id))}
            </dt>
            <dd className="text-sm text-black/70 leading-relaxed">
              {translate(faqAnswerKey(id))}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
