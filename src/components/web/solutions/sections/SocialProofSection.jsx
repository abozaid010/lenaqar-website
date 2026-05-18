"use client";

import { CLIENT_LOGOS } from "@/content/solutions/shared";
import { FadeIn, FadeInItem, FadeInStagger } from "@/components/web/solutions/ui/FadeIn";
import { useI18n } from "@/hooks/useI18n";

export default function SocialProofSection() {
  const { translate } = useI18n();

  return (
    <section className="py-20 md:py-24 bg-slate-50">
      <div className="container">
        <FadeIn className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-primary">
            {translate("solutions.shared.socialProof.clientsTitle")}
          </h2>
        </FadeIn>
        <FadeInStagger className="flex flex-wrap justify-center gap-6 mb-16">
          {CLIENT_LOGOS.map((client) => (
            <FadeInItem key={client.nameKey}>
              <div className="flex items-center justify-center min-w-[200px] px-8 py-6 rounded-2xl bg-white border border-slate-200 shadow-md">
                <span className="text-lg font-bold text-primary tracking-tight">
                  {translate(client.nameKey)}
                </span>
              </div>
            </FadeInItem>
          ))}
        </FadeInStagger>
        <FadeIn className="text-center">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-6">
            {translate("solutions.shared.socialProof.partnersTitle")}
          </h3>
          <div className="inline-flex items-center justify-center px-10 py-5 rounded-2xl border-2 border-dashed border-slate-300 bg-white/50">
            <span className="text-slate-500 font-medium">
              {translate("solutions.shared.socialProof.comingSoon")}
            </span>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
