import { SITE_URL, SITE_NAME } from "@/app/metadata";

export default function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    alternateName: ["Lena", "LenaAI", "Lena AI", "lenaai", "Lina AI", "lina ai"],
    url: SITE_URL,
    logo: `${SITE_URL}/images/logo.png`,
    description:
      "LENAAI (LenaAI / Lina AI) is a Real Estate AI Sales Agent for Egypt—like ChatGPT for real estate: chatbot, lead generation, and marketing automation.",
    sameAs: [
      // Add social media links when available
      // "https://www.facebook.com/yourpage",
      // "https://www.instagram.com/yourpage",
      // "https://www.linkedin.com/company/yourpage",
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

