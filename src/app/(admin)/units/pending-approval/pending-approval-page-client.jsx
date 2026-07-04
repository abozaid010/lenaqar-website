"use client";

import ResalePageQuery from "@/components/ui/resale_page_query";
import { UnitsBulkSelectionProvider } from "@/context/units-bulk-selection-context";

export default function PendingApprovalPageClient({
  searchParams,
  clientId,
  initialUnitsData,
}) {
  return (
    <UnitsBulkSelectionProvider clientId={clientId}>
      <ResalePageQuery
        searchParams={searchParams}
        initialUnitsData={initialUnitsData}
      />
    </UnitsBulkSelectionProvider>
  );
}
