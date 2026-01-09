"use client";

import { useState, useEffect, useCallback } from "react";
import { useI18n } from "@/context/translate-api";
import CitiesAndDistrictsManager from "@/services/cities-districts-manager";

/**
 * React hook for accessing cities and districts data
 * Provides reactive access with loading states and locale support
 */
export function useCitiesDistricts() {
  const { locale } = useI18n();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const manager = CitiesAndDistrictsManager.getInstance();

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const loadedData = await manager.load();
        if (isMounted) {
          setData(loadedData);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err);
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const getCities = useCallback(() => {
    return manager.getCities();
  }, []);

  const getDistricts = useCallback(
    (city) => {
      return manager.getDistricts(city);
    },
    []
  );

  const getCityLabel = useCallback(
    (city) => {
      return manager.getCityLabel(city, locale);
    },
    [locale]
  );

  const getDistrictLabel = useCallback(
    (district, city) => {
      return manager.getDistrictLabel(district, city, locale);
    },
    [locale]
  );

  const getAllCitiesWithLabels = useCallback(() => {
    return manager.getAllCitiesWithLabels(locale);
  }, [locale]);

  const getDistrictsWithLabels = useCallback(
    (city) => {
      return manager.getDistrictsWithLabels(city, locale);
    },
    [locale]
  );

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const refreshedData = await manager.refresh();
      setData(refreshedData);
      setIsLoading(false);
    } catch (err) {
      setError(err);
      setIsLoading(false);
      throw err;
    }
  }, []);

  return {
    data,
    isLoading,
    error,
    getCities,
    getDistricts,
    getCityLabel,
    getDistrictLabel,
    getAllCitiesWithLabels,
    getDistrictsWithLabels,
    refresh,
  };
}
