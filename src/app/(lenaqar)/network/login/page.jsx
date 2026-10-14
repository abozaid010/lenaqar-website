import { SITE } from "@/config/site";
import NetworkAuthShell from "@/components/lenaqar/network-auth-shell";
import NetworkLoginForm from "@/components/lenaqar/network-login-form";

export const metadata = {
  title: "دخول شبكة لينا",
  description:
    "ادخل على حساب الوسيط في شبكة لينا بعد ما الفريق يفعّل الحساب، عشان تشارك الوحدات وتتعاون مع وسطاء تانيين.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "دخول شبكة لينا | لينا عقار",
    url: `${SITE.url}/network/login`,
    locale: "ar_EG",
    siteName: SITE.name,
    type: "website",
    images: [{ url: `${SITE.url}/images/logo.png`, width: 1200, height: 630, alt: SITE.name }],
  },
  alternates: {
    canonical: `${SITE.url}/network/login`,
  },
};

export default function NetworkLoginPage() {
  return (
    <NetworkAuthShell
      titleKey="lenaqar.network.login.title"
      introKey="lenaqar.network.login.intro"
    >
      <NetworkLoginForm />
    </NetworkAuthShell>
  );
}
