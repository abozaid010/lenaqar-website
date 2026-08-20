import { SITE } from "@/config/site";
import BreadcrumbSchema from "@/components/schema/BreadcrumbSchema";
import FaqSchema from "@/components/schema/FaqSchema";
import HowItWorksContent from "@/components/lenaqar/how-it-works-content";

export const metadata = {
  title: "إزاي بنشتغل — بيع، شراء، أو قولنا عايز إيه",
  description:
    "خطوة بخطوة: إزاي تبيع وحدتك، إزاي تشتري فرصة جاهزة، وإزاي تبعت طلب شراء ونرشّح لك المناسب.",
  openGraph: {
    title: "إزاي بنشتغل | لينا عقار",
    description:
      "خطوة بخطوة: إزاي تبيع وحدتك، إزاي تشتري فرصة جاهزة، وإزاي تبعت طلب شراء ونرشّح لك المناسب.",
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
        items={[{ name: "كيف نعمل", url: `${SITE.url}/how-it-works` }]}
      />
      <FaqSchema />
      <HowItWorksContent />
    </>
  );
}
