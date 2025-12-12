import { SITE_URL, SITE_NAME } from "@/app/metadata";

export default function LocalBusinessSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: SITE_NAME,
    image: `${SITE_URL}/images/logo.png`,
    address: {
      "@type": "PostalAddress",
      addressCountry: "EG",
      addressLocality: "Cairo",
      streetAddress: "505 Siac Building, ARCHPLAN Square, New Capital",
    },
    areaServed: [
      // Primary Focus - Middle East
      {
        "@type": "Country",
        name: "Egypt",
      },
      {
        "@type": "Country",
        name: "United Arab Emirates",
      },
      {
        "@type": "Country",
        name: "Saudi Arabia",
      },
      {
        "@type": "Country",
        name: "Kuwait",
      },
      {
        "@type": "Country",
        name: "Qatar",
      },
      {
        "@type": "Country",
        name: "Bahrain",
      },
      {
        "@type": "Country",
        name: "Oman",
      },
      {
        "@type": "Country",
        name: "Jordan",
      },
      {
        "@type": "Country",
        name: "Lebanon",
      },
      // USA
      {
        "@type": "Country",
        name: "United States",
      },
      // Europe
      {
        "@type": "Country",
        name: "United Kingdom",
      },
      {
        "@type": "Country",
        name: "Germany",
      },
      {
        "@type": "Country",
        name: "France",
      },
      {
        "@type": "Country",
        name: "Italy",
      },
      {
        "@type": "Country",
        name: "Spain",
      },
      {
        "@type": "Country",
        name: "Netherlands",
      },
      {
        "@type": "Country",
        name: "Belgium",
      },
      {
        "@type": "Country",
        name: "Switzerland",
      },
      {
        "@type": "Country",
        name: "Austria",
      },
      {
        "@type": "Country",
        name: "Sweden",
      },
      {
        "@type": "Country",
        name: "Norway",
      },
      {
        "@type": "Country",
        name: "Denmark",
      },
    ],
    url: SITE_URL,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

