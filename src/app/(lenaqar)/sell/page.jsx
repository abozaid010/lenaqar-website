import { SITE } from "@/config/site";
import SellPageContent from "./sell-page-content";

export const metadata = {
  title: { absolute: "بيع وحدتك من غير طلبات وهمية | لينا عقار" },
  description:
    "بيع وحدتك من غير مكالمات كتير ومن غير طلبات وهمية — عندنا طلبات شراء حقيقية لايف. بنراجع وحدتك ونطابقها، وبيانات المشتري بتفضل خاصة.",
  openGraph: {
    title: "بيع وحدتك من غير طلبات وهمية | لينا عقار",
    description:
      "بيع وحدتك من غير مكالمات كتير ومن غير طلبات وهمية — عندنا طلبات شراء حقيقية لايف. بنراجع وحدتك ونطابقها، وبيانات المشتري بتفضل خاصة.",
    url: `${SITE.url}/sell`,
    locale: "ar_EG",
    siteName: SITE.name,
    type: "website",
    images: [{ url: `${SITE.url}/images/default_logo.jpg`, width: 1200, height: 630, alt: SITE.name }],
  },
  alternates: {
    canonical: `${SITE.url}/sell`,
  },
};

export default function SellPage() {
  return <SellPageContent />;
}
