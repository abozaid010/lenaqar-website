import { SITE } from "@/config/site";
import { fetchOpportunities } from "@/lib/lenaqar/opportunities.server";
import HomeContent from "@/components/lenaqar/home-content";

export const revalidate = 900;

export const metadata = {
  title: "لينا عقار | اخرج من وحدتك أسرع وبفلوس أكتر",
  description:
    "مش قادر تكمّل أقساطك؟ بنعرض وحدتك على مشترين جاهزين ونتفق معاك على السعر باتفاق مكتوب. من غير مضايقات، ومن غير أوفر مضاف عليك.",
  openGraph: {
    title: "لينا عقار | اخرج من وحدتك أسرع وبفلوس أكتر",
    description:
      "مش قادر تكمّل أقساطك؟ بنعرض وحدتك على مشترين جاهزين ونتفق معاك على السعر باتفاق مكتوب. من غير مضايقات، ومن غير أوفر مضاف عليك.",
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
  const units = SITE.feed.enabled ? await fetchOpportunities() : [];
  return <HomeContent units={units} />;
}
