"use client";

import { useI18n } from "@/context/translate-api";
import { useAverageScore } from "@/hooks/useAverageScore";

export default function AverageScore() {
  const { t } = useI18n();
  const averageScore = useAverageScore();

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-gray-700">
        {t.dashboard.title.averageScore}:
      </span>
      <span className="text-lg font-bold text-primary">
        {averageScore !== null ? averageScore.toFixed(2) : "N/A"}
      </span>
    </div>
  );
}
