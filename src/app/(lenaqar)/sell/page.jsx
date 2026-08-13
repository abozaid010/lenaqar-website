import { SITE } from "@/config/site";
import SellPageContent from "./sell-page-content";

export const metadata = {
  title: "بيع وحدتك | لينا عقار — اتفاق مكتوب وخروج أسرع",
  description:
    "لو مش قادر تكمّل أقساط وحدتك، بنعرضها على مشترين جاهزين ونتفق معاك على السعر باتفاق مكتوب. الشروط ظاهرة هنا، مش ورا لينك.",
  openGraph: {
    title: "بيع وحدتك | لينا عقار — اتفاق مكتوب وخروج أسرع",
    description:
      "لو مش قادر تكمّل أقساط وحدتك، بنعرضها على مشترين جاهزين ونتفق معاك على السعر باتفاق مكتوب. الشروط ظاهرة هنا، مش ورا لينك.",
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
