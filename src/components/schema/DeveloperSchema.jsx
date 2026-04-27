import { SITE_URL } from "@/app/metadata";

export default function DeveloperSchema({ developer }) {
  if (!developer) return null;

  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: developer.name || t?.schema?.developer || "Developer",
    url: `${SITE_URL}/developers/${developer.id}`,
    logo: developer.logo || `${SITE_URL}/images/logo.png`,
    description: developer.description || t?.schema?.realEstateDeveloper || "Real estate developer",
    brand: {
      "@type": "Brand",
      name: developer.name || t?.schema?.developer || "Developer",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

