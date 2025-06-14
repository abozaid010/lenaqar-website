import { getClientid } from "@/components/services/clientCookies";
import { getClientDevelopers } from "@/components/services/serviceFetching";
import DevelopersClientWrapper from "./_components/developers-client-wrapper";

export default async function DevelopersPage() {
  const clientId = await getClientid();
  let developers = [];
  let error = null;

  try {
    const res = await getClientDevelopers(clientId);
    if (res.status && Array.isArray(res.data)) {
      developers = res.data;
    } else {
      error =
        res.error_message || "Something went wrong. Please try again later.";
    }
  } catch (e) {
    error = "Something went wrong. Please try again later.";
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-600 font-semibold">{error}</div>
    );
  }

  return (
    <DevelopersClientWrapper
      initialDevelopers={developers}
      clientId={clientId}
    />
  );
}
