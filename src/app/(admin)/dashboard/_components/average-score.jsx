"use client";

import { useAverageScore } from "@/context/average-score";
import { useI18n } from "@/context/translate-api";
import { Loader2 } from "lucide-react";

export default function AverageScore() {
  const { t } = useI18n();
  const { averageScore, loading } = useAverageScore();

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-gray-700">
        {t.dashboard.title.averageScore}:
      </span>
      {loading ? (
        <Loader2 size={22} className="animate-spin text-primary" />
      ) : (
        <>
          {averageScore === null ? (
            <span className="text-lg font-bold text-gray-500">N/A</span>
          ) : (
            <span className="text-lg font-bold text-primary">
              {averageScore.toFixed(2)} %
            </span>
          )}
        </>
      )}
    </div>
  );
}
