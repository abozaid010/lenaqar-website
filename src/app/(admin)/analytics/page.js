import React from "react";
import Analytics from "./_component/Analtics";
import { fetchMonthData, userAnalytics } from "@/components/services/serviceFetching";



const page = async ({ searchParams: rawSearchParams }) => {
  const searchParams = await rawSearchParams;
  const[datamonth,data]=await Promise.all([
    fetchMonthData(JSON.stringify(searchParams)),
    userAnalytics(10)
  ])

 
  return <div>
    <Analytics data={data} datamonth={datamonth} appliedFilters={searchParams} />
    </div>;
};

export default page;
