import {
  fetchCitisAndProjects,
  fetchcombounds,
  fetchDevelopers,
  fetchUnitsFilter,
} from "@/components/services/serviceFetching";

import { cookies } from "next/headers";
import UnitsClientWrapper from "./_components/units-client-wrapper";

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
  const cookieStore = await cookies();
  const clientId = cookieStore.get("lena-website-client_id")?.value;
  const clientName = cookieStore.get("client_info")?.value
    ? JSON.parse(cookieStore.get("client_info")?.value)?.client_name
    : null;

  searchParams.client_id = clientId;
  const [unintsRes, developers, compounds, citiesAndDistricts] =
    await Promise.all([
      fetchUnitsFilter(JSON.stringify(searchParams), true),
      fetchDevelopers(),
      fetchcombounds(true),
      fetchCitisAndProjects(),
    ]);

  console.log(unintsRes.data.units);
  return (
    <div className="container">
      <UnitsClientWrapper
        initialUnits={unintsRes.data.units}
        searchParams={searchParams}
        developers={developers}
        compounds={compounds}
        clientId={clientId}
        clientName={clientName}
        citiesAndDistricts={citiesAndDistricts}
      />
    </div>
  );
}
