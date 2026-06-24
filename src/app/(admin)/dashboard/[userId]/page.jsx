import BreadcrumbSchema from "@/components/schema/BreadcrumbSchema";
import { SearchParamsWrapper } from "@/components/ui/searchParamsWrapper";
import { SITE_URL } from "../../../metadata";
import LeadDetailPageClient from "./_components/LeadDetailPageClient";

export default async function LeadDetailPage({ params }) {
  const { userId } = await params;

  return (
    <>
      <BreadcrumbSchema
        items={[
          {
            name: "Dashboard",
            url: `${SITE_URL}/dashboard`,
          },
          {
            name: "Lead",
            url: `${SITE_URL}/dashboard/${userId}`,
          },
        ]}
      />
      <div className="h-full flex flex-col">
        <SearchParamsWrapper>
          <LeadDetailPageClient userId={userId} />
        </SearchParamsWrapper>
      </div>
    </>
  );
}
