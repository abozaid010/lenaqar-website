import { getClientid } from "@/components/services/clientCookies";
import { getClientDevelopers } from "@/components/services/serviceFetching";
import DevelopersClientWrapper from "./_components/developers-client-wrapper";

export default async function DevelopersPage() {
  const clientId = await getClientid();
  let developers = [];

  try {
    const res = await getClientDevelopers(clientId);
    developers = res.data;
  } catch (e) {
    console.error("Error fetching developers:", e);
    // Handle error appropriately, e.g., show a toast or log it
  }

  return (
    <DevelopersClientWrapper
      initialDevelopers={developers || []}
      clientId={clientId}
    />
  );
}
