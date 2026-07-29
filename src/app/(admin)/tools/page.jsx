import { cookies } from "next/headers";
import { COOKIE_KEYS } from "@/constants/cookieKeys";
import { SITE_URL } from "../../metadata";
import ToolsCatalogPage from "./_components/ToolsCatalogPage";

export async function generateMetadata() {
  const cookieStore = await cookies();
  const clientInfoCookie = cookieStore.get(COOKIE_KEYS.CLIENT_INFO)?.value;
  let clientName = null;
  try {
    clientName = clientInfoCookie
      ? JSON.parse(clientInfoCookie)?.client_name
      : null;
  } catch {
    clientName = null;
  }

  return {
    title: clientName
      ? `Tools - ${clientName} | LENAAI AI Sales Agent`
      : "Tools - LENAAI AI Sales Agent",
    robots: { index: false, follow: false },
    alternates: { canonical: `${SITE_URL}/tools` },
  };
}

export default function ToolsPage() {
  return (
    <div className="h-full flex flex-col p-3 sm:p-4">
      <ToolsCatalogPage />
    </div>
  );
}
