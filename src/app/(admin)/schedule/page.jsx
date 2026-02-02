import {
  getSalesData,
  getschedual,
} from "@/components/services/serviceFetching";
import Schedual from "./components/Schedual";
import ErrorBoundary from "@/components/ui/error-boundary";
import { SITE_URL } from "../../metadata";
import BreadcrumbSchema from "@/components/schema/BreadcrumbSchema";
import { COOKIE_KEYS } from "@/constants/cookieKeys";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const cookieStore = await cookies();
  const clientName = cookieStore.get(COOKIE_KEYS.CLIENT_INFO)?.value
    ? JSON.parse(cookieStore.get(COOKIE_KEYS.CLIENT_INFO)?.value)?.client_name
    : null;

  return {
    title: clientName
      ? `Schedule - ${clientName} | LENAAI AI Sales Agent`
      : "Schedule - LENAAI AI Sales Agent",
    description:
      "Manage meetings, appointments, and schedule follow-ups with clients. Organize your real estate sales calendar with LENAAI's AI-powered CRM.",
    keywords: [
      "meeting scheduler",
      "appointment management",
      "calendar",
      "real estate schedule",
      "AI CRM schedule",
    ],
    openGraph: {
      title: "Schedule - LENAAI AI Sales Agent",
      description:
        "Manage meetings and appointments with LENAAI's AI-powered CRM platform.",
      url: `${SITE_URL}/schedule`,
      type: "website",
    },
    robots: {
      index: false,
      follow: false,
    },
    alternates: {
      canonical: `${SITE_URL}/schedule`,
    },
  };
}

const today = new Date();
today.setHours(0, 0, 0, 0);

const sevenDaysAgo = new Date(today);
sevenDaysAgo.setDate(today.getDate() - 7);

const formattedBefore = sevenDaysAgo.toISOString().split("T")[0];
today.setHours(0, 0, 0, 0);

const sevenDaysLater = new Date(today);
sevenDaysLater.setDate(today.getDate() + 7);

const formattedAfter = sevenDaysLater.toISOString().split("T")[0];

const page = async () => {
  try {
    // Run both API calls in parallel for better performance
    const [data, dataSales] = await Promise.allSettled([
      getschedual(formattedBefore, formattedAfter),
      getSalesData()
    ]);

    // Handle results safely
    const scheduleData = data.status === 'fulfilled' ? data.value : [];
    const salesData = dataSales.status === 'fulfilled' ? dataSales.value?.data : [];

    return (
      <>
        <BreadcrumbSchema
          items={[
            {
              name: "Schedule",
              url: `${SITE_URL}/schedule`,
            },
          ]}
        />
        <ErrorBoundary>
          <Schedual data={scheduleData} dataSales={salesData} />
        </ErrorBoundary>
      </>
    );
  } catch (error) {
    console.error("Error loading schedule page:", error);
    // Return component with empty data instead of crashing
    return (
      <>
        <BreadcrumbSchema
          items={[
            {
              name: "Schedule",
              url: `${SITE_URL}/schedule`,
            },
          ]}
        />
        <ErrorBoundary>
          <Schedual data={[]} dataSales={[]} />
        </ErrorBoundary>
      </>
    );
  }
};

export default page;
