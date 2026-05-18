"use client";

import { AGENCIES_YOUTUBE_EMBED_URL } from "@/content/solutions/clients";
import { lk } from "@/content/solutions/landingConfig";
import { FadeIn } from "@/components/web/solutions/ui/FadeIn";
import { useI18n } from "@/hooks/useI18n";

export default function AudienceVideo({ audience }) {
  const { translate } = useI18n();

  return (
    <section className="py-16 md:py-20 bg-slate-50">
      <div className="container">
        <FadeIn className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-primary">
            {translate(lk(audience, "video.title"))}
          </h2>
        </FadeIn>
        <FadeIn>
          <div className="mx-auto max-w-sm rounded-2xl overflow-hidden shadow-xl border border-slate-200 bg-black aspect-[9/16]">
            <iframe
              src={AGENCIES_YOUTUBE_EMBED_URL}
              title={translate(lk(audience, "video.title"))}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="h-full w-full"
            />
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
