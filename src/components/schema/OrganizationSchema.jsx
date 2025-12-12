import { SITE_URL, SITE_NAME } from "@/app/metadata";

export default function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/images/logo.png`,
    description:
      "LENAAI - ChatGPT for real estate, Realestate GPT. Best tool to sell real estate by AI agent. Real estate chatbot, lead generation, marketing automation, and AI-powered CRM. Free listings.",
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

