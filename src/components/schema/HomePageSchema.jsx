export default function HomePageSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "LENAAI Real Estate CRM",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EGP",
    },
    description:
      "AI-powered CRM system for real estate professionals with WhatsApp automation and AI sales agents.",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "256",
    },
    featureList:
      "AI sales agent, WhatsApp automation, client management, real estate listing management",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
