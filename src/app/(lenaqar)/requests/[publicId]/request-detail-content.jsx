"use client";

import Link from "next/link";
import { useI18n } from "@/hooks/useI18n";
import RequirementCard from "@/components/lenaqar/requirement-card";

export default function RequestDetailContent({ requirement }) {
  const { translate } = useI18n();
  return (
    <div className="container py-8 sm:py-12">
      <div className="mx-auto max-w-xl">
        <Link
          href="/#lq-requests-title"
          className="text-sm font-semibold text-primary/80 hover:text-primary"
        >
          {translate("lenaqar.requestPage.backToRequests")}
        </Link>
        <p className="mt-5 text-xs font-bold text-emerald-800">
          {translate("lenaqar.requestPage.eyebrow")}
        </p>
        <h1 className="lq-display mt-1 text-2xl font-bold text-primary sm:text-3xl">
          {translate("lenaqar.requestPage.heading")}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-black/70">
          {translate("lenaqar.requestPage.intro")}
        </p>
        <div className="mt-6">
          <RequirementCard requirement={requirement} />
        </div>
      </div>
    </div>
  );
}
