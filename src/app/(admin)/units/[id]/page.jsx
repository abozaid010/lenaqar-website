import {
  fetchCitisAndProjects,
  fetchcombounds,
  fetchDevelopers,
  fetchUnitById,
} from "@/components/services/serviceFetching";
import { cookies } from "next/headers";
import Link from "next/link";
import UnitClientWrapper from "./_components/unit-client-wrapper";

// Dynamic metadata
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

const Page = async ({ params }) => {
  const { id } = await params;
  const unit = await fetchUnitById(id);
  const cookieStore = await cookies();

  const clientId = cookieStore.get("lena-website-client_id")?.value;

  const [comboundata, developers, citiesAndDistricts] = await Promise.all([
    fetchcombounds(),
    fetchDevelopers(),
    fetchCitisAndProjects(),
  ]);

  let hasAccess = true;
  if (!unit?.status) {
    hasAccess = false;
  }

  return (
    <div className="container mx-auto h-full">
      {hasAccess ? (
        <UnitClientWrapper
          data={unit.data}
          compounds={comboundata}
          developers={developers}
          citiesAndDistricts={citiesAndDistricts}
          clientId={clientId}
        />
      ) : (
        <div className="flex flex-col items-center justify-center h-full">
          <h1 className="text-2xl font-bold text-gray-800">Access Denied</h1>
          <p className="text-gray-600 mt-2">
            You do not have permission to view this unit.
          </p>
          <Link
            href="/dashboard"
            className="underline text-sm text-blue-700 mt-4"
          >
            Go Back to Dashboard
          </Link>
        </div>
      )}
    </div>
  );
};

export default Page;
