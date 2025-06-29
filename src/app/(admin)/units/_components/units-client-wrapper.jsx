"use client";

import { useState } from "react";

export default function UnitsClientWrapper({
  initialUnits,
  searchParams,
  developers,
  compounds,
  clientId,
  clientName,
  citiesAndDistricts,
}) {
  const [units, setUnits] = useState(initialUnits);
  const [loading, setIsLoading] = useState(false);

  return <></>;
}
