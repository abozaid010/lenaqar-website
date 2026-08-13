import { notFound } from "next/navigation";
import { SITE } from "@/config/site";
import { fetchOpportunities } from "@/lib/lenaqar/opportunities.server";
import OpportunitiesPageContent from "./opportunities-page-content";

export const revalidate = 900;

export const metadata = {
  title: "فرص الكاش | لينا عقار — وحدات بخطة سداد من المطور",
  description:
    "شوف الوحدات اللي الكاش اللي معاك يشتريها النهارده. السعر من المطور بتاريخه، ومضاعف الكاش محسوب من الأرقام الفعلية مش تقدير.",
  openGraph: {
    title: "فرص الكاش | لينا عقار — وحدات بخطة سداد من المطور",
    description:
      "شوف الوحدات اللي الكاش اللي معاك يشتريها النهارده. السعر من المطور بتاريخه، ومضاعف الكاش محسوب من الأرقام الفعلية مش تقدير.",
    url: `${SITE.url}/opportunities`,
    locale: "ar_EG",
    siteName: SITE.name,
    type: "website",
    images: [{ url: `${SITE.url}/images/logo.png`, width: 1200, height: 630, alt: SITE.name }],
  },
  alternates: {
    canonical: `${SITE.url}/opportunities`,
  },
};

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) =>
    String(a).localeCompare(String(b), "ar")
  );
}

export default async function OpportunitiesPage({ searchParams }) {
  if (!SITE.feed.enabled) notFound();

  const params = await searchParams;
  const area = typeof params?.area === "string" ? params.area : "";
  const cash = typeof params?.cash === "string" ? params.cash : "";
  const delivery = typeof params?.delivery === "string" ? params.delivery : "";

  const all = await fetchOpportunities();
  const units = await fetchOpportunities({
    area,
    maxCash: cash,
    deliveryYear: delivery,
  });

  const areas = uniqueSorted(all.flatMap((unit) => [unit.city, unit.district]));
  const years = uniqueSorted(
    all.map((unit) => unit.deliveryYear).filter((year) => year != null)
  ).map(String);

  return (
    <OpportunitiesPageContent
      units={units}
      areas={areas}
      years={years}
    />
  );
}
