import {
  getSalesData,
  getschedual,
} from "@/components/services/serviceFetching";
import Schedual from "./components/Schedual";
import ErrorBoundary from "@/components/ui/error-boundary";

export const dynamic = "force-dynamic";

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
      <ErrorBoundary>
        <Schedual data={scheduleData} dataSales={salesData} />
      </ErrorBoundary>
    );
  } catch (error) {
    console.error("Error loading schedule page:", error);
    // Return component with empty data instead of crashing
    return (
      <ErrorBoundary>
        <Schedual data={[]} dataSales={[]} />
      </ErrorBoundary>
    );
  }
};

export default page;
