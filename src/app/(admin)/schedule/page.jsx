import {
  getSalesData,
  getschedual,
} from "@/components/services/serviceFetching";
import Schedual from "./components/Schedual";
import ErrorBoundary from "@/components/ui/error-boundary";
import { SITE_URL } from "../../metadata";
import BreadcrumbSchema from "@/components/schema/BreadcrumbSchema";
import { COOKIE_KEYS } from "@/constants/cookieKeys";
import {
  DEFAULT_SCHEDULE_ACTION_FILTER,
  SCHEDULE_VISIBLE_ACTIONS,
} from "@/utils/action-constants";
import {
  fetchActionCatalogServer,
  getScheduledActionValuesFromCatalog,
} from "@/lib/action-catalog.server";
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
      "Manage meetings, appointments, and follow-ups. Organize your real estate sales calendar with LENAAI's Real Estate AI Sales Agent dashboard.",
    keywords: [
      "meeting scheduler",
      "appointment management",
      "calendar",
      "real estate schedule",
      "AI Sales Agent schedule",
    ],
    openGraph: {
      title: "Schedule - LENAAI AI Sales Agent",
      description:
        "Manage meetings and appointments with LENAAI's Real Estate AI Sales Agent platform.",
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

// Week starts on Saturday. Align to the Saturday of the current week, then
// fetch the previous week, current week, and next week so navigation always
// has data available (Saturday → Friday).
const dayOfWeek = today.getDay(); // 0 = Sunday ... 6 = Saturday
const offsetToSaturday = (dayOfWeek + 1) % 7; // days since last Saturday
const currentWeekStart = new Date(today);
currentWeekStart.setDate(today.getDate() - offsetToSaturday);

const rangeStart = new Date(currentWeekStart);
rangeStart.setDate(currentWeekStart.getDate() - 7); // previous week's Saturday

const rangeEnd = new Date(currentWeekStart);
rangeEnd.setDate(currentWeekStart.getDate() + 13); // next week's Friday

const formattedBefore = rangeStart.toISOString().split("T")[0];
const formattedAfter = rangeEnd.toISOString().split("T")[0];

const page = async () => {
  try {
    const catalog = await fetchActionCatalogServer();
    const fromCatalog = getScheduledActionValuesFromCatalog(catalog);
    const scheduledActions =
      fromCatalog.length > 0 ? fromCatalog : SCHEDULE_VISIBLE_ACTIONS;

    // Default view: Property view only. Dropdown options still get full list.
    const initialFetchActions = [DEFAULT_SCHEDULE_ACTION_FILTER];

    // Run both API calls in parallel for better performance
    const [data, dataSales] = await Promise.allSettled([
      getschedual(formattedBefore, formattedAfter, initialFetchActions),
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
          <Schedual
            data={scheduleData}
            dataSales={salesData}
            scheduledActionValues={scheduledActions}
          />
        </ErrorBoundary>
      </>
    );
  } catch (error) {
    console.error("Error loading schedule page:", error?.message ?? error);
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
