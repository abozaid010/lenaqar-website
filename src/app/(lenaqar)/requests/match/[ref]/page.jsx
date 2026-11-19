import { fetchRequestMatches } from "@/lib/lenaqar/request-matches.server";
import RequestMatchContent from "@/components/lenaqar/request-match-content";
import ar from "../../../../../../public/locales/ar.js";

// Matched live against the inventory on every visit: never cached.
export const dynamic = "force-dynamic";

const copy = ar.lenaqar.matchPage;

export const metadata = {
  title: copy.metaTitle,
  description: copy.metaDescription,
  // The URL carries the buyer's request reference: not for search engines, and
  // never sent to another site as a referrer.
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function RequestMatchPage({ params }) {
  const { ref } = await params;
  const result = await fetchRequestMatches(ref);
  return <RequestMatchContent result={result} />;
}
