import { SITE } from "@/config/site";
import CalculatorPageContent from "./calculator-page-content";

export const metadata = {
  title: "احسب خروجك | لينا عقار — مقارنة إلغاء العقد مع البيع",
  description:
    "أدخل سعر الوحدة واللي دفعته، وشوف مقارنة توضيحية بين إلغاء العقد مع المطور والبيع من خلالنا. النتيجة مش عرض سعر.",
  openGraph: {
    title: "احسب خروجك | لينا عقار — مقارنة إلغاء العقد مع البيع",
    description:
      "أدخل سعر الوحدة واللي دفعته، وشوف مقارنة توضيحية بين إلغاء العقد مع المطور والبيع من خلالنا. النتيجة مش عرض سعر.",
    url: `${SITE.url}/calculator`,
    locale: "ar_EG",
    siteName: SITE.name,
    type: "website",
    images: [{ url: `${SITE.url}/images/logo.png`, width: 1200, height: 630, alt: SITE.name }],
  },
  alternates: {
    canonical: `${SITE.url}/calculator`,
  },
};

export default function CalculatorPage() {
  return <CalculatorPageContent />;
}
