import { SITE_URL, SITE_NAME } from "@/app/metadata";
import { LENAQAR_CONTACT } from "@/config/lenaqar-contact";

export default function LocalBusinessSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: SITE_NAME,
    image: `${SITE_URL}/images/logo.png`,
    address: {
      "@type": "PostalAddress",
      addressCountry: LENAQAR_CONTACT.country,
      addressLocality: LENAQAR_CONTACT.city,
      streetAddress: LENAQAR_CONTACT.address,
    },
    areaServed: [
      {
        "@type": "Country",
        name: "Egypt",
      },
    ],
    telephone: LENAQAR_CONTACT.phoneE164,
    url: SITE_URL,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
