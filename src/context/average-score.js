"use client";

import React, { useContext, useState } from "react";

const defaultValues = {
  averageScore: null,
  setAverageScore: () => {},
  loading: false,
  setLoading: () => {},
};

const AverageScoreContext = React.createContext(defaultValues);

export function AverageScoreProvider({ children }) {
  const [averageScore, setAverageScore] = useState(null);
  const [loading, setLoading] = useState(false);

  return (
    <AverageScoreContext.Provider
      value={{ averageScore, setAverageScore, loading, setLoading }}
    >
      {children}
    </AverageScoreContext.Provider>
  );
}

export function useAverageScore() {
  return useContext(AverageScoreContext);
}
