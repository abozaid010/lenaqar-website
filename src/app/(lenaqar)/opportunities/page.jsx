import { notFound } from "next/navigation";
import { SITE } from "@/config/site";
import {
  fetchOpportunityCatalog,
  fetchOpportunities,
  parseOpportunitySearchParams,
} from "@/lib/lenaqar/opportunities.server";
import OpportunitiesPageContent from "./opportunities-page-content";

export const revalidate = 900;
export const maxDuration = 20;

const TITLE = "شقق ووحدات ريسيل للبيع بالتقسيط في مصر";
const DESCRIPTION =
  "شقق وشاليهات ووحدات ريسيل للبيع بالتقسيط في مصر — تشتريها بالكاش اللي معاك وتكمّل الأقساط على المطور. السعر من المطور بتاريخه، مش تقدير.";

/** 1-based page number from `?page=`; anything else is page 1. */
function parsePage(value) {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(n) && n > 1 ? n : 1;
}

/**
 * Shared by generateMetadata and the page so the canonical can never disagree
 * with what renders. The catalogue fetch is React-cached, so calling this twice
 * in one request costs one upstream call.
 *
 * A page number past the end 404s rather than clamping: clamping would serve the
 * last page under unlimited distinct URLs, each self-canonical.
 */
async function resolvePage(params) {
  const filters = parseOpportunitySearchParams(params);
  const units = await fetchOpportunities(filters);
  const totalPages = Math.max(1, Math.ceil(units.length / SITE.pageSize));
  const page = parsePage(params?.page);
  if (page > totalPages) notFound();
  return { filters, units, page, totalPages };
}

/**
 * Canonical carries `page` and nothing else. Filter combinations
 * (city, cash, delivery, ...) all fold back to the clean listing URL so facets
 * cannot spawn duplicate indexable variants, but each pagination page stays
 * self-canonical — otherwise pages 2+ get dropped and the units only reachable
 * from them stop being crawlable.
 */
export async function generateMetadata({ searchParams }) {
  const params = await searchParams;
  const { page } = await resolvePage(params);
  const url =
    page > 1 ? `${SITE.url}/opportunities?page=${page}` : `${SITE.url}/opportunities`;
  const title = page > 1 ? `${TITLE} — صفحة ${page}` : TITLE;

  return {
    title,
    description: DESCRIPTION,
    openGraph: {
      title: `${title} | لينا عقار`,
      description: DESCRIPTION,
      url,
      locale: "ar_EG",
      siteName: SITE.name,
      type: "website",
      images: [
        { url: `${SITE.url}/images/logo.png`, width: 1200, height: 630, alt: SITE.name },
      ],
    },
    alternates: { canonical: url },
  };
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) =>
    String(a).localeCompare(String(b), "ar")
  );
}

export default async function OpportunitiesPage({ searchParams }) {
  const params = await searchParams;
  const { filters, units, page, totalPages } = await resolvePage(params);
  const hasActiveFilters = Object.values(filters).some(Boolean);

  const catalog = await fetchOpportunityCatalog(filters);
  const years = uniqueSorted(
    catalog.map((unit) => unit.deliveryYear).filter((year) => year != null)
  ).map(String);

  // Paginate the rendered document only — the whole filtered set is already in
  // memory, and every unit stays reachable through a crawlable ?page= link.
  const start = (page - 1) * SITE.pageSize;

  return (
    <OpportunitiesPageContent
      units={units.slice(start, start + SITE.pageSize)}
      total={units.length}
      page={page}
      totalPages={totalPages}
      years={years}
      hasActiveFilters={hasActiveFilters}
      cash={filters.maxCash}
    />
  );
}
