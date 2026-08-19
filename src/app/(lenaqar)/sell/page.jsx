import { SITE } from "@/config/site";
import SellPageContent from "./sell-page-content";

export const metadata = {
  title: "تنازل عن وحدتك أو بيعها لو مش قادر تكمّل الأقساط",
  description:
    "عايز تتنازل عن وحدتك أو تبيعها قبل ما تلغي التعاقد مع المطور؟ بنعرضها على مشترين جاهزين ونتفق على السعر باتفاق مكتوب. الشروط ظاهرة هنا، مش ورا لينك.",
  openGraph: {
    title: "تنازل عن وحدتك أو بيعها لو مش قادر تكمّل الأقساط | لينا عقار",
    description:
      "عايز تتنازل عن وحدتك أو تبيعها قبل ما تلغي التعاقد مع المطور؟ بنعرضها على مشترين جاهزين ونتفق على السعر باتفاق مكتوب. الشروط ظاهرة هنا، مش ورا لينك.",
    url: `${SITE.url}/sell`,
    locale: "ar_EG",
    siteName: SITE.name,
    type: "website",
    images: [{ url: `${SITE.url}/images/logo.png`, width: 1200, height: 630, alt: SITE.name }],
  },
  alternates: {
    canonical: `${SITE.url}/sell`,
  },
};

export default function SellPage() {
  return <SellPageContent />;
}
