import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import DeveloperDetailsPage from "../_components/developer-details-page";
import { SITE_URL } from "../../../metadata";
import { COOKIE_KEYS } from "@/constants/cookieKeys";
import { safeCookieParse } from "@/utils/safeJsonParser";

export async function generateMetadata({ params }) {
  const { developerId } = await params;
  
  return {
    title: `Developer Details - LENAAI AI Sales Agent`,
    description: "View detailed information about real estate developer including projects, contact information, and profile reviews.",
    keywords: ["developer details", "real estate developer", "property developer"],
    openGraph: {
      title: "Developer Details | LENAAI",
      description: "View comprehensive developer information and profile",
      url: `${SITE_URL}/developers/${developerId}`,
      type: "website",
    },
    robots: {
      index: false,
      follow: false,
    },
    alternates: {
      canonical: `${SITE_URL}/developers/${developerId}`,
    },
  };
}

export default async function DeveloperDetailsPageWrapper({ params, searchParams }) {
  const { developerId } = await params;
  const search = await searchParams;
  
  // Validate developer ID
  if (!developerId || typeof developerId !== "string") {
    notFound();
  }

  const cookieStore = await cookies();
  let clientId = cookieStore.get(COOKIE_KEYS.CLIENT_ID)?.value || null;

  if (!clientId) {
    const clientInfo = safeCookieParse(cookieStore.get(COOKIE_KEYS.CLIENT_INFO)?.value, null);
    clientId = clientInfo?.client_id || clientInfo?.id || null;
  }

  return <DeveloperDetailsPage developerId={developerId} clientId={clientId} searchParams={search} />;
}
