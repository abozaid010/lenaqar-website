"use client";

import Link from "next/link";
import { useI18n } from "@/hooks/useI18n";
import ImageWithLoader from "@/components/ui/image-with-loader";
import { getDisplayImageUrl } from "@/utils/imageUtils";
import { formatDate, formatDeliveryDate } from "@/lib/units/unit-formatters";
import { deliveryDisplay } from "@/lib/lenaqar/delivery-display";
import { formatCashMultiple, pricePerMeter } from "@/lib/lenaqar/metrics";
import BreadcrumbSchema from "@/components/schema/BreadcrumbSchema";
import ListingSchema from "@/components/schema/ListingSchema";
import {
  buildingTypeAr,
  buildListingHeadline,
  developerLabel,
  isoDateModified,
  placeAr,
  projectLabel,
} from "@/lib/lenaqar/listing-seo";
import {
  isOpportunityIndexable,
  mayShowMoneySplit,
  unitLastChecked,
  unitPaperStatus,
  unitVerificationLevel,
} from "@/lib/lenaqar/unit-trust";
import { SITE } from "@/config/site";
import EgpAmount from "@/components/lenaqar/egp-amount";
import OpportunityUnitActions from "@/components/lenaqar/opportunity-unit-actions";
import UnitVideo from "@/components/lenaqar/unit-video";
import UnitViewTracker from "@/components/lenaqar/unit-view-tracker";

const ROWS = "mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm";
const ROW = "flex justify-between gap-3";

