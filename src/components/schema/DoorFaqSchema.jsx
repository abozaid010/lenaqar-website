/** FAQPage JSON-LD for door landings — must match visible FAQ on the page. */
export default function DoorFaqSchema({ items = [] }) {
  const valid = items.filter((item) => item?.q && item?.a);
  if (valid.length === 0) return null;

  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: valid.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
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
