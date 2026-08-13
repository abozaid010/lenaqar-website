"use client";

import Link from "next/link";
import { useI18n } from "@/hooks/useI18n";
import ImageWithLoader from "@/components/ui/image-with-loader";
import { getDisplayImageUrl } from "@/utils/imageUtils";
import { formatDate, formatDeliveryDate } from "@/lib/units/unit-formatters";
import { formatCashMultiple, pricePerMeter } from "@/lib/lenaqar/metrics";
import { ANALYTICS } from "@/constants/analytics";
import { buyerCtaHref } from "@/lib/lenaqar/whatsapp";
import EgpAmount from "./egp-amount";
import WhatsAppCta from "./whatsapp-cta";

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
        <span className="absolute top-2 end-2 text-xs bg-white/90 text-primary px-2 py-1 rounded">
          {translate("lenaqar.unit.developerPrice")}
        </span>
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

        <div className="border-t border-black/10 pt-3">
          <p className="text-xs text-black/60 mb-1">
            {translate("lenaqar.unit.cashRequired")}
          </p>
          <p className="text-2xl font-bold text-primary">
            <EgpAmount value={unit.downPayment} translate={translate} />
          </p>
        </div>

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

        {unit.totalPrice != null ? (
          <p className="text-sm">
            {translate("lenaqar.unit.totalValue")}{" "}
            <EgpAmount value={unit.totalPrice} translate={translate} />
          </p>
        ) : null}

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

        <WhatsAppCta
          href={buyerCtaHref(unit)}
          eventName={ANALYTICS.EVENTS.BUYER_WHATSAPP_CLICKED}
          className="w-full mt-auto"
        >
          {translate("lenaqar.unit.cta")}
        </WhatsAppCta>
      </div>
    </article>
  );
}
