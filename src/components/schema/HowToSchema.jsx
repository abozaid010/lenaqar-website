/**
 * HowTo JSON-LD — only when the same steps are visible on the page.
 */
export default function HowToSchema({ name, description, steps = [] }) {
  if (!name || steps.length === 0) return null;

  const schema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name,
    description: description || undefined,
    step: steps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.name,
      text: step.text,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
