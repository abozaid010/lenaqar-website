import {
  getSalesData,
  getschedual,
} from "@/components/services/serviceFetching";
import Schedual from "./components/Schedual";

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
  const data = await getschedual(formattedBefore, formattedAfter);
  const dataSales = await getSalesData();

  return <Schedual data={data} dataSales={dataSales?.data} />;
};

export default page;
