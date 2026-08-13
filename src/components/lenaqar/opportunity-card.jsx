"use client";

import Link from "next/link";
import { useI18n } from "@/hooks/useI18n";
import ImageWithLoader from "@/components/ui/image-with-loader";
import { getDisplayImageUrl } from "@/utils/imageUtils";
import { formatDate, formatDeliveryDate } from "@/lib/units/unit-formatters";
import { formatCashMultiple, pricePerMeter } from "@/lib/lenaqar/metrics";
import EgpAmount from "./egp-amount";
import OpportunityUnitActions from "./opportunity-unit-actions";

function firstImageUrl(unit) {
  const url = unit?.images?.[0]?.url;
  return url ? getDisplayImageUrl(url) : null;
}

export default function OpportunityCard({ unit }) {
  const { translate } = useI18n();
  if (!unit) return null;

  const imageUrl = firstImageUrl(unit);
  const projectName = unit.projectAr || unit.project;
  const developerName = unit.developerAr || unit.developer;
  const location = [unit.district, unit.city].filter(Boolean).join(" · ");
  const typeLabel = unit.buildingType || null;
  const deliveryLabel = formatDeliveryDate(unit.deliveryDate, "ar");
  const priceDate = formatDate(unit.updatedAt, "ar");
  const meterPrice = pricePerMeter(unit.totalPrice, unit.landArea);
  const multipleLabel = formatCashMultiple(unit.cashMultiple);
  const href = `/opportunities/${encodeURIComponent(unit.code)}`;
  const showOffer = Number(unit.overPrice) > 0;

  return (
    <article className="rounded-lg border border-black/10 bg-white overflow-hidden flex flex-col">
      <Link href={href} className="block relative aspect-[16/10] bg-gray-100">
        {imageUrl ? (
          <ImageWithLoader
            src={imageUrl}
            alt={projectName || unit.code}
            className="object-cover"
          />
        ) : null}
        {showOffer ? (
          <span className="absolute top-2 end-2 text-xs bg-white/90 text-primary px-2 py-1 rounded">
            {translate("lenaqar.unit.offer")}
          </span>
        ) : unit.totalPrice != null ? (
          <span className="absolute top-2 end-2 text-xs bg-white/90 text-primary px-2 py-1 rounded">
            {translate("lenaqar.unit.developerPrice")}
          </span>
        ) : null}
      </Link>

      <div className="p-4 flex flex-col gap-3 grow">
        <div>
          {projectName ? (
            <h3 className="font-bold text-primary">
              <Link href={href}>{projectName}</Link>
            </h3>
          ) : null}
          <p className="text-sm text-black/60">
            {[developerName, location].filter(Boolean).join(" · ")}
          </p>
          <p className="text-sm text-black/60">
            {[
              typeLabel,
              unit.roomsCount != null
                ? `${unit.roomsCount} ${translate("lenaqar.unit.rooms")}`
                : null,
              unit.landArea != null
                ? `${unit.landArea} ${translate("lenaqar.unit.meter")}`
                : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {unit.isPrimary === true ? (
            <p className="text-xs mt-1">{translate("lenaqar.unit.primary")}</p>
          ) : unit.isPrimary === false ? (
            <p className="text-xs mt-1">{translate("lenaqar.unit.resale")}</p>
          ) : null}
        </div>

        {unit.totalPrice != null ? (
          <div className="border-t border-black/10 pt-3">
            <p className="text-xs text-black/60 mb-1">
              {translate("lenaqar.unit.totalValue")}
            </p>
            <p className="text-2xl font-bold text-primary">
              <EgpAmount value={unit.totalPrice} translate={translate} />
            </p>
          </div>
        ) : null}

        {unit.downPayment != null ? (
          <p className="text-sm">
            {translate("lenaqar.unit.cashRequired")}{" "}
            <EgpAmount value={unit.downPayment} translate={translate} />
          </p>
        ) : null}

        {showOffer ? (
          <p className="text-sm font-semibold text-primary">
            {translate("lenaqar.unit.overPrice")}{" "}
            <EgpAmount value={unit.overPrice} translate={translate} />
          </p>
        ) : null}

        <dl className="grid grid-cols-1 gap-1 text-sm">
          {unit.installmentAmountYearly != null ? (
            <div className="flex justify-between gap-3">
              <dt className="text-black/60">
                {translate("lenaqar.unit.installmentYearly")}
              </dt>
              <dd>
                <EgpAmount
                  value={unit.installmentAmountYearly}
                  translate={translate}
                />
              </dd>
            </div>
          ) : null}
          {unit.installmentYears != null ? (
            <div className="flex justify-between gap-3">
              <dt className="text-black/60">
                {translate("lenaqar.unit.duration")}
              </dt>
              <dd className="tabular-nums">
                {unit.installmentYears}{" "}
                {unit.installmentYears === 1
                  ? translate("lenaqar.unit.year")
                  : translate("lenaqar.unit.years")}
              </dd>
            </div>
          ) : null}
          {deliveryLabel || unit.deliveryYear ? (
            <div className="flex justify-between gap-3">
              <dt className="text-black/60">
                {translate("lenaqar.unit.delivery")}
              </dt>
              <dd className="tabular-nums">
                {deliveryLabel || unit.deliveryYear}
              </dd>
            </div>
          ) : null}
        </dl>

        {multipleLabel ? (
          <p className="text-sm font-semibold">
            {translate("lenaqar.unit.cashMultiple")}: ×{multipleLabel}
          </p>
        ) : null}

        {meterPrice != null ? (
          <p className="text-sm text-black/60">
            {translate("lenaqar.unit.pricePerMeter")}{" "}
            <EgpAmount value={meterPrice} translate={translate} />
          </p>
        ) : null}

        {priceDate ? (
          <p className="text-xs text-black/50">
            {translate("lenaqar.unit.priceUpdated").replace("{date}", priceDate)}
          </p>
        ) : null}

        <OpportunityUnitActions unit={unit} className="mt-auto" />
      </div>
    </article>
  );
}
