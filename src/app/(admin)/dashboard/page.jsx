import ClientsListQuery from "./_components/clients-list-query";
import DashbordFilter from "./_components/dashbord-filter";

import AxiosDebugger from "@/components/debug/axios-debugger";
import { cookies } from "next/headers";
import PremiumFeatures from "./_components/premuim-features";

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

export default async function DashbordPage({ searchParams: rawSearchParams }) {
  const searchParams = await rawSearchParams;
  return (
    <div className="bg-gray-50 min-h-screen ">
      <div className="container mx-auto my-3 no-print !px-0">
        <PremiumFeatures />
      </div>

      <div className="container mx-auto bg-white rounded-md shadow-sm md:py-6">
        <DashbordFilter appliedFilters={searchParams} />

        {/* Debug component to investigate the axios issue */}
        <AxiosDebugger />

        {/* <SearchBar q={searchParams.query} /> */}

        <ClientsListQuery searchParams={searchParams} />
      </div>
    </div>
  );
}
