import { SITE_URL } from "@/app/metadata";

export default function SoftwareApplicationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "LENAAI - Best Tool to Sell Real Estate by AI Agent",
    alternateName: ["Lena", "LenaAI", "Lena AI", "lenaai", "Lina AI", "lina ai"],
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web, iOS, Android",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EGP",
    },
    description:
      "LENAAI (LenaAI / Lina AI) is a Real Estate AI Sales Agent for Egypt—like ChatGPT for real estate: chatbot, lead generation, and marketing automation.",
    url: SITE_URL,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

