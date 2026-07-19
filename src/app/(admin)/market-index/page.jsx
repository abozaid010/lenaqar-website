import { cookies } from "next/headers";
import { COOKIE_KEYS } from "@/constants/cookieKeys";
import { SITE_URL } from "../../metadata";
import { assertMarketIndexAccess } from "./_lib/access";
import { fetchMarketCards } from "@/lib/market-index/marketIndex.server";
import MarketIndexDashboard from "./_components/market-index-dashboard";

export async function generateMetadata() {
  const cookieStore = await cookies();
  const clientInfoCookie = cookieStore.get(COOKIE_KEYS.CLIENT_INFO)?.value;
  let clientName = null;
  try {
    clientName = clientInfoCookie ? JSON.parse(clientInfoCookie)?.client_name : null;
  } catch {
    clientName = null;
  }

  return {
    title: clientName
      ? `Market Index - ${clientName} | LENAAI AI Sales Agent`
      : "Market Index - LENAAI AI Sales Agent",
    robots: { index: false, follow: false },
    alternates: { canonical: `${SITE_URL}/market-index` },
  };
}

export default async function MarketIndexPage() {
  const { canEdit } = await assertMarketIndexAccess();
  // Always attempt the read; backend 403 → unavailable (honest frontend-only view).
  const cardsResult = await fetchMarketCards();

  const unavailable = Boolean(cardsResult?.unavailable);
  const initialCards = unavailable
    ? null
    : cardsResult?.cards
      ? cardsResult
      : { cards: [], count: 0 };

  return (
    <div className="h-full flex flex-col">
      <MarketIndexDashboard
        canEdit={canEdit}
        unavailable={unavailable}
        initialCards={initialCards}
      />
    </div>
  );
}
