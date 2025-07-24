import { getProfileData } from "@/components/services/serviceFetching";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { Suspense } from "react";
import ClientInfo from "../_components/clientInfo";

export default async function ClientPage({ params }) {
  const data = await getProfileData();

  return (
    <Suspense fallback={<LoadingSpinner message="Loading profile..." />}>
      <ClientInfo data={data.data} />
    </Suspense>
  );
}
