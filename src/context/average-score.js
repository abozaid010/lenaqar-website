"use client";

import React, { useContext, useState } from "react";

const defaultValues = {
  averageScore: null,
  setAverageScore: () => {},
};

const AverageScoreContext = React.createContext(defaultValues);

export function AverageScoreProvider({ children }) {
  const [averageScore, setAverageScore] = useState(null);

  return (
    <AverageScoreContext.Provider value={{ averageScore, setAverageScore }}>
      {children}
    </AverageScoreContext.Provider>
  );
}

export function useAverageScore() {
  return useContext(AverageScoreContext);
}
