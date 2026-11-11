"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createRequirementFeedLoader } from "@/lib/lenaqar/requirement-feed-client";
import { REQUIREMENT_SORTS } from "@/lib/lenaqar/requirement-sort";
import { useI18n } from "@/hooks/useI18n";
import { formatPhoneForWhatsApp } from "@/utils/phone-utils";
import { LENAQAR_CONTACT } from "@/config/lenaqar-contact";
import HomeOnboarding from "./home-onboarding";
import RequirementCard from "./requirement-card";
import { actionButtonClass } from "@/components/ui/action-button-class";
import ActionButtonArrow from "@/components/ui/action-button-arrow";

const VISIBLE_REQUESTS = 6;

/**
 * Buyer-first homepage: cinematic onboarding that ends on the request
 * composer, then real (anonymised) requests from other buyers below it.
 */
export default function StorytellingHomepage({
  requirements = [],
  error = null,
}) {
  const { translate, direction } = useI18n();
  const [sort, setSort] = useState("default");
  const [feed, setFeed] = useState({ requirements, error, loading: false });
  const [loader] = useState(() =>
    createRequirementFeedLoader({
      onStart: () => setFeed({ requirements: [], error: null, loading: true }),
      onSuccess: (rows) =>
        setFeed({ requirements: rows, error: null, loading: false }),
      onError: (feedError) =>
        setFeed({ requirements: [], error: feedError, loading: false }),
    })
  );
  useEffect(() => () => loader.cancel(), [loader]);
  const displayRequests = feed.requirements.slice(0, VISIBLE_REQUESTS);

  return (
    <>
      <noscript>
        <div className="container py-16 text-center">
          <p className="text-2xl font-bold text-primary">
            {translate("lenaqar.onboarding.tagline")}
          </p>
          <p className="mt-4 text-lg text-black/70">
            {translate("lenaqar.onboarding.whoLine2")}
          </p>
          <a
            href={formatPhoneForWhatsApp(LENAQAR_CONTACT.whatsappE164)}
            className="mt-6 inline-block rounded-lg bg-primary px-6 py-3 font-semibold text-white"
          >
            {translate("lenaqar.onboarding.noscript")}
          </a>
        </div>
      </noscript>

      <HomeOnboarding />

      <section
        aria-labelledby="lq-requests-title"
        className="border-t border-primary/10 bg-primary/[0.025] pt-6 pb-12 sm:pt-8 sm:pb-16"
      >
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <h2
              id="lq-requests-title"
              className="lq-display text-xl font-bold text-primary sm:text-2xl"
            >
              {translate("lenaqar.onboarding.requestsTitle")}
            </h2>
            <p className="mt-1 text-sm text-black/60 sm:text-base">
              {translate("lenaqar.onboarding.requestsSub")}
            </p>
            <div
              className="mt-4 flex flex-wrap items-center justify-center gap-2"
              dir={direction}
            >
              <label
                htmlFor="lq-requests-sort"
                className="text-sm font-medium text-primary"
              >
                {translate("lenaqar.onboarding.requestsSort.label")}
              </label>
              <select
                id="lq-requests-sort"
                value={sort}
                aria-controls="lq-requests-feed"
                onChange={(event) => {
                  const value = event.target.value;
                  setSort(value);
                  void loader.load(value);
                }}
                className="max-w-full rounded-lg border border-primary/20 bg-white px-3 py-2 text-sm text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {REQUIREMENT_SORTS.map((value) => (
                  <option key={value} value={value}>
                    {translate(`lenaqar.onboarding.requestsSort.${value}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div id="lq-requests-feed" aria-busy={feed.loading}>
            {feed.loading ? (
              <p
                role="status"
                className="mt-8 text-center text-sm text-primary"
              >
                {translate("lenaqar.onboarding.requestsSort.loading")}
              </p>
            ) : feed.error ? (
              <div
                role="status"
                className="mx-auto mt-8 max-w-xl rounded-2xl border border-amber-200 bg-amber-50 p-5 text-center"
              >
                <p className="font-semibold text-amber-950">
                  {translate("lenaqar.marketplace.list.errorTitle")}
                </p>
                <p className="mt-1 text-sm text-amber-900/80">
                  {translate("lenaqar.marketplace.list.error")}
                </p>
                <button
                  type="button"
                  onClick={() => void loader.load(sort)}
                  className="mt-3 rounded-lg border border-amber-300 px-4 py-2 text-sm font-semibold text-amber-950 focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  {translate("lenaqar.onboarding.requestsSort.retry")}
                </button>
              </div>
            ) : displayRequests.length === 0 ? (
              <div
                role="status"
                className="mx-auto mt-8 max-w-xl rounded-2xl border border-primary/10 bg-white p-6 text-center"
              >
                <p className="font-semibold text-primary">
                  {translate("lenaqar.storytelling.requests.empty")}
                </p>
              </div>
            ) : (
              <>
                <div className="-mb-4 mt-5 columns-1 gap-4 md:columns-2 xl:columns-3">
                  {displayRequests.map((requirement) => (
                    <RequirementCard
                      key={requirement.id}
                      requirement={requirement}
                    />
                  ))}
                </div>
                <div className="mt-10 text-center">
                  <Link
                    href="/opportunities"
                    className={actionButtonClass({ variant: "secondary" })}
                  >
                    {translate("lenaqar.storytelling.requests.seeAll")}
                    <ActionButtonArrow />
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
