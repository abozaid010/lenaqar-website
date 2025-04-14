import UnitDetails from "@/components/dashbord/pages/UnitDetails";
import { fetchcombounds, fetchDevelopers, fetchUnitById } from "@/components/services/serviceFetching";
import React from "react";

export const generateMetadata = async ({ params }) => {
  const { id } = await params;
  const unit = await fetchUnitById(id);
  return {
    title: unit.unitTitle,
  };
};
const Page = async ({ params }) => {
  const { id } = await params;
  const unit = await fetchUnitById(id);
  const comboundata = await fetchcombounds();
  const developers = await fetchDevelopers();
  
  return <UnitDetails unit={unit} comboundata={comboundata} developers={developers}  />;
};

export default Page;
