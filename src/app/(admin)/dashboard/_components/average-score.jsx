"use client";

import { useAverageScore } from "@/context/average-score";
import { useI18n } from "@/context/translate-api";
import { Loader2 } from "lucide-react";

export default function AverageScore() {
  const { t } = useI18n();
  const { averageScore } = useAverageScore();

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-gray-700">
        {t.dashboard.title.averageScore}:
      </span>
      {averageScore === null ? (
        <Loader2 size={22} className="animate-spin text-primary" />
      ) : (
        <span className="text-lg font-bold text-primary">
          {averageScore.toFixed(2)} %
        </span>
      )}
    </div>
  );
}
