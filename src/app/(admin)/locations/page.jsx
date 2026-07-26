import { cookies } from "next/headers";
import dynamic from "next/dynamic";
import { COOKIE_KEYS } from "@/constants/cookieKeys";
import { SITE_URL } from "../../metadata";
import { assertLocationsAdminAccess } from "./_lib/access";
import {
  fetchLocationRootsServer,
  fetchPendingLocationsServer,
} from "@/lib/market-index/marketIndex.server";
import LoadingSpinner from "@/components/ui/loading-spinner";

const LocationsPageClient = dynamic(
  () => import("./_components/locations-page-client"),
  {
    loading: () => (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    ),
  }
);

export async function generateMetadata() {
  const cookieStore = await cookies();
  const clientInfoCookie = cookieStore.get(COOKIE_KEYS.CLIENT_INFO)?.value;
  let clientName = null;
  try {
    clientName = clientInfoCookie
      ? JSON.parse(clientInfoCookie)?.client_name
      : null;
  } catch {
    clientName = null;
  }

  return {
    title: clientName
      ? `Locations - ${clientName} | LENAAI AI Sales Agent`
      : "Locations - LENAAI AI Sales Agent",
    robots: { index: false, follow: false },
    alternates: { canonical: `${SITE_URL}/locations` },
  };
}

export default async function LocationsPage() {
  // Gate first — other clients/roles never load this page or its data.
  await assertLocationsAdminAccess();

  const [rootsResult, pendingResult] = await Promise.all([
    fetchLocationRootsServer(),
    fetchPendingLocationsServer({ limit: 500 }),
  ]);

  const unavailable = Boolean(
    rootsResult?.unavailable || pendingResult?.unavailable
  );

  const initialRoots = unavailable
    ? null
    : rootsResult?.locations
      ? rootsResult
      : { locations: [], count: 0 };

  const initialPending = unavailable
    ? null
    : pendingResult?.locations
      ? pendingResult
      : { locations: [], count: 0 };

  return (
    <div className="h-full flex flex-col">
      <LocationsPageClient
        unavailable={unavailable}
        initialRoots={initialRoots}
        initialPending={initialPending}
      />
    </div>
  );
}
