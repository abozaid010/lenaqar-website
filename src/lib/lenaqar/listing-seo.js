import ar from "../../../public/locales/ar.js";
import { formatEgpNumber } from "./metrics.js";

/**
 * Arabic display strings for a public listing: H1, <title>, meta description.
 *
 * Every clause is dropped when its field is absent — no placeholder text and no
 * derived claims. The listing gate guarantees `totalPrice > 0`; everything else
 * is optional in the payload and therefore optional in the copy.
 *
 * Reuses the CRM's `property.buildingTypes` dictionary rather than a second one.
 */

const BUILDING_TYPES_AR = ar?.property?.buildingTypes ?? {};

/**
 * The API sends city and district as lowercase English tokens. Only the Egyptian
 * places the public feed actually returns are mapped, and anything unmapped falls
 * through to the raw value rather than being guessed at.
 *
 * Project names are deliberately absent: `project` values like "madinaty b14"
 * carry phase codes that cannot be transliterated safely. Those need `project_ar`
 * from the API, not a lookup table here.
 */
const PLACES_AR = {
  // Cities
  cairo: "القاهرة",
  giza: "الجيزة",
  alexandria: "الإسكندرية",
  "north coast": "الساحل الشمالي",
  "ain sokhna": "العين السخنة",
  "ras el hekma": "رأس الحكمة",
  "new administrative capital": "العاصمة الإدارية الجديدة",
  matrouh: "مطروح",
  "red sea": "البحر الأحمر",
  suez: "السويس",
  mansoura: "المنصورة",
  // Districts
  "new cairo": "القاهرة الجديدة",
  "noor city": "مدينة نور",
  "el shorouk city": "مدينة الشروق",
  "el alamein": "العلمين",
  "el dabaa": "الضبعة",
  haram: "الهرم",
  hammam: "الحمام",
  "sheikh zayed": "الشيخ زايد",
  "6th of october": "السادس من أكتوبر",
  "sixth of october": "السادس من أكتوبر",
  maadi: "المعادي",
  "nasr city": "مدينة نصر",
  "sheraton": "شيراتون",
  "mostakbal city": "مدينة المستقبل",
  "badya": "بادية",
};

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

