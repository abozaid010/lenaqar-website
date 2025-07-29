import UnitDetailsPageQuery from "@/components/ui/unit-details/unit-details-page-query";
import { cookies } from "next/headers";

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
  const cookieStore = await cookies();
  const clientId = cookieStore.get("lena-website-client_id")?.value;

  return <UnitDetailsPageQuery unitId={id} clientId={clientId} />;
};

export default Page;
