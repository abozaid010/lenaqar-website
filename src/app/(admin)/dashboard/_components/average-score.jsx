"use client";
import { useAverageScore } from "@/hooks/useAverageScore";

export default function AverageScore() {
  const averageScore = useAverageScore();

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-gray-700">Average Score:</span>
      <span className="text-lg font-bold text-primary">
        {averageScore !== null ? averageScore.toFixed(2) : "N/A"}
      </span>
    </div>
  );
}
