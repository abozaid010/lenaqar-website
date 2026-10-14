import { SITE } from "@/config/site";
import { getBuyerLanding, filterRequirementsForLanding } from "@/lib/lenaqar/buyer-landings";
import { fetchPublicRequirements } from "@/lib/lenaqar/requirements.server";
import BuyerLandingContent from "@/components/lenaqar/buyer-landing-content";
import BreadcrumbSchema from "@/components/schema/BreadcrumbSchema";

export const revalidate = 300;

const landing = getBuyerLanding("ready-to-move-properties");

export const metadata = {
  title: "شقق ووحدات استلام فوري / جاهزة للسكن في مصر",
  description:
    "بتدور على وحدة جاهزة للسكن أو استلام فوري؟ اكتب طلبك بالمكان والميزانية. لينا عقار تساعدك تلاقي اختيارات مناسبة لطلبك من غير وعود غير مدعومة.",
  openGraph: {
    title: "شقق ووحدات استلام فوري / جاهزة للسكن في مصر",
    description:
      "بتدور على وحدة جاهزة للسكن أو استلام فوري؟ اكتب طلبك بالمكان والميزانية. لينا عقار تساعدك تلاقي اختيارات مناسبة لطلبك من غير وعود غير مدعومة.",
    url: `${SITE.url}${landing.href}`,
    locale: "ar_EG",
    siteName: SITE.name,
    type: "website",
    images: [{ url: `${SITE.url}/images/logo.png`, width: 1200, height: 630, alt: SITE.name }],
  },
  alternates: { canonical: `${SITE.url}${landing.href}` },
};

export default async function BuyerLandingPage() {
  const { requirements } = await fetchPublicRequirements({ limit: 48 });
  const matched = filterRequirementsForLanding(requirements, landing).slice(0, 12);

  return (
    <>
      <BreadcrumbSchema
        items={[{ name: "وحدات استلام فوري وجاهزة للسكن — ابدأ بطلبك", url: `${SITE.url}${landing.href}` }]}
      />
      <BuyerLandingContent landing={landing} matchedRequirements={matched} />
    </>
  );
}
