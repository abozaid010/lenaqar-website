import SoftwareApplicationSchema from "./SoftwareApplicationSchema";

export default function HomePageSchema() {
  // Organization, LocalBusiness, and WebSite schemas are already in root layout
  // Only add SoftwareApplication schema here for the home page
  return <SoftwareApplicationSchema />;
}
