import { SITE } from "@/config/site";
import CalculatorPageContent from "./calculator-page-content";

export const metadata = {
  title: "مقارنة توضيحية بين إلغاء التعاقد والبيع",
  description:
    "أداة توضيحية بس: اكتب سعر الوحدة واللي دفعته وشوف فرق تقريبي. النتيجة مش عرض سعر، ومش وعد إن البيع هيتم من خلال لينا عقار.",
  openGraph: {
    title: "مقارنة توضيحية بين إلغاء التعاقد والبيع | لينا عقار",
    description:
      "أداة توضيحية بس: اكتب سعر الوحدة واللي دفعته وشوف فرق تقريبي. النتيجة مش عرض سعر، ومش وعد إن البيع هيتم من خلال لينا عقار.",
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
