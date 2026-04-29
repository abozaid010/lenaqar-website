import { cookies } from "next/headers";
import { SITE_URL } from "../../metadata";
import BreadcrumbSchema from "@/components/schema/BreadcrumbSchema";
import AnalyticsPageClient from "./_components/AnalyticsPageClient";

import { COOKIE_KEYS } from "@/constants/cookieKeys";

export async function generateMetadata() {
  const cookieStore = await cookies();

  const clientName = cookieStore.get(COOKIE_KEYS.CLIENT_INFO)?.value
    ? JSON.parse(cookieStore.get(COOKIE_KEYS.CLIENT_INFO)?.value)?.client_name
    : null;

  return {
    title: clientName
      ? `Analytics - ${clientName} | LENAAI AI Sales Agent`
      : "Analytics - LENAAI AI Sales Agent",
    description:
      "View comprehensive analytics and insights for your real estate business. Track sales performance, marketing campaigns, and client engagement metrics.",
    keywords: [
      "real estate analytics",
      "sales analytics",
      "marketing analytics",
      "sales pipeline analytics",
      "AI analytics",
      "business insights",
    ],
    openGraph: {
      title: "Analytics - LENAAI AI Sales Agent",
      description:
        "View comprehensive analytics and insights for your real estate business powered by AI.",
      url: `${SITE_URL}/analytics`,
      type: "website",
    },
    robots: {
      index: false,
      follow: false,
    },
    alternates: {
      canonical: `${SITE_URL}/analytics`,
    },
  };
}
const page = async ({ searchParams: rawSearchParams }) => {
  await rawSearchParams;

  return (
    <>
      <BreadcrumbSchema
        items={[
          {
            name: "Analytics",
            url: `${SITE_URL}/analytics`,
          },
        ]}
      />
      <div>
        <AnalyticsPageClient />
      </div>
    </>
  );
};

export default page;
