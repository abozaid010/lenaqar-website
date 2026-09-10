"use client";

import { useI18n } from "@/hooks/useI18n";
import { ANALYTICS } from "@/constants/analytics";
import { addUnitForRequirementHref } from "@/lib/lenaqar/whatsapp";
import { buildingTypeAr, placeAr } from "@/lib/lenaqar/listing-seo";
import EgpAmount from "./egp-amount";
import WhatsAppCta from "./whatsapp-cta";

function deliveryLabel(value, translate) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const key = `lenaqar.marketplace.delivery.${raw}`;
  const labeled = translate(key, "");
  if (labeled && labeled !== key) return labeled;
  if (/^\d{4}-\d{2}/.test(raw)) return raw.slice(0, 7);
  return raw.replace(/_/g, " ");
}

function locationLine(requirement) {
  const loc = requirement?.locations?.[0];
  if (!loc) return "";
  return [
    placeAr(loc.project) || loc.project,
    placeAr(loc.subDistrict) || loc.subDistrict,
    placeAr(loc.district),
  ]
    .filter(Boolean)
    .join(" · ");
}

export default function RequirementCard({ requirement }) {
  const { translate } = useI18n();
  if (!requirement) return null;

  const typeLabel =
    buildingTypeAr(requirement.propertyTypes?.[0]) ||
    requirement.propertyTypes?.[0] ||
    null;
  const location = locationLine(requirement);
  const delivery = deliveryLabel(requirement.deliveryDate, translate);
  const whatsappHref = addUnitForRequirementHref(requirement);
  const notes = String(requirement.notes || "").trim();

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-primary/10 bg-white p-5 shadow-[0_10px_40px_-24px_rgba(3,2,80,0.45)]">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800">
          {translate("lenaqar.marketplace.intent.buy")}
        </span>
        {typeLabel ? (
          <span className="inline-flex rounded-md bg-primary/5 px-2.5 py-1 text-xs font-semibold text-primary">
            {typeLabel}
          </span>
        ) : null}
      </div>

      <div>
        <h3 className="text-lg font-bold leading-snug text-primary">
          {location || translate("lenaqar.marketplace.card.locationFallback")}
        </h3>
        <ul className="mt-3 space-y-1.5 text-sm text-black/75">
          {requirement.roomsCount > 0 ? (
            <li>
              {translate("lenaqar.marketplace.card.rooms", "{count} غرف").replace(
                "{count}",
                String(requirement.roomsCount),
              )}
            </li>
          ) : null}
          {requirement.maxPrice || requirement.minPrice ? (
            <li className="flex flex-wrap items-baseline gap-1">
              <span>{translate("lenaqar.marketplace.card.budget")}</span>
              {requirement.minPrice && requirement.maxPrice ? (
                <>
                  <EgpAmount value={requirement.minPrice} translate={translate} />
                  <span>—</span>
                  <EgpAmount value={requirement.maxPrice} translate={translate} />
                </>
              ) : (
                <>
                  <span>{translate("lenaqar.marketplace.card.upTo")}</span>
                  <EgpAmount
                    value={requirement.maxPrice || requirement.minPrice}
                    translate={translate}
                  />
                </>
              )}
            </li>
          ) : null}
          {requirement.downPayment ? (
            <li className="flex flex-wrap items-baseline gap-1">
              <span>{translate("lenaqar.marketplace.card.downPayment")}</span>
              <EgpAmount value={requirement.downPayment} translate={translate} />
            </li>
          ) : null}
          {requirement.monthlyInstallment ? (
            <li className="flex flex-wrap items-baseline gap-1">
              <span>{translate("lenaqar.marketplace.card.monthly")}</span>
              <EgpAmount
                value={requirement.monthlyInstallment}
                translate={translate}
              />
            </li>
          ) : null}
          {delivery ? (
            <li>
              {translate("lenaqar.marketplace.card.delivery")}: {delivery}
            </li>
          ) : null}
          {requirement.developer ? (
            <li>
              {translate("lenaqar.marketplace.card.developer")}:{" "}
              {requirement.developer}
            </li>
          ) : null}
        </ul>
        {notes ? (
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-black/70">
            <span className="font-semibold text-primary/80">
              {translate("lenaqar.marketplace.card.notes")}:{" "}
            </span>
            {notes}
          </p>
        ) : null}
      </div>

      <div className="mt-auto pt-1">
        <WhatsAppCta
          href={whatsappHref}
          eventName={ANALYTICS.EVENTS.MARKETPLACE_WHATSAPP_CLICKED}
          className="w-full !text-sm"
        >
          {translate("lenaqar.marketplace.card.whatsapp")}
        </WhatsAppCta>
      </div>
    </article>
  );
}
