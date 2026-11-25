import { BRAND } from "@/config/brand";
import { SITE } from "@/config/site";
import { fetchRequestMatches } from "@/lib/lenaqar/request-matches.server";
import { normalizeMatchRef } from "@/lib/lenaqar/whatsapp-intent";
import RequestMatchContent from "@/components/lenaqar/request-match-content";
import ar from "../../../../../../public/locales/ar.js";

// Matched live against the inventory on every visit: never cached.
export const dynamic = "force-dynamic";

const copy = ar.lenaqar.matchPage;

export async function generateMetadata({ params }) {
  const { ref } = await params;
  const matchRef = normalizeMatchRef(ref);
  const title = copy.metaTitle;
  const description = copy.metaDescription;
  const url = matchRef ? `${SITE.url}/requests/match/${matchRef}` : SITE.url;

  return {
    title,
    description: description,
    openGraph: {
      title,
      description,
      url,
      locale: SITE.ogLocale,
      siteName: SITE.name,
      type: "website",
      images: [{ url: `${SITE.url}${BRAND.socialImage}`, width: 1200, height: 630, alt: BRAND.socialAlt }],
    },
    twitter: {
      card: "summary_large_image",
      images: [{ url: `${SITE.url}${BRAND.socialImage}`, alt: BRAND.socialAlt }],
    },
    alternates: { canonical: url },
    // The URL carries the buyer's request reference: not for search engines, and
    // never sent to another site as a referrer.
    robots: { index: false, follow: false },
    referrer: "no-referrer",
  };
}

export default async function RequestMatchPage({ params }) {
  const { ref } = await params;
  const result = await fetchRequestMatches(ref);
  return <RequestMatchContent result={result} />;
}
