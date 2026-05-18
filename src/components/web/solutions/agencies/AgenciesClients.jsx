"use client";

import { AGENCY_CLIENTS } from "@/content/solutions/clients";
import { FadeIn, FadeInItem, FadeInStagger } from "@/components/web/solutions/ui/FadeIn";
import { useI18n } from "@/hooks/useI18n";
import Image from "next/image";

export default function AgenciesClients() {
  const { translate } = useI18n();

  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="container">
        <FadeIn className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-primary">
            {translate("solutions.agencies.landing.clients.title")}
          </h2>
        </FadeIn>
        <FadeInStagger className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8 md:gap-10 max-w-5xl mx-auto">
          {AGENCY_CLIENTS.map((client) => (
            <FadeInItem key={client.nameKey}>
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 rounded-full overflow-hidden border-2 border-slate-200 bg-slate-100 shadow-md ring-4 ring-slate-50 aspect-square">
                  <Image
                    src={client.image}
                    alt={translate(client.nameKey)}
                    fill
                    className="object-cover object-center scale-110"
                    sizes="(max-width: 640px) 80px, 96px"
                  />
                </div>
                <span className="text-sm font-semibold text-slate-800 leading-snug px-1">
                  {translate(client.nameKey)}
                </span>
              </div>
            </FadeInItem>
          ))}
        </FadeInStagger>
      </div>
    </section>
  );
}
