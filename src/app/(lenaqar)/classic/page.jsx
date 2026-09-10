import { SITE } from "@/config/site";
import { fetchOpportunities } from "@/lib/lenaqar/opportunities.server";
import HomeContent from "@/components/lenaqar/home-content";

export const revalidate = 900;

export const metadata = {
  title: { absolute: "لينا عقار | النسخة السابقة من الصفحة الرئيسية" },
  description:
    "النسخة السابقة من الصفحة الرئيسية — وحدات ريسيل وفرص من المطور.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "لينا عقار | النسخة السابقة من الصفحة الرئيسية",
    url: `${SITE.url}/classic`,
    locale: "ar_EG",
    siteName: SITE.name,
    type: "website",
  },
  alternates: {
    canonical: `${SITE.url}/classic`,
  },
};

/**
 * Preserved previous homepage (unit listings marketing). Kept for restore/reuse.
 * Default `/` is now the requirements marketplace.
 */
export default async function ClassicLenaqarHomePage() {
  let units = [];
  try {
    units = await fetchOpportunities();
  } catch {
    units = [];
  }
  return <HomeContent units={units} />;
}
