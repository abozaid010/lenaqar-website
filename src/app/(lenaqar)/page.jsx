import { SITE } from "@/config/site";
import { fetchPublicRequirements } from "@/lib/lenaqar/requirements.server";
import MarketplaceHomeContent from "@/components/lenaqar/marketplace-home-content";
import FaqSchema from "@/components/schema/FaqSchema";

export const revalidate = 300;

export const metadata = {
  title: {
    absolute:
      "لينا عقار | دور على بيتك المناسب في مصر حسب طلبك وميزانيتك",
  },
  description:
    "بتدور على شقة أو فيلا أو شاليه في مصر؟ اكتب طلبك وحدد ميزانيتك والمكان والمواصفات اللي محتاجها. ابدأ بطلب واضح، وشوف اختيارات تناسب احتياجاتك وميزانيتك.",
  openGraph: {
    title: "لينا عقار | دور على بيتك المناسب في مصر حسب طلبك وميزانيتك",
    description:
      "بتدور على شقة أو فيلا أو شاليه في مصر؟ اكتب طلبك وحدد ميزانيتك والمكان والمواصفات اللي محتاجها. ابدأ بطلب واضح، وشوف اختيارات تناسب احتياجاتك وميزانيتك.",
    url: SITE.url,
    locale: "ar_EG",
    siteName: SITE.name,
    type: "website",
    images: [{ url: `${SITE.url}/images/logo.png`, width: 1200, height: 630, alt: SITE.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: "لينا عقار | دور على بيتك المناسب في مصر حسب طلبك وميزانيتك",
    description:
      "بتدور على شقة أو فيلا أو شاليه في مصر؟ اكتب طلبك وحدد ميزانيتك والمكان والمواصفات اللي محتاجها. ابدأ بطلب واضح، وشوف اختيارات تناسب احتياجاتك وميزانيتك.",
    images: [`${SITE.url}/images/logo.png`],
  },
  alternates: {
    canonical: SITE.url,
  },
};

export default async function LenaqarHomePage() {
  const { requirements, error } = await fetchPublicRequirements({ limit: 48 });
  return (
    <>
      <FaqSchema />
      <MarketplaceHomeContent requirements={requirements} error={error} />
    </>
  );
}
