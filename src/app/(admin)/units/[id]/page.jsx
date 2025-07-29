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

  return <UnitDetailsPageQuery unitId={id} />;
};

export default Page;
