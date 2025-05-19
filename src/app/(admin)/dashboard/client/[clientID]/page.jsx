import { getProfileData } from "@/components/services/serviceFetching";
import ClientInfo from "../_components/clientInfo";

export default async function ClientPage({ params }) {
  const data = await getProfileData();
  console.log(data)

  return <ClientInfo data={data.data} />;
}
