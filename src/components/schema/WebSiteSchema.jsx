import { SITE_URL, SITE_NAME } from "@/app/metadata";

export default function WebSiteSchema() {
  // No sitewide free-text search exists: /opportunities filters on named params
  // (area, cash, delivery, project, bedrooms...) and ignores `q`. A SearchAction
  // is only declared once there is a query endpoint that actually answers it.
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    url: SITE_URL,
    name: SITE_NAME,
    inLanguage: "ar-EG",
    publisher: { "@id": `${SITE_URL}/#organization` },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
