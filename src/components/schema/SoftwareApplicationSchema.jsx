import { SITE_URL } from "@/app/metadata";

export default function SoftwareApplicationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "LENAAI - Best Tool to Sell Real Estate by AI Agent",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web, iOS, Android",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EGP",
    },
    description:
      "ChatGPT for real estate, Realestate GPT. Best tool to sell real estate by AI agent. Real estate chatbot, lead generation, marketing automation, and AI-powered CRM. Free listings.",
    url: SITE_URL,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

