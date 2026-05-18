"use client";

import AgenciesEcosystem from "@/components/web/solutions/agencies/AgenciesEcosystem";
import AgenciesFinalCta from "@/components/web/solutions/agencies/AgenciesFinalCta";
import AgenciesPartnerOffers from "@/components/web/solutions/agencies/AgenciesPartnerOffers";
import AgenciesWhoWeAre from "@/components/web/solutions/agencies/AgenciesWhoWeAre";
import AgenciesClients from "@/components/web/solutions/agencies/AgenciesClients";
import AgenciesVideo from "@/components/web/solutions/agencies/AgenciesVideo";

export default function AgenciesPageContent() {
  return (
    <main className="min-h-screen bg-white">
      <AgenciesWhoWeAre />
      <AgenciesPartnerOffers />
      <AgenciesEcosystem />
      <AgenciesClients />
      <AgenciesVideo />
      <AgenciesFinalCta />
    </main>
  );
}
