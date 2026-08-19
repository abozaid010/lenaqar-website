import { SITE } from "@/config/site";
import { fetchOpportunities } from "@/lib/lenaqar/opportunities.server";
import HomeContent from "@/components/lenaqar/home-content";

export const revalidate = 900;

export const metadata = {
  // `absolute` opts out of the root layout's "%s | لينا عقار" template so the
  // brand is not repeated on the one title that already leads with it.
  title: { absolute: "لينا عقار | عقارات ريسيل وتنازل عن وحدات التقسيط في مصر" },
  description:
    "وحدات ريسيل وعقود قديمة وفرص من المطور — اشتري بسعر التعاقد القديم. ولو مش قادر تكمّل أقساطك، بنعرض وحدتك على مشترين جاهزين باتفاق مكتوب.",
  openGraph: {
    title: "لينا عقار | عقارات ريسيل وتنازل عن وحدات التقسيط في مصر",
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
  let units = [];
  try {
    units = await fetchOpportunities();
  } catch {
    units = [];
  }
  return <HomeContent units={units} />;
}
