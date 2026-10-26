import { SITE_URL, SITE_NAME } from "@/app/metadata";
import { LENAQAR_CONTACT } from "@/config/lenaqar-contact";

export default function OrganizationSchema() {
  const sameAs = [
    LENAQAR_CONTACT.facebook,
    LENAQAR_CONTACT.instagram,
    LENAQAR_CONTACT.tiktok,
    LENAQAR_CONTACT.linkedin,
  ].filter(Boolean);

  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    alternateName: ["لينا عقار", "Lenaqar", "LenaQar", "LenAqar"],
    url: SITE_URL,
    logo: `${SITE_URL}/images/logo.png`,
    description:
      "منصة عقارية في مصر بتبدأ من طلب المشتري: اكتب مواصفات بيتك وميزانيتك، وهنساعدك تلاقي اختيارات مناسبة لطلبك. واتساب فقط — مش هنتصل إلا لو طلبت.",
    address: {
      "@type": "PostalAddress",
      streetAddress: LENAQAR_CONTACT.address,
      addressLocality: LENAQAR_CONTACT.city,
      addressCountry: LENAQAR_CONTACT.country,
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      telephone: LENAQAR_CONTACT.whatsappE164,
      availableLanguage: ["ar", "ar-EG"],
      areaServed: "EG",
    },
    sameAs,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
