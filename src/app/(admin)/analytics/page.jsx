import { cookies } from "next/headers";
import Analytics from "./_component/Analtics";
import {
  fetchMonthData,
  userAnalytics,
} from "@/components/services/serviceFetching";
export async function generateMetadata() {
  const cookieStore = await cookies();

  const clientName = JSON.parse(
    cookieStore.get("client_info")?.value
  )?.client_name;

  return {
    title: clientName ? `LENAAI | ${clientName}` : "LENAAI",
    description: `LENAAI, your AI property consultant.`,
  };
}
const page = async ({ searchParams: rawSearchParams }) => {
  const searchParams = await rawSearchParams;
  const [datamonth, data] = await Promise.all([
    fetchMonthData(JSON.stringify(searchParams)),
    userAnalytics(10),
  ]);

  return (
    <div>
      <Analytics
        data={data}
        datamonth={datamonth}
        appliedFilters={searchParams}
      />
    </div>
  );
};

export default page;
