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

export default function AboutLenaSection() {
  const { translate } = useI18n();

  return (
    <section className="py-20 md:py-24 bg-white overflow-hidden">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <FadeIn>
            <h2 className="text-3xl md:text-4xl font-bold text-primary leading-tight">
              {translate("solutions.shared.about.title")}
            </h2>
            <p className="mt-6 text-lg text-slate-600 leading-relaxed">
              {translate("solutions.shared.about.description")}
            </p>
          </FadeIn>
          <FadeIn delay={0.15}>
            <div className="relative rounded-3xl bg-gradient-to-br from-slate-50 to-blue-50/80 border border-slate-200/80 p-8 md:p-10">
              <div
                className="absolute inset-0 rounded-3xl opacity-30"
                aria-hidden
                style={{
                  background:
                    "radial-gradient(circle at 50% 50%, rgba(3,2,80,0.08), transparent 70%)",
                }}
              />
              <FadeInStagger className="relative grid grid-cols-2 sm:grid-cols-3 gap-4">
                {ECOSYSTEM_NODES.map((node) => {
                  const Icon = ICON_MAP[node.icon] || LayoutDashboard;
                  return (
                    <FadeInItem key={node.labelKey}>
                      <div className="flex flex-col items-center text-center gap-3 rounded-2xl bg-white/80 backdrop-blur border border-white shadow-md p-5 hover:shadow-lg transition-shadow">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Icon className="h-6 w-6" aria-hidden />
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
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
