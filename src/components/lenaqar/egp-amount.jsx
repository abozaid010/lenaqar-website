import { formatEgpNumber } from "@/lib/lenaqar/metrics";

export default function EgpAmount({ value, translate, className = "" }) {
  const formatted = formatEgpNumber(value);
  if (formatted == null) return null;

  return (
    <span
      className={`inline-flex items-baseline gap-1 tabular-nums ${className}`}
    >
      <span>{formatted}</span>
      <span className="text-[0.7em] font-medium">
        {translate("lenaqar.unit.egp")}
      </span>
    </span>
  );
}
