import { SITE } from "@/config/site";
import BreadcrumbSchema from "@/components/schema/BreadcrumbSchema";
import FaqSchema from "@/components/schema/FaqSchema";
import HowItWorksContent from "@/components/lenaqar/how-it-works-content";

export const metadata = {
  title: "إزاي بنشتغل — اكتب طلبك، شوف الفرص، أو شارك وحدة",
  description:
    "بنبدأ من طلب المشتري: اكتب مواصفات بيتك، شوف الفرص المعروضة، أو شارك وحدة تناسب طلب حقيقي. خطوات واضحة من غير وعود مبالغ فيها.",
  openGraph: {
    title: "إزاي بنشتغل | لينا عقار",
    description:
      "بنبدأ من طلب المشتري: اكتب مواصفات بيتك، شوف الفرص المعروضة، أو شارك وحدة تناسب طلب حقيقي.",
    url: `${SITE.url}/how-it-works`,
    locale: "ar_EG",
    siteName: SITE.name,
    type: "website",
    images: [{ url: `${SITE.url}/images/logo.png`, width: 1200, height: 630, alt: SITE.name }],
  },
  alternates: {
    canonical: `${SITE.url}/how-it-works`,
  },
};

export default function HowItWorksPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[{ name: "إزاي بنشتغل", url: `${SITE.url}/how-it-works` }]}
      />
      <FaqSchema />
      <HowItWorksContent />
    </>
  );
}
