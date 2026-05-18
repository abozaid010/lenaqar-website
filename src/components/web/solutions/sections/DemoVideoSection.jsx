"use client";

import { FadeIn } from "@/components/web/solutions/ui/FadeIn";
import { useI18n } from "@/hooks/useI18n";
import { Play } from "lucide-react";

export default function DemoVideoSection() {
  const { translate } = useI18n();

  return (
    <section id="demo-video" className="py-20 md:py-24 bg-white">
      <div className="container">
        <FadeIn className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-primary">
            {translate("solutions.shared.video.title")}
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            {translate("solutions.shared.video.subtitle")}
          </p>
        </FadeIn>
        <FadeIn>
          <div className="relative mx-auto max-w-4xl rounded-2xl overflow-hidden shadow-2xl shadow-primary/15 border border-slate-200 aspect-video bg-gradient-to-br from-primary via-[#1a1878] to-[#3926A7]">
            <div
              className="absolute inset-0 opacity-20"
              aria-hidden
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
                backgroundSize: "32px 32px",
              }}
            />
            <button
              type="button"
              className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-white group"
              aria-label={translate("solutions.shared.video.play")}
              disabled
            >
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-md border border-white/30 group-hover:scale-105 transition-transform">
                <Play className="h-10 w-10 ms-1" fill="currentColor" aria-hidden />
              </span>
              <span className="text-sm font-medium text-white/80">
                {translate("solutions.shared.video.comingSoon")}
              </span>
            </button>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
