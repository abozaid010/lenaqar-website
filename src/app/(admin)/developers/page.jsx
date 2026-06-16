import { cookies } from "next/headers";
import DevelopersClientWrapper from "./_components/developers-client-wrapper";
import { fetchDevelopersServer } from "@/lib/developers/developer-api";
import { SITE_URL } from "../../metadata";
import BreadcrumbSchema from "@/components/schema/BreadcrumbSchema";

export const metadata = {
  title: "Developers - Real Estate Developers Directory | LENAAI AI Sales Agent",
  description:
    "Browse our directory of real estate developers in Egypt. Discover trusted developers, their projects, and property portfolios. Powered by LENAAI AI.",
  keywords: [
    "real estate developers",
    "developers Egypt",
    "property developers",
    "construction companies",
  ],
  openGraph: {
    title: "Developers | LENAAI",
    description:
      "Browse our directory of real estate developers in Egypt. Discover trusted developers and their projects.",
    url: `${SITE_URL}/developers`,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Developers | LENAAI",
    description: "Browse real estate developers in Egypt",
  },
  alternates: {
    canonical: `${SITE_URL}/developers`,
  },
};

import { COOKIE_KEYS } from "@/constants/cookieKeys";

export default async function DevelopersPage() {
  const cookieStore = await cookies();
  const clientId = cookieStore.get(COOKIE_KEYS.CLIENT_ID)?.value || null;

  const initialDevelopersData = await fetchDevelopersServer(20);

  return (
    <>
      <BreadcrumbSchema
        items={[
          {
            name: "Developers",
            url: `${SITE_URL}/developers`,
          },
        ]}
      />
      <DevelopersClientWrapper clientId={clientId} initialDevelopersData={initialDevelopersData} />
    </>
  );
}
