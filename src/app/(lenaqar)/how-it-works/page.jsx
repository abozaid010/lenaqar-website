import { SITE } from "@/config/site";
import BreadcrumbSchema from "@/components/schema/BreadcrumbSchema";
import FaqSchema from "@/components/schema/FaqSchema";
import HowItWorksContent from "@/components/lenaqar/how-it-works-content";

export const metadata = {
  title: "إزاي بنشتغل — اكتب طلبك، شوف الفرص، أو شارك وحدة",
  description:
    "بنبدأ من طلب المشتري. لما تتبعت وحدة مناسبة، بنراجع تفاصيلها وبعدين نشاركها معاك — وإنت تقرر تكمل ولا لأ. من غير وعود ببيع مضمون.",
  openGraph: {
    title: "إزاي بنشتغل | لينا عقار",
    description:
      "بنبدأ من طلب المشتري. لما تتبعت وحدة مناسبة، بنراجع تفاصيلها وبعدين نشاركها معاك — وإنت تقرر تكمل ولا لأ.",
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
