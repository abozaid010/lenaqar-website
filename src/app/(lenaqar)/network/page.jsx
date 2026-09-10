import { SITE } from "@/config/site";
import BreadcrumbSchema from "@/components/schema/BreadcrumbSchema";
import NetworkLanding from "@/components/lenaqar/network-landing";

export const metadata = {
  title: "شبكة لينا — تعاون مع وسطاء تانيين وزوّد مخزونك",
  description:
    "شبكة تعاون للوسطاء العقاريين: لو عندك مشتري دور على وحدة مناسبة، ولو عندك وحدة شاركها مع الشبكة. بيانات البائع تفضل خاصة.",
  openGraph: {
    title: "شبكة لينا | لينا عقار",
    description:
      "اشتغل مع وسطاء تانيين. زوّد مخزونك. خدمة مشترين أكتر — من غير ما تشارك بيانات البائع الخاصة.",
    url: `${SITE.url}/network`,
    locale: "ar_EG",
    siteName: SITE.name,
    type: "website",
    images: [{ url: `${SITE.url}/images/logo.png`, width: 1200, height: 630, alt: SITE.name }],
  },
  alternates: {
    canonical: `${SITE.url}/network`,
  },
};

export default function NetworkPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[{ name: "شبكة لينا", url: `${SITE.url}/network` }]}
      />
      <NetworkLanding />
    </>
  );
}
