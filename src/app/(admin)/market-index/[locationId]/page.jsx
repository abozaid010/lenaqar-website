import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { COOKIE_KEYS } from "@/constants/cookieKeys";
import { SITE_URL } from "../../../metadata";
import { assertMarketIndexAccess } from "../_lib/access";
import {
  fetchMarketCard,
  fetchLocation,
} from "@/lib/market-index/marketIndex.server";
import {
  DEFAULT_ADJUSTMENTS,
  DEFAULT_CARD_GENERAL,
} from "@/lib/market-index/constants";
import CardEditor from "../_components/card-editor";

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
      ? `Market Index Card - ${clientName} | LENAAI AI Sales Agent`
      : "Market Index Card - LENAAI AI Sales Agent",
    robots: { index: false, follow: false },
    alternates: { canonical: `${SITE_URL}/market-index` },
  };
}

export default async function MarketIndexCardPage({ params }) {
  const { canEdit } = await assertMarketIndexAccess();
  const { locationId: rawId } = await params;
  const locationId = decodeURIComponent(rawId || "");

  if (!locationId) notFound();

  const [cardResult, location] = await Promise.all([
    fetchMarketCard(locationId),
    fetchLocation(locationId),
  ]);

  if (!location || location.is_leaf !== true) notFound();

  const unavailable = Boolean(cardResult?.unavailable);

  let initialCard = null;
  let initialUnits = [];
  let isNewDraft = false;

  if (!unavailable) {
    if (cardResult?.card) {
      initialCard = cardResult.card;
      initialUnits = Array.isArray(cardResult.units) ? cardResult.units : [];
    } else if (canEdit) {
      // 404 / no draft yet — editors may create on first save.
      isNewDraft = true;
      initialCard = {
        id: locationId,
        location_id: locationId,
        location_en_name: location.en_name,
        status: "draft",
        active_version: 0,
        general: {
          ...DEFAULT_CARD_GENERAL,
          confidence_weights: { ...DEFAULT_CARD_GENERAL.confidence_weights },
        },
        adjustments: {
          view: { ...DEFAULT_ADJUSTMENTS.view },
          finishing: { ...DEFAULT_ADJUSTMENTS.finishing },
        },
      };
      initialUnits = [];
    } else {
      // Viewer with no card payload to show.
      return (
        <div className="h-full flex flex-col">
          <CardEditor
            canEdit={false}
            unavailable
            location={location}
            locationId={locationId}
            initialCard={null}
            initialUnits={[]}
            isNewDraft={false}
          />
        </div>
      );
    }
  }

  return (
    <div className="h-full flex flex-col">
      <CardEditor
        canEdit={canEdit}
        unavailable={unavailable}
        location={location}
        locationId={locationId}
        initialCard={initialCard}
        initialUnits={initialUnits}
        isNewDraft={isNewDraft}
      />
    </div>
  );
}
