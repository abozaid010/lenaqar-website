import { SITE } from "@/config/site";
import { getBuyerLanding, filterRequirementsForLanding } from "@/lib/lenaqar/buyer-landings";
import { fetchPublicRequirements } from "@/lib/lenaqar/requirements.server";
import BuyerLandingContent from "@/components/lenaqar/buyer-landing-content";
import BreadcrumbSchema from "@/components/schema/BreadcrumbSchema";

export const revalidate = 300;

const landing = getBuyerLanding("apartments-for-sale/sheikh-zayed");

export const metadata = {
  title: "شقق للبيع في الشيخ زايد — ابدأ بطلبك العقاري",
  description:
    "عايز شقة في الشيخ زايد؟ اكتب الميزانية وعدد الغرف وموعد الاستلام. لينا عقار بتبدأ من طلبك وتساعدك تلاقي اختيارات مناسبة.",
  openGraph: {
    title: "شقق للبيع في الشيخ زايد — ابدأ بطلبك العقاري",
    description:
      "عايز شقة في الشيخ زايد؟ اكتب الميزانية وعدد الغرف وموعد الاستلام. لينا عقار بتبدأ من طلبك وتساعدك تلاقي اختيارات مناسبة.",
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
        items={[{ name: "شقق للبيع في الشيخ زايد حسب احتياجك", url: `${SITE.url}${landing.href}` }]}
      />
      <BuyerLandingContent landing={landing} matchedRequirements={matched} />
    </>
  );
}