/** One headed block of the listing. Rendered only by callers that have data for it. */
function Section({ id, title, children }) {
  return (
    <section aria-labelledby={id} className="mt-8 border-t border-black/10 pt-6">
      <h2 id={id} className="text-lg font-bold text-primary">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function OpportunityDetailContent({
  unit,
  guideLinks = [],
  buyChecks = [],
  checklistGuide = null,
}) {
  const { translate } = useI18n();
  const projectName = projectLabel(unit) || unit.code;
  const headline = buildListingHeadline(unit);
  const canonicalUrl = `${SITE.url}/opportunities/${encodeURIComponent(unit.code)}`;
  const developerName = developerLabel(unit);
  // A delivery date already past reads «استلام فوري»; a future one stays as it is.
  const deliveryLabel = deliveryDisplay(unit).ready
    ? translate("lenaqar.unit.deliveryReady")
    : formatDeliveryDate(unit.deliveryDate, "ar");
  const recordUpdatedDate = formatDate(unit.updatedAt, "ar");
  const recordUpdatedIso = isoDateModified(unit.updatedAt);
  const lastCheckedLabel = formatDate(unitLastChecked(unit), "ar");
  const paperStatus = unitPaperStatus(unit);
  const verificationLevel = unitVerificationLevel(unit);
  const meterPrice = pricePerMeter(unit.totalPrice, unit.landArea);
  const multipleLabel = formatCashMultiple(unit.cashMultiple);
  const showMoneySplit = mayShowMoneySplit(unit);
  const indexable = isOpportunityIndexable(unit);
  const typeLabel = buildingTypeAr(unit.buildingType) || null;
  const districtName = unit.districtAr || placeAr(unit.district);
  const cityName = unit.cityAr || placeAr(unit.city);
  const hasPaymentRows =
    unit.installmentAmountYearly != null ||
    unit.installmentYears != null ||
    unit.remainingAmount != null ||
    Number(unit.overPrice) > 0;
  const hasPayment =
    showMoneySplit && (unit.downPayment != null || hasPaymentRows);
  // Same facts as the headline and sub-line, as labelled rows.
  const locationRows = [
    { key: "project", value: projectLabel(unit) },
    { key: "developer", value: developerName },
    { key: "district", value: districtName },
    { key: "city", value: cityName },
  ].filter((row) => row.value);
  const checkLinks = [
    {
      href: "/before-you-pay",
      title: translate("lenaqar.doors.before_you_pay.cardTitle"),
    },
    {
      href: "/verified-prices",
      title: translate("lenaqar.doors.verified_prices.cardTitle"),
    },
    ...(checklistGuide ? [checklistGuide] : []),
  ];
  const images = (unit.images || [])
    .map((img) => getDisplayImageUrl(img.url))
    .filter(Boolean);

  return (
    <article className="container py-12 pb-24 lg:pb-12">
      <UnitViewTracker code={unit.code} />
      <BreadcrumbSchema
        items={[
          {
            name: translate("lenaqar.header.opportunities"),
            url: `${SITE.url}/opportunities`,
          },
          {
            name: projectName,
            url: canonicalUrl,
          },
        ]}
      />
      {indexable ? (
        <ListingSchema unit={unit} url={canonicalUrl} />
      ) : null}

      <h1 className="text-3xl font-bold text-primary leading-snug">
        {headline}
      </h1>
      <p className="mt-2 text-black/70">
        {[developerName, districtName, cityName]
          .filter(Boolean)
          .join(" · ")}
      </p>

      {unit.video ? (
        <UnitVideo video={unit.video} poster={images[0]} title={headline} />
      ) : null}

      {images.length > 0 ? (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {images.map((src, index) => (
            <div key={src} className="relative aspect-[16/10] bg-gray-100 rounded-lg overflow-hidden">
              <ImageWithLoader
                src={src}
                alt={`${headline} — صورة ${index + 1}`}
                className="object-cover"
              />
            </div>
          ))}
        </div>
      ) : null}

      {hasPayment ? (
        <Section id="unit-payment" title={translate("lenaqar.unit.sections.payment")}>
          {unit.downPayment != null ? (
            <div className="mt-3">
              <p className="text-xs text-black/60 mb-1">
                {translate("lenaqar.unit.cashRequired")}
              </p>
              <p className="text-3xl font-bold text-primary">
                <EgpAmount value={unit.downPayment} translate={translate} />
              </p>
            </div>
          ) : null}
          {hasPaymentRows ? (
            <dl className={ROWS}>
              {unit.installmentAmountYearly != null ? (
                <div className={ROW}>
                  <dt className="text-black/60">
                    {translate("lenaqar.unit.installmentYearly")}
                  </dt>
                  <dd>
                    <EgpAmount value={unit.installmentAmountYearly} translate={translate} />
                  </dd>
                </div>
              ) : null}
              {unit.installmentYears != null ? (
                <div className={ROW}>
                  <dt className="text-black/60">{translate("lenaqar.unit.duration")}</dt>
                  <dd className="tabular-nums">
                    {unit.installmentYears}{" "}
                    {unit.installmentYears === 1
                      ? translate("lenaqar.unit.year")
                      : translate("lenaqar.unit.years")}
                  </dd>
                </div>
              ) : null}
              {Number(unit.overPrice) > 0 ? (
                <div className={ROW}>
                  <dt className="text-black/60">{translate("lenaqar.unit.overPrice")}</dt>
                  <dd>
                    <EgpAmount value={unit.overPrice} translate={translate} />
                  </dd>
                </div>
              ) : null}
              {unit.remainingAmount != null ? (
                <div className={ROW}>
                  <dt className="text-black/60">
                    {translate("lenaqar.unit.remaining")}
                  </dt>
                  <dd>
                    <EgpAmount value={unit.remainingAmount} translate={translate} />
                  </dd>
                </div>
              ) : null}
            </dl>
          ) : null}
        </Section>
      ) : null}

      {unit.totalPrice != null || meterPrice != null ? (
        <Section id="unit-price" title={translate("lenaqar.unit.sections.price")}>
          <dl className={ROWS}>
            {unit.totalPrice != null ? (
              <div className={ROW}>
                <dt className="text-black/60">{translate("lenaqar.unit.totalValue")}</dt>
                <dd>
                  <EgpAmount value={unit.totalPrice} translate={translate} />
                </dd>
              </div>
            ) : null}
            {meterPrice != null ? (
              <div className={ROW}>
                <dt className="text-black/60">
                  {translate("lenaqar.unit.pricePerMeter")}
                  <span className="block text-xs text-black/50">
                    {translate("lenaqar.unit.pricePerMeterComputed")}
                  </span>
                </dt>
                <dd className="whitespace-nowrap">
                  <EgpAmount value={meterPrice} translate={translate} />
                  <span className="text-black/50"> /م²</span>
                </dd>
              </div>
            ) : null}
          </dl>
        </Section>
      ) : null}

      {typeLabel || unit.roomsCount > 0 || unit.bathroomCount != null || unit.landArea != null ? (
        <Section id="unit-specs" title={translate("lenaqar.unit.sections.specs")}>
          <dl className={ROWS}>
            {typeLabel ? (
              <div>
                <dt className="text-black/60">{typeLabel}</dt>
              </div>
            ) : null}
            {unit.roomsCount > 0 ? (
              <div className={ROW}>
                <dt className="text-black/60">{translate("lenaqar.unit.rooms")}</dt>
                <dd className="tabular-nums">{unit.roomsCount}</dd>
              </div>
            ) : null}
            {unit.bathroomCount != null ? (
              <div className={ROW}>
                <dt className="text-black/60">{translate("lenaqar.unit.bathrooms")}</dt>
                <dd className="tabular-nums">{unit.bathroomCount}</dd>
              </div>
            ) : null}
            {unit.landArea != null ? (
              <div className={ROW}>
                <dt className="text-black/60">{translate("lenaqar.unit.meter")}</dt>
                <dd className="tabular-nums">{unit.landArea}</dd>
              </div>
            ) : null}
          </dl>
        </Section>
      ) : null}

      {deliveryLabel || unit.deliveryYear || locationRows.length > 0 ? (
        <Section id="unit-location" title={translate("lenaqar.unit.sections.location")}>
          <dl className={ROWS}>
            {deliveryLabel || unit.deliveryYear ? (
              <div className={ROW}>
                <dt className="text-black/60">{translate("lenaqar.unit.delivery")}</dt>
                <dd className="tabular-nums">{deliveryLabel || unit.deliveryYear}</dd>
              </div>
            ) : null}
            {locationRows.map((row) => (
              <div key={row.key} className={ROW}>
                <dt className="text-black/60">{translate(`lenaqar.unit.${row.key}`)}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
        </Section>
      ) : null}

      {paperStatus || verificationLevel || lastCheckedLabel ? (
        <Section id="unit-status" title={translate("lenaqar.unit.sections.status")}>
          <dl className={ROWS}>
            {paperStatus ? (
              <div className={ROW}>
                <dt className="text-black/60">حالة الورق</dt>
                <dd>{String(paperStatus)}</dd>
              </div>
            ) : null}
            {verificationLevel ? (
              <div className={ROW}>
                <dt className="text-black/60">مستوى التحقق</dt>
                <dd>{String(verificationLevel)}</dd>
              </div>
            ) : null}
            {lastCheckedLabel ? (
              <div className={ROW}>
                <dt className="text-black/60">آخر فحص</dt>
                <dd className="tabular-nums">{lastCheckedLabel}</dd>
              </div>
            ) : null}
          </dl>
        </Section>
      ) : null}

      {!showMoneySplit ? (
        <p className="mt-4 text-sm text-black/65">
          تفاصيل السداد ناقصة أو مش متسقة مع الإجمالي — مخفيين لحد المراجعة.
        </p>
      ) : null}

      {showMoneySplit && multipleLabel ? (
        <p className="mt-6 font-semibold">
          {translate("lenaqar.unit.cashMultiple")}: ×{multipleLabel}
        </p>
      ) : null}
      <p className="text-sm text-black/60 mt-2">
        {translate("lenaqar.unit.honesty")}
      </p>
      {recordUpdatedDate ? (
        <p className="text-xs text-black/50 mt-2">
          <time dateTime={recordUpdatedIso || undefined}>
            {translate("lenaqar.unit.recordUpdated").replace("{date}", recordUpdatedDate)}
          </time>
        </p>
      ) : null}

      <div className="mt-8 max-w-md">
        <OpportunityUnitActions unit={unit} location="opportunity_detail" />
      </div>

      {buyChecks.length > 0 ? (
        <Section id="unit-before-buy" title={translate("lenaqar.unit.sections.beforeYouBuy")}>
          <ul className="mt-3 list-disc ps-5 space-y-1.5 text-sm text-black/80">
            {buyChecks.map((check) => (
              <li key={check}>{check}</li>
            ))}
          </ul>
          <ul className="mt-4 flex flex-wrap gap-3">
            {checkLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-flex min-h-11 items-center rounded-lg border border-primary/20 bg-white px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary/5"
                >
                  {link.title}
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {guideLinks.length > 0 ? (
        <nav
          aria-label={translate("lenaqar.guides.indexTitle")}
          className="mt-10 border-t border-black/10 pt-6"
        >
          <h2 className="text-lg font-bold text-primary">
            {translate("lenaqar.guides.indexTitle")}
          </h2>
          <ul className="mt-3 flex flex-wrap gap-3">
            {guideLinks.map((guide) => (
              <li key={guide.href}>
                <Link
                  href={guide.href}
                  className="inline-flex min-h-11 items-center rounded-lg border border-primary/20 bg-white px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary/5"
                >
                  {guide.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </article>
  );
}
