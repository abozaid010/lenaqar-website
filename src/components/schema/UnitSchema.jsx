import { SITE_URL } from "@/app/metadata";

export default function UnitSchema({ unit, isPublic = false }) {
  if (!unit) return null;

  const id = unit.unitId ?? unit.id;
  if (!id) return null;

  const baseUrl = isPublic
    ? `${SITE_URL}/allProberties/${id}`
    : `${SITE_URL}/units/${id}`;

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
      price: String(unit.price ?? unit.totalPrice ?? "0"),
      priceCurrency: "EGP",
      availability: unit.isAvailable
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

