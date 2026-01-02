"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchNews } from "@/utils/api";
import { useI18n } from "@/context/translate-api";
import { Calendar, ExternalLink, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";

const NewsFeed = () => {
  const { t, locale } = useI18n();

  const {
    data: news,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["news"],
    queryFn: fetchNews,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-gray-600">{t.loading || "Loading news..."}</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
          <p className="text-red-600 font-semibold mb-2">
            {t.error || "Error loading news"}
          </p>
          <p className="text-red-500 text-sm">
            {error?.message || "Please try again later"}
          </p>
        </div>
      </div>
    );
  }

  if (!news || news.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] p-4">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 max-w-md text-center">
          <p className="text-gray-600 text-lg">
            {t.noNews || "No news available at the moment"}
          </p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return "";
    
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, {
        addSuffix: true,
        locale: locale === "ar" ? ar : enUS,
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t.sidebar?.news || "News"}
        </h1>
        <p className="text-gray-600">
          {t.newsSubtitle || "Latest real estate news and updates"}
        </p>
      </div>

      <div className="space-y-4">
        {news.map((item, index) => (
          <article
            key={index}
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden border border-gray-200"
          >
            <div className="p-6">
              {/* Title */}
              <h2 className="text-xl font-semibold text-gray-900 mb-3 leading-tight">
                {item.title}
              </h2>

              {/* Description */}
              <p className="text-gray-700 mb-4 leading-relaxed line-clamp-3">
                {item.desc}
              </p>

              {/* Footer */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100">
                {/* Date */}
                <div className="flex items-center text-gray-500 text-sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  <time dateTime={item.created_at}>
                    {formatDate(item.created_at)}
                  </time>
                </div>

                {/* Source Link */}
                {item.source_url && (
                  <a
                    href={item.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-primary hover:text-primary-dark font-medium text-sm transition-colors group"
                  >
                    <span>{t.readMore || "Read more"}</span>
                    <ExternalLink className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </a>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default NewsFeed;

