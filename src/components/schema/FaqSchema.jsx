import { faqItemsAr } from "@/lib/lenaqar/faq";

/**
 * FAQPage JSON-LD.
 *
 * Only render this on a page that also shows the same questions and answers —
 * see `FaqSection`, which reads the same list. Markup without matching visible
 * content is a structured-data policy violation.
 */
export default function FaqSchema() {
  const items = faqItemsAr();
  if (items.length === 0) return null;

  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
