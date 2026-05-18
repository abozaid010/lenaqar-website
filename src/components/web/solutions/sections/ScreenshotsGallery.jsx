"use client";

import { SCREENSHOT_ITEMS } from "@/content/solutions/shared";
import { FadeIn } from "@/components/web/solutions/ui/FadeIn";
import { useI18n } from "@/hooks/useI18n";
import Image from "next/image";

export default function ScreenshotsGallery() {
  const { translate } = useI18n();

  return (
    <section id="screenshots" className="py-20 md:py-24 bg-slate-50">
      <div className="container">
        <FadeIn className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-primary">
            {translate("solutions.shared.screenshots.title")}
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            {translate("solutions.shared.screenshots.subtitle")}
          </p>
        </FadeIn>
        <div className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin md:grid md:grid-cols-2 lg:grid-cols-4 md:overflow-visible md:pb-0">
          {SCREENSHOT_ITEMS.map((item, index) => (
            <FadeIn
              key={item.labelKey}
              delay={index * 0.05}
              className="min-w-[280px] md:min-w-0 snap-center"
            >
              <div className="group rounded-2xl border border-slate-200/80 bg-white shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className="relative aspect-[4/3] bg-gradient-to-br from-primary/5 via-slate-100 to-blue-50">
                  <Image
                    src={item.image}
                    alt={translate(item.labelKey)}
                    fill
                    className="object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                    sizes="(max-width: 768px) 280px, 25vw"
                  />
                </div>
                <p className="px-4 py-3 text-sm font-semibold text-slate-800 text-center">
                  {translate(item.labelKey)}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
