import { SITE } from "@/config/site";
import BreadcrumbSchema from "@/components/schema/BreadcrumbSchema";
import FaqSchema from "@/components/schema/FaqSchema";
import HowToSchema from "@/components/schema/HowToSchema";
import HowItWorksContent from "@/components/lenaqar/how-it-works-content";
import ar from "../../../../public/locales/ar.js";

export const metadata = {
  title: "إزاي بنشتغل — شراء في ٤ خطوات وبيع لمشتري حقيقي",
  description:
    "اشتري بالـAI من غير مكالمات: اكتب طلبك، الذكاء الاصطناعي يجمع الوحدات، نكلمك في وقتك، ومحامي يراجع ورق الريسيل. للبائع: طابق وحدتك مع طلبات شراء حقيقية.",
  openGraph: {
    title: "إزاي بنشتغل | لينا عقار",
    description:
      "اشتري بالـAI من غير مكالمات: اكتب طلبك، الذكاء الاصطناعي يجمع الوحدات، نكلمك في وقتك، ومحامي يراجع ورق الريسيل.",
    url: `${SITE.url}/how-it-works`,
    locale: "ar_EG",
    siteName: SITE.name,
    type: "website",
    images: [{ url: `${SITE.url}/images/default_logo.jpg`, width: 1200, height: 630, alt: SITE.name }],
  },
  alternates: {
    canonical: `${SITE.url}/how-it-works`,
  },
};

export default function HowItWorksPage() {
  const hiw = ar?.lenaqar?.howItWorks ?? {};
  const buySteps = [1, 2, 3, 4]
    .map((n) => ({
      name: hiw[`buyStep${n}Title`],
      text: hiw[`buyStep${n}Body`],
    }))
    .filter((s) => s.name && s.text);
  const sellSteps = [1, 2, 3, 4]
    .map((n) => ({
      name: hiw[`sellerStep${n}Title`],
      text: hiw[`sellerStep${n}Body`],
    }))
    .filter((s) => s.name && s.text);

  return (
    <>
      <BreadcrumbSchema
        items={[{ name: "إزاي بنشتغل", url: `${SITE.url}/how-it-works` }]}
      />
      <FaqSchema />
      <HowToSchema
        name={hiw.buySectionTitle}
        description={hiw.pageIntro}
        steps={buySteps}
      />
      <HowToSchema
        name={hiw.sellerSectionTitle}
        description={hiw.sellerStep1Body}
        steps={sellSteps}
      />
      <HowItWorksContent />
    </>
  );
}
