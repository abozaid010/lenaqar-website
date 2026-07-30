"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { LenaCookiesManager } from "@/lib/LenaCookiesManager";
import {
  mergeBrokerUnitIds,
  readBrokerUnitIds,
} from "@/lib/units/broker-units-session";

const BrokerUnitsBadgeContext = createContext(null);

/**
 * Shares "Mark broker units" badge ids between UnitsFilter (detect) and UnitsGrid (badges).
 * Scoped to the admin units page — optional elsewhere.
 */
export function BrokerUnitsBadgeProvider({ children }) {
  const [brokerUnitIds, setBrokerUnitIds] = useState(() => new Set());

  useEffect(() => {
    setBrokerUnitIds(readBrokerUnitIds(LenaCookiesManager.getClientId()));
  }, []);

  const mergeDetectedBrokerIds = useCallback((ids) => {
    const merged = mergeBrokerUnitIds(ids, LenaCookiesManager.getClientId());
    setBrokerUnitIds(new Set(merged));
    return merged;
  }, []);

  const value = useMemo(
    () => ({
      brokerUnitIds,
      mergeDetectedBrokerIds,
    }),
    [brokerUnitIds, mergeDetectedBrokerIds]
  );

  return (
    <BrokerUnitsBadgeContext.Provider value={value}>
      {children}
    </BrokerUnitsBadgeContext.Provider>
  );
}

/** @returns {{ brokerUnitIds: Set<string>, mergeDetectedBrokerIds: (ids: Iterable<string>) => Set<string> } | null} */
export function useBrokerUnitsBadgeOptional() {
  return useContext(BrokerUnitsBadgeContext);
}
