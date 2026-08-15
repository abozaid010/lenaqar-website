import { SITE_URL, SITE_NAME } from "@/app/metadata";
import { LENAQAR_CONTACT } from "@/config/lenaqar-contact";

export default function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    alternateName: ["لينا عقار", "LenaQar", "LenAqar"],
    url: SITE_URL,
    logo: `${SITE_URL}/images/logo.png`,
    description:
      "لينا عقار بتخرجك من أقساط الوحدة أسرع وبفلوس أكتر، باتفاق مكتوب.",
    sameAs: [LENAQAR_CONTACT.facebook, LENAQAR_CONTACT.linkedin].filter(Boolean),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
