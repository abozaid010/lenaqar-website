import { serializeJsonLd } from "@/lib/lenaqar/json-ld";
import { buildProjectSchema } from "@/lib/lenaqar/project-summary";

/** WebPage + AggregateOffer JSON-LD for a public developer-project page. */
export default function ProjectSchema(props) {
  const schema = buildProjectSchema(props);
  if (!schema) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
    />
  );
}
