import { SITE } from "@/config/site";
import { getBuyerLanding, filterRequirementsForLanding } from "@/lib/lenaqar/buyer-landings";
import { fetchPublicRequirements } from "@/lib/lenaqar/requirements.server";
import BuyerLandingContent from "@/components/lenaqar/buyer-landing-content";
import BreadcrumbSchema from "@/components/schema/BreadcrumbSchema";

export const revalidate = 300;

const landing = getBuyerLanding("villas-for-sale/egypt");

export const metadata = {
  title: "فلل للبيع في مصر — اكتب مواصفات الفيلا اللي بتدور عليها",
  description:
    "بتدور على فيلا أو تاون هاوس؟ اكتب الميزانية والمكان وعدد الغرف. لينا عقار بتبدأ من طلبك وتساعدك تلاقي اختيارات مناسبة.",
  openGraph: {
    title: "فلل للبيع في مصر — اكتب مواصفات الفيلا اللي بتدور عليها",
    description:
      "بتدور على فيلا أو تاون هاوس؟ اكتب الميزانية والمكان وعدد الغرف. لينا عقار بتبدأ من طلبك وتساعدك تلاقي اختيارات مناسبة.",
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
        items={[{ name: "فلل وتاون هاوس للبيع حسب طلبك", url: `${SITE.url}${landing.href}` }]}
      />
      <BuyerLandingContent landing={landing} matchedRequirements={matched} />
    </>
  );
}
