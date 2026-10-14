import { SITE } from "@/config/site";
import PrivacyPageContent from "./privacy-page-content";

export const metadata = {
  title: "سياسة الخصوصية والشروط — لينا عقار",
  description:
    "لينا عقار بتبدأ من طلب المشتري. هنا طبيعة الخدمة، العمولة، حدود المسؤولية، خصوصية بياناتك، وخطة الخروج خلال 45 يوم للوحدات اللي الفريق بيعتمدها بس.",
  openGraph: {
    title: "سياسة الخصوصية والشروط — لينا عقار",
    description:
      "لينا عقار بتبدأ من طلب المشتري. هنا طبيعة الخدمة، العمولة، حدود المسؤولية، خصوصية بياناتك، وخطة الخروج خلال 45 يوم للوحدات اللي الفريق بيعتمدها بس.",
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
