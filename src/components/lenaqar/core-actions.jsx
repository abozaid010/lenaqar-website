"use client";

import { useI18n } from "@/hooks/useI18n";
import AddUnitButton from "@/components/ui/unit-forms/add-unit-button";
import BuyRequestCta from "./buy-request-cta";

const SELL_UNIT_PREFILL = { purpose: "sell" };

export default function CoreActions({
  className = "",
  initialValues,
  anchor = false,
  emphasis = "sell",
  compact = false,
  tone = "default",
  layout,
  showSell = true,
  showBuy = true,
}) {
  const { translate } = useI18n();
  const size = compact ? "compact" : "default";
  const isRow = compact || layout === "row";
  const itemClass = compact ? "" : isRow ? "flex-1" : "w-full sm:flex-1";

  const sell = showSell ? (
    <AddUnitButton
      key="sell"
      label={translate("lenaqar.actions.sellUnit", "Sell Unit")}
      variant={emphasis === "sell" ? "primary" : "secondary"}
      tone={tone}
      size={size}
      showIcon={false}
      unitData={SELL_UNIT_PREFILL}
      className={itemClass}
    />
  ) : null;

  const buy = showBuy ? (
    <BuyRequestCta
      key="buy"
      variant={emphasis === "buy" ? "primary" : "secondary"}
      tone={tone}
      size={size}
      className={itemClass}
      initialValues={initialValues}
      label={translate("lenaqar.actions.buyUnit", "Buy Unit")}
    />
  ) : null;

  const first = emphasis === "buy" ? buy : sell;
  const second = emphasis === "buy" ? sell : buy;

  return (
    <div
      id={anchor ? "buy-request" : undefined}
      className={`${
        isRow
          ? "flex flex-row items-center gap-2"
          : "flex flex-col sm:flex-row gap-3"
      } scroll-mt-24 ${className}`}
    >
      {first}
      {second}
    </div>
  );
}
