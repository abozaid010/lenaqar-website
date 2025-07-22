import { getProfileData } from "@/components/services/serviceFetching";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { Suspense } from "react";
import ClientInfo from "../_components/clientInfo";

export default async function ClientPage({ params }) {
  const data = await getProfileData();

  return (
    <Suspense
      fallback={
        <LoadingSpinner
          message="Loading profile..."
          containerClassName="flex items-center justify-center h-96"
        />
      }
    >
      <ClientInfo data={data.data} />
    </Suspense>
  );
}
