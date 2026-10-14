import { SITE } from "@/config/site";
import SellPageContent from "./sell-page-content";

export const metadata = {
  title: "شارك وحدتك مع طلبات شراء حقيقية",
  description:
    "ابعت تفاصيل وحدتك كاملة. بنراجعها، وبعد المراجعة بنشاركها مع مشترين كتبوا طلبهم فعلاً، وبياناتهم بتفضل خاصة. المطابقة فرصة للتواصل، مش ضمان بيع.",
  openGraph: {
    title: "شارك وحدتك مع طلبات شراء حقيقية | لينا عقار",
    description:
      "ابعت تفاصيل وحدتك كاملة. بنراجعها، وبعد المراجعة بنشاركها مع مشترين كتبوا طلبهم فعلاً، وبياناتهم بتفضل خاصة. المطابقة فرصة للتواصل، مش ضمان بيع.",
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
