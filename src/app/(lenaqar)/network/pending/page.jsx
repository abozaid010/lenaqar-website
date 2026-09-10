import { SITE } from "@/config/site";
import NetworkPending from "@/components/lenaqar/network-pending";

export const metadata = {
  title: "طلب شبكة لينا قيد المراجعة",
  description: "تم استلام طلب الانضمام لشبكة لينا. كلّم واتساب لتفعيل الحساب.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "طلب شبكة لينا قيد المراجعة | لينا عقار",
    url: `${SITE.url}/network/pending`,
    locale: "ar_EG",
    siteName: SITE.name,
    type: "website",
    images: [{ url: `${SITE.url}/images/logo.png`, width: 1200, height: 630, alt: SITE.name }],
  },
  alternates: {
    canonical: `${SITE.url}/network/pending`,
  },
};

export default function NetworkPendingPage() {
  return <NetworkPending />;
}
