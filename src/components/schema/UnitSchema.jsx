import { SITE_URL } from "@/app/metadata";
import { buildPublicUnitShareUrl } from "@/lib/units/unit-share-links";
import { isRentVisibilityAvailable } from "@/constants/property-visibility";
import {
  isRentPurpose,
  resolveMonthlyRentPrice,
  resolveSaleTotalPrice,
} from "@/lib/units/unit-price";

export default function UnitSchema({ unit, isPublic = false }) {
  if (!unit) return null;

  const code = unit.code ?? unit.referenceCode;
  if (!code?.trim()) return null;

  const baseUrl = isPublic
    ? buildPublicUnitShareUrl(code)
    : `${SITE_URL}/units/${encodeURIComponent(code.trim())}`;

  const offerPrice = isRentPurpose(unit.purpose)
    ? resolveMonthlyRentPrice(unit)
    : resolveSaleTotalPrice(unit);

  const schema = {
    "@context": "https://schema.org",
    "@type": "Residence",
    name: `${unit.type || t?.schema?.property || "Property"} - ${unit.area ?? ""} sqm`,
    floorSize: {
      "@type": "QuantitativeValue",
      value: unit.area ?? 0,
      unitCode: "MTK",
    },
    numberOfRooms: unit.rooms ?? unit.bedrooms ?? unit.roomsCount ?? 0,
    url: baseUrl,
    ...(unit.image && {
      image: Array.isArray(unit.image)
        ? unit.image[0]
        : unit.image,
    }),
    offers: {
      "@type": "Offer",
      price: String(offerPrice ?? "0"),
      priceCurrency: "EGP",
      availability: isRentVisibilityAvailable(unit.visibility ?? unit.status)
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

