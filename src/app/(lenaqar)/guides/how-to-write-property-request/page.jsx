import { SITE } from "@/config/site";
import { getBuyerGuide } from "@/lib/lenaqar/buyer-guides";
import BuyerGuideContent from "@/components/lenaqar/buyer-guide-content";
import BreadcrumbSchema from "@/components/schema/BreadcrumbSchema";

const guide = getBuyerGuide("how-to-write-property-request");

export const metadata = {
  title: "إزاي تكتب طلب عقاري واضح يساعدك تلاقي اختيارات أنسب؟",
  description:
    "دليل عملي لكتابة طلب شراء عقار في مصر: المكان، الميزانية، الغرف، الاستلام، والملاحظات اللي بتفَرّق — من غير وعود أو أرقام مخترعة.",
  openGraph: {
    title: "إزاي تكتب طلب عقاري واضح يساعدك تلاقي اختيارات أنسب؟",
    description:
      "دليل عملي لكتابة طلب شراء عقار في مصر: المكان، الميزانية، الغرف، الاستلام، والملاحظات اللي بتفَرّق — من غير وعود أو أرقام مخترعة.",
    url: `${SITE.url}${guide.href}`,
    locale: "ar_EG",
    siteName: SITE.name,
    type: "article",
    images: [{ url: `${SITE.url}/images/logo.png`, width: 1200, height: 630, alt: SITE.name }],
  },
  alternates: { canonical: `${SITE.url}${guide.href}` },
};

export default function BuyerGuidePage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "دليل المشتري", url: `${SITE.url}/guides` },
          { name: "إزاي تكتب طلب عقاري واضح؟", url: `${SITE.url}${guide.href}` },
        ]}
      />
      <BuyerGuideContent guide={guide} />
    </>
  );
}
