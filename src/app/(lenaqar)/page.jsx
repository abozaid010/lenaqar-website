import { SITE } from "@/config/site";
import { fetchPublicRequirements } from "@/lib/lenaqar/requirements.server";
import MarketplaceHomeContent from "@/components/lenaqar/marketplace-home-content";

export const revalidate = 300;

export const metadata = {
  title: { absolute: "لينا عقار | طلبات شراء حقيقية — ابعت وحدتك على واتساب" },
  description:
    "دى مش إعلانات — دول ناس فعلاً بتدور على شقق بالمواصفات دي. لو شقتك مناسبة، ابعتها على الواتساب والفريق هيراجعها ويبعتها للمشتري فوراً.",
  openGraph: {
    title: "لينا عقار | طلبات شراء حقيقية — ابعت وحدتك على واتساب",
    description:
      "دى مش إعلانات — دول ناس فعلاً بتدور على شقق بالمواصفات دي. لو شقتك مناسبة لأي عميل من دول، خش ابعتها على الواتساب.",
    url: SITE.url,
    locale: "ar_EG",
    siteName: SITE.name,
    type: "website",
    images: [{ url: `${SITE.url}/images/logo.png`, width: 1200, height: 630, alt: SITE.name }],
  },
  alternates: {
    canonical: SITE.url,
  },
};

export default async function LenaqarHomePage() {
  const { requirements, error } = await fetchPublicRequirements({ limit: 48 });
  return (
    <MarketplaceHomeContent requirements={requirements} error={error} />
  );
}
