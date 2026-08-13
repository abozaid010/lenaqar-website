"use client";

import { useI18n } from "@/hooks/useI18n";
import ImageWithLoader from "@/components/ui/image-with-loader";
import { getDisplayImageUrl } from "@/utils/imageUtils";
import { formatDate, formatDeliveryDate } from "@/lib/units/unit-formatters";
import { formatCashMultiple, pricePerMeter } from "@/lib/lenaqar/metrics";
import { buyerCtaHref } from "@/lib/lenaqar/whatsapp";
import { ANALYTICS } from "@/constants/analytics";
import BreadcrumbSchema from "@/components/schema/BreadcrumbSchema";
import { SITE } from "@/config/site";
import EgpAmount from "@/components/lenaqar/egp-amount";
import WhatsAppCta from "@/components/lenaqar/whatsapp-cta";
import UnitViewTracker from "@/components/lenaqar/unit-view-tracker";

export default function OpportunityDetailContent({ unit }) {
  const { translate } = useI18n();
  const projectName = unit.projectAr || unit.project || unit.code;
  const developerName = unit.developerAr || unit.developer;
  const deliveryLabel = formatDeliveryDate(unit.deliveryDate, "ar");
  const priceDate = formatDate(unit.updatedAt, "ar");
  const meterPrice = pricePerMeter(unit.totalPrice, unit.landArea);
  const multipleLabel = formatCashMultiple(unit.cashMultiple);
  const typeLabel = unit.buildingType || null;
  const images = (unit.images || [])
    .map((img) => getDisplayImageUrl(img.url))
    .filter(Boolean);

  return (
    <article className="container py-12 pb-24 lg:pb-12">
      <UnitViewTracker code={unit.code} />
      <BreadcrumbSchema
        items={[
          {
            name: translate("lenaqar.opportunities.title"),
            url: `${SITE.url}/opportunities`,
          },
          {
            name: projectName,
            url: `${SITE.url}/opportunities/${encodeURIComponent(unit.code)}`,
          },
        ]}
      />

      <h1 className="text-3xl font-bold text-primary leading-snug">
        {projectName}
      </h1>
      <p className="mt-2 text-black/70">
        {[developerName, unit.district, unit.city].filter(Boolean).join(" · ")}
      </p>

      {images.length > 0 ? (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {images.map((src) => (
            <div key={src} className="relative aspect-[16/10] bg-gray-100 rounded-lg overflow-hidden">
              <ImageWithLoader src={src} alt={projectName} className="object-cover" />
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-8 border-t border-black/10 pt-6">
        <p className="text-xs text-black/60 mb-1">
          {translate("lenaqar.unit.cashRequired")}
        </p>
        <p className="text-3xl font-bold text-primary">
          <EgpAmount value={unit.downPayment} translate={translate} />
        </p>
      </div>

      <dl className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        {typeLabel ? (
          <div>
            <dt className="text-black/60">{typeLabel}</dt>
          </div>
        ) : null}
        {unit.roomsCount != null ? (
          <div className="flex justify-between gap-3">
            <dt className="text-black/60">{translate("lenaqar.unit.rooms")}</dt>
            <dd className="tabular-nums">{unit.roomsCount}</dd>
          </div>
        ) : null}
        {unit.bathroomCount != null ? (
          <div className="flex justify-between gap-3">
            <dt className="text-black/60">{translate("lenaqar.unit.bathrooms")}</dt>
            <dd className="tabular-nums">{unit.bathroomCount}</dd>
          </div>
        ) : null}
        {unit.landArea != null ? (
          <div className="flex justify-between gap-3">
            <dt className="text-black/60">{translate("lenaqar.unit.meter")}</dt>
            <dd className="tabular-nums">{unit.landArea}</dd>
          </div>
        ) : null}
        {unit.installmentAmountYearly != null ? (
          <div className="flex justify-between gap-3">
            <dt className="text-black/60">
              {translate("lenaqar.unit.installmentYearly")}
            </dt>
            <dd>
              <EgpAmount value={unit.installmentAmountYearly} translate={translate} />
            </dd>
          </div>
        ) : null}
        {unit.installmentYears != null ? (
          <div className="flex justify-between gap-3">
            <dt className="text-black/60">{translate("lenaqar.unit.duration")}</dt>
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
            <dt className="text-black/60">{translate("lenaqar.unit.delivery")}</dt>
            <dd className="tabular-nums">{deliveryLabel || unit.deliveryYear}</dd>
          </div>
        ) : null}
        {unit.totalPrice != null ? (
          <div className="flex justify-between gap-3">
            <dt className="text-black/60">{translate("lenaqar.unit.totalValue")}</dt>
            <dd>
              <EgpAmount value={unit.totalPrice} translate={translate} />
            </dd>
          </div>
        ) : null}
        {meterPrice != null ? (
          <div className="flex justify-between gap-3">
            <dt className="text-black/60">{translate("lenaqar.unit.pricePerMeter")}</dt>
            <dd>
              <EgpAmount value={meterPrice} translate={translate} />
            </dd>
          </div>
        ) : null}
      </dl>

      {multipleLabel ? (
        <p className="mt-6 font-semibold">
          {translate("lenaqar.unit.cashMultiple")}: ×{multipleLabel}
        </p>
      ) : null}
      <p className="text-sm text-black/60 mt-2">
        {translate("lenaqar.unit.honesty")}
      </p>
      {priceDate ? (
        <p className="text-xs text-black/50 mt-2">
          {translate("lenaqar.unit.priceUpdated").replace("{date}", priceDate)}
        </p>
      ) : null}

      <div className="mt-8">
        <WhatsAppCta
          href={buyerCtaHref(unit)}
          eventName={ANALYTICS.EVENTS.BUYER_WHATSAPP_CLICKED}
        >
          {translate("lenaqar.unit.cta")}
        </WhatsAppCta>
      </div>
    </article>
  );
}
