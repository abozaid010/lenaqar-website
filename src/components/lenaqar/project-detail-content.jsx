"use client";

import Link from "next/link";
import { useI18n } from "@/hooks/useI18n";
import { formatDate } from "@/lib/units/unit-formatters";
import { buildingTypeAr } from "@/lib/lenaqar/listing-seo";
import { MIN_GROUP_UNITS } from "@/lib/lenaqar/project-summary";
import BuyRequestCta from "./buy-request-cta";
import EgpAmount from "./egp-amount";
import { actionButtonClass } from "@/components/ui/action-button-class";
import ActionButtonArrow from "@/components/ui/action-button-arrow";

const TH = "px-3 py-2 font-bold text-start whitespace-nowrap";
const TD = "px-3 py-2 border-t border-primary/10 text-black/80 align-top whitespace-nowrap";
const ROWS = "mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm";
const ROW = "flex justify-between gap-3";
const CHIP =
  "inline-flex min-h-11 items-center rounded-lg border border-primary/20 bg-white px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary/5";

/** Developer tokens → locale keys; an unknown token is not shown. */
const FINISHING_KEYS = {
  "fully finished": "finishingFull",
  finished: "finishingFull",
  "semi finished": "finishingSemi",
  "semi-finished": "finishingSemi",
  "core and shell": "finishingCore",
  "core & shell": "finishingCore",
  "not finished": "finishingNone",
  furnished: "finishingFurnished",
};

function fill(template, values) {
  return Object.entries(values).reduce(
    (out, [key, value]) => out.replace(`{${key}}`, String(value)),
    String(template || ""),
  );
}

function Section({ id, title, children }) {
  return (
    <section aria-labelledby={id} className="max-w-3xl border-t border-black/10 pt-6">
      <h2 id={id} className="text-xl sm:text-2xl font-bold text-primary">
        {title}
      </h2>
      {children}
    </section>
  );
}

