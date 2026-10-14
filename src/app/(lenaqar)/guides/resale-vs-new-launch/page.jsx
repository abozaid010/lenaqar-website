import { SITE } from "@/config/site";
import { getBuyerGuide } from "@/lib/lenaqar/buyer-guides";
import BuyerGuideContent from "@/components/lenaqar/buyer-guide-content";
import BreadcrumbSchema from "@/components/schema/BreadcrumbSchema";

const guide = getBuyerGuide("resale-vs-new-launch");

export const metadata = {
  title: "إيه الفرق بين إعادة البيع والوحدات الجديدة؟",
  description:
    "شرح بسيط للفرق بين وحدات إعادة البيع (ريسيل) والإطلاق الجديد في مصر، وإزاي تختار حسب احتياجك وميزانيتك وموعد الاستلام.",
  openGraph: {
    title: "إيه الفرق بين إعادة البيع والوحدات الجديدة؟",
    description:
      "شرح بسيط للفرق بين وحدات إعادة البيع (ريسيل) والإطلاق الجديد في مصر، وإزاي تختار حسب احتياجك وميزانيتك وموعد الاستلام.",
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
          { name: "إعادة البيع ولا وحدة جديدة؟", url: `${SITE.url}${guide.href}` },
        ]}
      />
      <BuyerGuideContent guide={guide} />
    </>
  );
}
