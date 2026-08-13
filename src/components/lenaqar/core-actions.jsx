"use client";

import { useI18n } from "@/hooks/useI18n";
import AddUnitButton from "@/components/ui/unit-forms/add-unit-button";
import BuyRequestCta from "./buy-request-cta";

export default function CoreActions({
  className = "",
  initialValues,
  anchor = false,
}) {
  const { translate } = useI18n();

  return (
    <div
      id={anchor ? "buy-request" : undefined}
      className={`flex flex-col sm:flex-row gap-3 scroll-mt-24 ${className}`}
    >
      <AddUnitButton
        label={translate("lenaqar.actions.addUnit", "Add Unit Details")}
        className="w-full sm:flex-1"
      />
      <BuyRequestCta
        variant="secondary"
        className="w-full sm:flex-1"
        initialValues={initialValues}
        label={translate("lenaqar.actions.buyRequest")}
        autoOpenHash={anchor}
      />
    </div>
  );
}
