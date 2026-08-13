import { SITE } from "@/config/site";
import {
  fetchOpportunityCatalog,
  fetchOpportunities,
  parseOpportunitySearchParams,
} from "@/lib/lenaqar/opportunities.server";
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
  const params = await searchParams;
  const filters = parseOpportunitySearchParams(params);
  const hasActiveFilters = Object.values(filters).some(Boolean);

  const catalog = await fetchOpportunityCatalog(filters);
  const units = await fetchOpportunities(filters);

  const years = uniqueSorted(
    catalog.map((unit) => unit.deliveryYear).filter((year) => year != null)
  ).map(String);

  return (
    <OpportunitiesPageContent
      units={units}
      years={years}
      hasActiveFilters={hasActiveFilters}
      cash={filters.maxCash}
    />
  );
}
