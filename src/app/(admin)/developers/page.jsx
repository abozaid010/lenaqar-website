import { cookies } from "next/headers";
import DevelopersClientWrapper from "./_components/developers-client-wrapper";

export default async function DevelopersPage() {
  const cookieStore = await cookies();
  const clientId = cookieStore.get("lena-website-client_id")?.value || null;

  return <DevelopersClientWrapper clientId={clientId} />;
}