function toPositive(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Arabic building type, falling back to the raw token when unmapped. */
export function buildingTypeAr(buildingType) {
  const raw = clean(buildingType);
  if (!raw) return "";
  return BUILDING_TYPES_AR[raw.toLowerCase()] || raw;
}

/** Arabic place name (city or district), falling back to the raw token. */
export function placeAr(place) {
  const raw = clean(place);
  if (!raw) return "";
  return PLACES_AR[raw.toLowerCase()] || raw;
}

/** Arabic room counts follow singular / dual / plural, not a single form. */
export function roomsLabelAr(roomsCount) {
  const n = toPositive(roomsCount);
  if (n == null) return "";
  if (n === 1) return "غرفة واحدة";
  if (n === 2) return "غرفتين";
  if (n <= 10) return `${n} غرف`;
  return `${n} غرفة`;
}

/** Project name as the API sends it — `projectAr` when present, never translated. */
export function projectLabel(unit) {
  return clean(unit?.projectAr) || clean(unit?.project) || "";
}

export function developerLabel(unit) {
  return clean(unit?.developerAr) || clean(unit?.developer) || "";
}

/**
 * H1 / title text: "شقة 3 غرف للبيع في مدينتي — 145 م²".
 * Falls back to the project name, then the code, so it is never empty.
 */
export function buildListingHeadline(unit) {
  if (!unit) return "";

  const type = buildingTypeAr(unit.buildingType);
  const rooms = roomsLabelAr(unit.roomsCount);
  const project = projectLabel(unit);
  const area = toPositive(unit.landArea);

  const subject = [type, rooms].filter(Boolean).join(" ");
  if (!subject) return project || clean(unit.code);

  const head = project ? `${subject} للبيع في ${project}` : `${subject} للبيع`;
  return area ? `${head} — ${area} م²` : head;
}

/**
 * Meta description: location, size, then the cash actually required and the
 * plan that follows it. Mirrors what the page itself shows.
 */
export function buildListingDescription(unit) {
  if (!unit) return "";

  const type = buildingTypeAr(unit.buildingType) || "وحدة";
  const rooms = roomsLabelAr(unit.roomsCount);
  const project = projectLabel(unit);
  const city = placeAr(unit.city);
  const district = placeAr(unit.district);
  const area = toPositive(unit.landArea);
  const cash = toPositive(unit.downPayment);
  const deliveryYear = toPositive(unit.deliveryYear);

  const place = [project, district, city].filter(Boolean).join("، ");

  const opening = [type, rooms].filter(Boolean).join(" ");
  const first = place
    ? `${opening} للبيع في ${place}`
    : `${opening} للبيع`;

  const sentences = [area ? `${first}، مساحة ${area} م².` : `${first}.`];

  if (cash) {
    const tail = deliveryYear
      ? ` والباقي أقساط على المطور حتى ${deliveryYear}.`
      : " والباقي أقساط على المطور.";
    sentences.push(`الكاش المطلوب دلوقتي ${formatEgpNumber(cash)} ج.م${tail}`);
  }

  sentences.push("السعر من المطور بتاريخه.");
  return sentences.join(" ");
}

/**
 * schema.org RealEstateListing wrapping an Accommodation.
 *
 * Only allowlisted, API-sourced fields are emitted. `downPayment` is exposed as
 * an `additionalProperty` rather than the offer price, because the offer price
 * is the unit's total price — conflating the two would misstate the listing.
 */
export function buildListingSchema(unit, url) {
  if (!unit) return null;

  const name = buildListingHeadline(unit);
  const type = buildingTypeAr(unit.buildingType);
  const rooms = toPositive(unit.roomsCount);
  const bathrooms = toPositive(unit.bathroomCount);
  const area = toPositive(unit.landArea);
  const totalPrice = toPositive(unit.totalPrice);
  const cash = toPositive(unit.downPayment);
  const city = placeAr(unit.city);
  const district = placeAr(unit.district);
  const developer = developerLabel(unit);
  const images = (unit.images || [])
    .map((image) => clean(image?.url))
    .filter(Boolean);

  const accommodation = {
    "@type": "Accommodation",
    name,
    ...(type && { accommodationCategory: type }),
    ...(rooms != null && { numberOfRooms: rooms }),
    ...(bathrooms != null && {
      numberOfBathroomsTotal: bathrooms,
    }),
    ...(area != null && {
      floorSize: { "@type": "QuantitativeValue", value: area, unitCode: "MTK" },
    }),
    ...((city || district) && {
      address: {
        "@type": "PostalAddress",
        ...(district && { addressLocality: district }),
        ...(city && { addressRegion: city }),
        addressCountry: "EG",
      },
    }),
  };

  const additionalProperty = [];
  if (cash != null) {
    additionalProperty.push({
      "@type": "PropertyValue",
      name: "الكاش المطلوب دلوقتي",
      value: cash,
      unitText: "EGP",
    });
  }
  if (toPositive(unit.remainingAmount) != null) {
    additionalProperty.push({
      "@type": "PropertyValue",
      name: "المتبقي",
      value: toPositive(unit.remainingAmount),
      unitText: "EGP",
    });
  }
  if (toPositive(unit.installmentYears) != null) {
    additionalProperty.push({
      "@type": "PropertyValue",
      name: "مدة الأقساط",
      value: toPositive(unit.installmentYears),
      unitText: "ANN",
    });
  }
  if (toPositive(unit.deliveryYear) != null) {
    additionalProperty.push({
      "@type": "PropertyValue",
      name: "سنة الاستلام",
      value: toPositive(unit.deliveryYear),
    });
  }

  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    url,
    name,
    description: buildListingDescription(unit),
    ...(unit.updatedAt && { datePosted: unit.updatedAt }),
    ...(images.length > 0 && { image: images }),
    ...(additionalProperty.length > 0 && { additionalProperty }),
    mainEntity: accommodation,
    ...(totalPrice != null && {
      offers: {
        "@type": "Offer",
        price: totalPrice,
        priceCurrency: "EGP",
        availability: "https://schema.org/InStock",
        url,
        ...(developer && {
          seller: { "@type": "Organization", name: developer },
        }),
      },
    }),
  };
}
