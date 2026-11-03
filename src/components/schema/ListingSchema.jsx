import { serializeJsonLd } from "@/lib/lenaqar/json-ld";
import { buildListingSchema } from "@/lib/lenaqar/listing-seo";

/** RealEstateListing JSON-LD for a public LenaQar opportunity page. */
export default function ListingSchema({ unit, url }) {
  const schema = buildListingSchema(unit, url);
  if (!schema) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
    />
  );
}
