import { SITE } from "@/config/site";
import PrivacyPageContent from "./privacy-page-content";

export const metadata = {
  title: "سياسة الخصوصية والشروط والأحكام",
  description:
    "شروط الخدمة على لينا عقار: طبيعة الوساطة، العمولة، حدود المسؤولية، التعامل مع الملّاك فقط، وخطة الخروج خلال 45 يوم للوحدات المعتمدة من الفريق.",
  openGraph: {
    title: "سياسة الخصوصية والشروط والأحكام | لينا عقار",
    description:
      "شروط الخدمة على لينا عقار: طبيعة الوساطة، العمولة، حدود المسؤولية، التعامل مع الملّاك فقط، وخطة الخروج خلال 45 يوم للوحدات المعتمدة من الفريق.",
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
