import { cookies } from "next/headers";
import Analytics from "./_component/Analtics";
import {
  fetchMonthData,
  userAnalytics,
} from "@/components/services/serviceFetching";
import { SITE_URL } from "../../metadata";
import BreadcrumbSchema from "@/components/schema/BreadcrumbSchema";

export async function generateMetadata() {
  const cookieStore = await cookies();

  const clientName = cookieStore.get("client_info")?.value
    ? JSON.parse(cookieStore.get("client_info")?.value)?.client_name
    : null;

  return {
    title: clientName
      ? `Analytics - ${clientName} | LENAAI AI CRM`
      : "Analytics - LENAAI AI CRM",
    description:
      "View comprehensive analytics and insights for your real estate business. Track sales performance, marketing campaigns, and client engagement metrics.",
    keywords: [
      "real estate analytics",
      "sales analytics",
      "marketing analytics",
      "CRM analytics",
      "AI analytics",
      "business insights",
    ],
    openGraph: {
      title: "Analytics - LENAAI AI CRM",
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
  const searchParams = await rawSearchParams;
  const [datamonth, data] = await Promise.all([
    fetchMonthData(JSON.stringify(searchParams)),
    userAnalytics(10),
  ]);

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
        <Analytics
          data={data}
          datamonth={datamonth}
          appliedFilters={searchParams}
        />
      </div>
    </>
  );
};

export default page;
