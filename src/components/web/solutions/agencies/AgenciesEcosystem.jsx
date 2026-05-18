"use client";

import { ECOSYSTEM_NODES } from "@/content/solutions/shared";
import { FadeIn, FadeInItem, FadeInStagger } from "@/components/web/solutions/ui/FadeIn";
import { useI18n } from "@/hooks/useI18n";
import {
  BarChart3,
  Building2,
  LayoutDashboard,
  MessageSquare,
  Megaphone,
  Users,
} from "lucide-react";

const ICON_MAP = {
  crm: LayoutDashboard,
  whatsapp: MessageSquare,
  campaigns: Megaphone,
  analytics: BarChart3,
  inventory: Building2,
  teams: Users,
};

export default function AgenciesEcosystem() {
  const { translate } = useI18n();

  return (
    <section className="py-16 md:py-20 bg-slate-50">
      <div className="container">
        <FadeIn className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-primary">
            {translate("solutions.agencies.simple.ecosystem.title")}
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            {translate("solutions.agencies.simple.ecosystem.subtitle")}
          </p>
        </FadeIn>
        <FadeInStagger className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 max-w-5xl mx-auto">
          {ECOSYSTEM_NODES.map((node) => {
            const Icon = ICON_MAP[node.icon] || LayoutDashboard;
            return (
              <FadeInItem key={node.labelKey}>
                <div className="flex flex-col items-center text-center gap-3 rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <span className="text-sm font-semibold text-slate-800">
                    {translate(node.labelKey)}
                  </span>
                </div>
              </FadeInItem>
            );
          })}
        </FadeInStagger>
      </div>
    </section>
  );
}
