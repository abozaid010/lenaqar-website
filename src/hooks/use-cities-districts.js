"use client";

import { useState, useEffect, useCallback } from "react";
import { useI18n } from "@/context/translate-api";
import CityManager from "@/utils/city_manager";

/**
 * React hook for accessing cities and districts data
 * Provides reactive access with locale support
 */
export function useCitiesDistricts() {
  const { locale } = useI18n();
  const manager = CityManager.getInstance();

  const getCities = useCallback(async () => {
    const cities = await manager.getCities();
    return cities.map(city => city.value);
  }, []);

  const getDistricts = useCallback(
    async (city) => {
      const cityObj = await manager.getCityById(city);
      if (!cityObj) return [];
      const districts = await manager.getDistrictsForCity(cityObj.id);
      return districts.map(district => district.value);
    },
    []
  );

  const getCityLabel = useCallback(
    async (city) => {
      return await manager.getCityLabel(city, locale);
    },
    [locale]
  );

  const getDistrictLabel = useCallback(
    async (district, city) => {
      return await manager.getDistrictLabel(district, city, locale);
    },
    [locale]
  );

  const getAllCitiesWithLabels = useCallback(async () => {
    return await manager.getCitiesWithLabels(locale);
  }, [locale]);

  const getDistrictsWithLabels = useCallback(
    async (city) => {
      const cityObj = await manager.getCityById(city);
      if (!cityObj) return [];
      return await manager.getDistrictsWithLabels(cityObj.id, locale);
    },
    [locale]
  );

  return {
    getCities,
    getDistricts,
    getCityLabel,
    getDistrictLabel,
    getAllCitiesWithLabels,
    getDistrictsWithLabels,
  };
}
