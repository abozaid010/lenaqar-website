import { SITE } from "@/config/site";
import NetworkAuthShell from "@/components/lenaqar/network-auth-shell";
import NetworkSignupForm from "@/components/lenaqar/network-signup-form";

export const metadata = {
  title: "انضم لشبكة لينا — تسجيل وسيط عقاري",
  description:
    "أنشئ حساب شركة أو وسيط على شبكة لينا عشان تشارك مخزونك وتتعاون مع وسطاء تانيين.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "انضم لشبكة لينا | لينا عقار",
    url: `${SITE.url}/network/signup`,
    locale: "ar_EG",
    siteName: SITE.name,
    type: "website",
    images: [{ url: `${SITE.url}/images/logo.png`, width: 1200, height: 630, alt: SITE.name }],
  },
  alternates: {
    canonical: `${SITE.url}/network/signup`,
  },
};

export default function NetworkSignupPage() {
  return (
    <NetworkAuthShell
      titleKey="lenaqar.network.signup.title"
      introKey="lenaqar.network.signup.intro"
    >
      <NetworkSignupForm />
    </NetworkAuthShell>
  );
}