function PriceTable({ rows, firstColumn, translate, caption }) {
  return (
    <div className="mt-4 overflow-x-auto rounded-xl border border-primary/15">
      <table className="min-w-full text-sm text-start">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-primary/[0.06] text-primary">
          <tr>
            {firstColumn.map((column) => (
              <th key={column.key} scope="col" className={TH}>
                {column.label}
              </th>
            ))}
            <th scope="col" className={TH}>{translate("lenaqar.projects.colUnits")}</th>
            <th scope="col" className={TH}>{translate("lenaqar.projects.colMin")}</th>
            <th scope="col" className={TH}>{translate("lenaqar.projects.colMedian")}</th>
            <th scope="col" className={TH}>{translate("lenaqar.projects.colMax")}</th>
            <th scope="col" className={TH}>{translate("lenaqar.projects.colPerMeter")}</th>
            <th scope="col" className={TH}>{translate("lenaqar.projects.colArea")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.type}-${row.rooms ?? "all"}`}>
              {firstColumn.map((column) => (
                <td key={column.key} className={TD}>
                  {column.value(row)}
                </td>
              ))}
              <td className={`${TD} tabular-nums`}>{row.units}</td>
              <td className={TD}><EgpAmount value={row.priceMin} translate={translate} /></td>
              <td className={TD}><EgpAmount value={row.priceMedian} translate={translate} /></td>
              <td className={TD}><EgpAmount value={row.priceMax} translate={translate} /></td>
              <td className={TD}><EgpAmount value={row.perMeterMedian} translate={translate} /></td>
              <td className={`${TD} tabular-nums`}>
                {row.areaMin === row.areaMax ? row.areaMin : `${row.areaMin} – ${row.areaMax}`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Public developer-project page: allowlisted project facts and a unit-price
 * summary. Aggregates only — the props never carry a unit, author or contact.
 */
export default function ProjectDetailContent({
  project,
  labels,
  generatedAt,
  related = [],
  guideLinks = [],
}) {
  const { translate } = useI18n();
  const { summary } = project;
  const name = labels.name;
  const place = [labels.district, labels.city].filter(Boolean).join(" · ");
  const typeLabel = (type) => buildingTypeAr(type) || type;
  const finishing = (project.finishing || [])
    .map((value) => FINISHING_KEYS[value])
    .filter(Boolean)
    .filter((key, index, all) => all.indexOf(key) === index)
    .map((key) => translate(`lenaqar.projects.${key}`));
  const propertyTypes = (project.propertyTypes || []).map(typeLabel);
  const generatedLabel = formatDate(generatedAt, "ar");
  const fromLabel = formatDate(summary.updatedFrom, "ar");
  const toLabel = formatDate(summary.updatedTo, "ar");
  const hasDelivery =
    summary.deliveryYearMin != null || summary.downPaymentMin != null;

  return (
    <div className="container py-10 sm:py-14 pb-24 lg:pb-14 space-y-10">
      <header className="max-w-3xl space-y-4">
        <h1 className="text-3xl sm:text-4xl font-bold text-primary leading-snug">
          {fill(translate("lenaqar.projects.h1"), { name })}
        </h1>
        <p className="text-black/70">
          {[labels.developer, place].filter(Boolean).join(" · ")}
        </p>
        <p className="text-base sm:text-lg text-black/75 leading-relaxed">
          {fill(translate("lenaqar.projects.intro"), { units: summary.units, name })}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <BuyRequestCta
            trackingLocation="project_page_hero"
            variant="primary"
            label={translate("lenaqar.landings.cta")}
            className="!px-6 !py-3.5 !text-base font-bold"
          />
          <Link href="/opportunities" className={actionButtonClass({ variant: "secondary" })}>
            {translate("lenaqar.projects.opportunitiesLink")}
            <ActionButtonArrow />
          </Link>
        </div>
      </header>

      <Section id="project-summary" title={translate("lenaqar.projects.summaryTitle")}>
        <dl className={ROWS}>
          <div className={ROW}>
            <dt className="text-black/60">{translate("lenaqar.projects.units")}</dt>
            <dd className="tabular-nums">{summary.units}</dd>
          </div>
          <div className={ROW}>
            <dt className="text-black/60">{translate("lenaqar.projects.priceMin")}</dt>
            <dd><EgpAmount value={summary.priceMin} translate={translate} /></dd>
          </div>
          <div className={ROW}>
            <dt className="text-black/60">{translate("lenaqar.projects.priceMedian")}</dt>
            <dd><EgpAmount value={summary.priceMedian} translate={translate} /></dd>
          </div>
          <div className={ROW}>
            <dt className="text-black/60">{translate("lenaqar.projects.priceMax")}</dt>
            <dd><EgpAmount value={summary.priceMax} translate={translate} /></dd>
          </div>
          <div className={ROW}>
            <dt className="text-black/60">{translate("lenaqar.projects.perMeterMedian")}</dt>
            <dd><EgpAmount value={summary.perMeterMedian} translate={translate} /></dd>
          </div>
          <div className={ROW}>
            <dt className="text-black/60">{translate("lenaqar.projects.areas")}</dt>
            <dd className="tabular-nums">
              {summary.areaMin === summary.areaMax
                ? summary.areaMin
                : `${summary.areaMin} – ${summary.areaMax}`}{" "}
              {translate("lenaqar.projects.meter")}
            </dd>
          </div>
        </dl>
      </Section>

      {summary.byType.length > 0 ? (
        <Section id="project-by-type" title={translate("lenaqar.projects.byTypeTitle")}>
          <PriceTable
            rows={summary.byType}
            translate={translate}
            caption={translate("lenaqar.projects.byTypeTitle")}
            firstColumn={[
              {
                key: "type",
                label: translate("lenaqar.projects.colType"),
                value: (row) => typeLabel(row.type),
              },
            ]}
          />
        </Section>
      ) : null}

      {summary.byRooms.length > 0 ? (
        <Section id="project-by-rooms" title={translate("lenaqar.projects.byRoomsTitle")}>
          <PriceTable
            rows={summary.byRooms}
            translate={translate}
            caption={translate("lenaqar.projects.byRoomsTitle")}
            firstColumn={[
              {
                key: "type",
                label: translate("lenaqar.projects.colType"),
                value: (row) => typeLabel(row.type),
              },
              {
                key: "rooms",
                label: translate("lenaqar.projects.colRooms"),
                value: (row) => row.rooms,
              },
            ]}
          />
        </Section>
      ) : null}

      {hasDelivery ? (
        <Section id="project-delivery" title={translate("lenaqar.projects.deliveryTitle")}>
          <dl className={ROWS}>
            {summary.deliveryYearMin != null ? (
              <div className={ROW}>
                <dt className="text-black/60">{translate("lenaqar.projects.deliveryYears")}</dt>
                <dd className="tabular-nums">
                  {summary.deliveryYearMin === summary.deliveryYearMax
                    ? summary.deliveryYearMin
                    : `${summary.deliveryYearMin} – ${summary.deliveryYearMax}`}
                </dd>
              </div>
            ) : null}
            {summary.downPaymentMin != null ? (
              <div className={ROW}>
                <dt className="text-black/60">{translate("lenaqar.projects.downPaymentMin")}</dt>
                <dd><EgpAmount value={summary.downPaymentMin} translate={translate} /></dd>
              </div>
            ) : null}
            {summary.downPaymentMedian != null ? (
              <div className={ROW}>
                <dt className="text-black/60">{translate("lenaqar.projects.downPaymentMedian")}</dt>
                <dd><EgpAmount value={summary.downPaymentMedian} translate={translate} /></dd>
              </div>
            ) : null}
          </dl>
        </Section>
      ) : null}

      <Section id="project-about" title={translate("lenaqar.projects.aboutTitle")}>
        <dl className={ROWS}>
          {labels.developer ? (
            <div className={ROW}>
              <dt className="text-black/60">{translate("lenaqar.projects.developer")}</dt>
              <dd>{labels.developer}</dd>
            </div>
          ) : null}
          {place ? (
            <div className={ROW}>
              <dt className="text-black/60">{translate("lenaqar.projects.location")}</dt>
              <dd>{place}</dd>
            </div>
          ) : null}
          {finishing.length > 0 ? (
            <div className={ROW}>
              <dt className="text-black/60">{translate("lenaqar.projects.finishing")}</dt>
              <dd>{finishing.join("، ")}</dd>
            </div>
          ) : null}
          {propertyTypes.length > 0 ? (
            <div className={ROW}>
              <dt className="text-black/60">{translate("lenaqar.projects.propertyTypes")}</dt>
              <dd>{propertyTypes.join("، ")}</dd>
            </div>
          ) : null}
        </dl>
      </Section>

      <Section id="project-method" title={translate("lenaqar.projects.methodTitle")}>
        <p className="mt-3 text-sm leading-relaxed text-black/80">
          {fill(translate("lenaqar.projects.method"), {
            units: summary.units,
            minGroup: MIN_GROUP_UNITS,
          })}
        </p>
        {fromLabel && toLabel && generatedLabel ? (
          <p className="mt-2 text-sm text-black/70">
            <time dateTime={summary.updatedTo}>
              {fill(translate("lenaqar.projects.methodDates"), {
                from: fromLabel,
                to: toLabel,
                generated: generatedLabel,
              })}
            </time>
          </p>
        ) : null}
        <p className="mt-2 text-sm text-black/70">
          {translate("lenaqar.projects.disclaimer")}
        </p>
      </Section>

      {guideLinks.length > 0 ? (
        <Section id="project-guides" title={translate("lenaqar.projects.guidesTitle")}>
          <ul className="mt-3 flex flex-wrap gap-3">
            {guideLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={CHIP}>
                  {link.title}
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <Section
        id="project-related"
        title={
          related.length > 0 && labels.city
            ? fill(translate("lenaqar.projects.relatedTitle"), { city: labels.city })
            : translate("lenaqar.projects.allProjects")
        }
      >
        <ul className="mt-3 flex flex-wrap gap-3">
          {related.map((other) => (
            <li key={other.slug}>
              <Link href={`/projects/${other.slug}`} className={CHIP}>
                {other.name}
              </Link>
            </li>
          ))}
          <li>
            <Link href="/projects" className={CHIP}>
              {translate("lenaqar.projects.allProjects")}
            </Link>
          </li>
        </ul>
      </Section>
    </div>
  );
}
