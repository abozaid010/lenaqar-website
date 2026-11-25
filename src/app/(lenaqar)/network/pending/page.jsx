import { BRAND } from "@/config/brand";
import { SITE } from "@/config/site";
import NetworkPending from "@/components/lenaqar/network-pending";

export const metadata = {
  title: "طلب شبكة لينا لسه تحت المراجعة",
  description: "طلب الانضمام لشبكة لينا وصلنا. كلّمنا على واتساب عشان نفعّل الحساب.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "طلب شبكة لينا لسه تحت المراجعة | لينا عقار",
    url: `${SITE.url}/network/pending`,
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
    canonical: `${SITE.url}/network/pending`,
  },
};

export default function NetworkPendingPage() {
  return <NetworkPending />;
}
