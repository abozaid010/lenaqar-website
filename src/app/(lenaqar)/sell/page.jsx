import { BRAND } from "@/config/brand";
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
    images: [{ url: `${SITE.url}${BRAND.socialImage}`, width: 1200, height: 630, alt: BRAND.socialAlt }],
  },
  twitter: {
    card: "summary_large_image",
    images: [{ url: `${SITE.url}${BRAND.socialImage}`, alt: BRAND.socialAlt }],
  },
  alternates: {
    canonical: `${SITE.url}/sell`,
  },
};

export default function SellPage() {
  return <SellPageContent />;
}
