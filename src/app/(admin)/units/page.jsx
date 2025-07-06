import UnitsPageQueryOptimized from "./_components/units-page-query-optimized";

import { cookies } from "next/headers";

export async function generateMetadata() {
  const cookieStore = await cookies();

  const clientName = cookieStore.get("client_info")?.value
    ? JSON.parse(cookieStore.get("client_info")?.value)?.client_name
    : null;

  return {
    title: clientName ? `LENAAI | ${clientName}` : "LENAAI",
    description: `LENAAI, your AI property consultant.`,
  };
}

export default async function UnitsPage({ searchParams: rawSearchParams }) {
  const searchParams = await rawSearchParams;

  return (
    <div className="container">
      <UnitsPageQueryOptimized searchParams={searchParams} />
    </div>
  );
}
