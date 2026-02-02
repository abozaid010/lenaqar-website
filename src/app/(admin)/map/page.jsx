import { SITE_URL } from "../../metadata";
import BreadcrumbSchema from "@/components/schema/BreadcrumbSchema";
import MapView from "./_components/map-view";

export const metadata = {
  title: "Projects Map - Real Estate Projects by Location | LENAAI AI Sales Agent",
  description:
    "View all real estate projects on an interactive map. See project locations, unit summaries, and developer information.",
  keywords: [
    "real estate map",
    "property locations",
    "project map",
    "real estate Egypt",
  ],
  openGraph: {
    title: "Projects Map | LENAAI",
    description:
      "View all real estate projects on an interactive map with location details.",
    url: `${SITE_URL}/map`,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Projects Map | LENAAI",
    description: "Interactive map of real estate projects",
  },
  alternates: {
    canonical: `${SITE_URL}/map`,
  },
};

export default function MapPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          {
            name: "Map",
            url: `${SITE_URL}/map`,
          },
        ]}
      />
      <MapView />
    </>
  );
}
