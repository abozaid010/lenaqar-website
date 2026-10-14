import { SITE } from "@/config/site";
import PrivacyPageContent from "./privacy-page-content";

export const metadata = {
  title: "سياسة الخصوصية والشروط — لينا عقار",
  description:
    "لينا عقار بتبدأ من طلب المشتري. هنا طبيعة الخدمة، العمولة، حدود المسؤولية، وخصوصية بياناتك. مشاركة الوحدة مع مشتري مناسب مش ضمان بيع.",
  openGraph: {
    title: "سياسة الخصوصية والشروط — لينا عقار",
    description:
      "لينا عقار بتبدأ من طلب المشتري. هنا طبيعة الخدمة، العمولة، حدود المسؤولية، وخصوصية بياناتك. مشاركة الوحدة مع مشتري مناسب مش ضمان بيع.",
    url: `${SITE.url}/privacy`,
    locale: "ar_EG",
    siteName: SITE.name,
    type: "website",
    images: [{ url: `${SITE.url}/images/logo.png`, width: 1200, height: 630, alt: SITE.name }],
  },
  alternates: {
    canonical: `${SITE.url}/privacy`,
  },
};

export default function PrivacyPage() {
  return <PrivacyPageContent />;
}
