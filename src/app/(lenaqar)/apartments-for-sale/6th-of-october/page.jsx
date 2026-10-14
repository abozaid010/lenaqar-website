import { SITE } from "@/config/site";
import { getBuyerLanding, filterRequirementsForLanding } from "@/lib/lenaqar/buyer-landings";
import { fetchPublicRequirements } from "@/lib/lenaqar/requirements.server";
import BuyerLandingContent from "@/components/lenaqar/buyer-landing-content";
import BreadcrumbSchema from "@/components/schema/BreadcrumbSchema";

export const revalidate = 300;

const landing = getBuyerLanding("apartments-for-sale/6th-of-october");

export const metadata = {
  title: "شقق للبيع في 6 أكتوبر — اكتب مواصفاتك وميزانيتك",
  description:
    "بتدور على شقة في 6 أكتوبر أو التوسعات؟ اكتب طلب شراء بالميزانية والغرف والاستلام. لينا عقار تساعدك تلاقي اختيارات مناسبة لطلبك.",
  openGraph: {
    title: "شقق للبيع في 6 أكتوبر — اكتب مواصفاتك وميزانيتك",
    description:
      "بتدور على شقة في 6 أكتوبر أو التوسعات؟ اكتب طلب شراء بالميزانية والغرف والاستلام. لينا عقار تساعدك تلاقي اختيارات مناسبة لطلبك.",
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
        items={[{ name: "شقق للبيع في 6 أكتوبر حسب طلبك", url: `${SITE.url}${landing.href}` }]}
      />
      <BuyerLandingContent landing={landing} matchedRequirements={matched} />
    </>
  );
}
