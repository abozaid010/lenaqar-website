"use client";

import { useEffect, useState } from "react";

export function useAverageScore() {
  const [averageScore, setAverageScore] = useState(null);

  useEffect(() => {
    // Get initial value
    const stored = localStorage.getItem("averageScore");
    setAverageScore(stored ? parseFloat(stored) : null);

    // Listen for storage changes
    const handleStorageChange = (e) => {
      if (e.key === "averageScore") {
        setAverageScore(e.newValue ? parseFloat(e.newValue) : null);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return averageScore;
}
