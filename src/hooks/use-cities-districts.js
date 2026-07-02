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
      // city is the lowercase value (e.g., "cairo", "mostaqbal city")
      const cityObj = await manager.getCityByValue(city);
      if (!cityObj) return [];
      const districts = await manager.getDistrictsForCity(cityObj.id);
      return districts.map(district => district.value);
    },
    []
  );

  const getCityLabel = useCallback(
    async (city) => {
      // city might be lowercase value or city ID
      const cityObj = await manager.getCityByValue(city);
      if (!cityObj) {
        // If not found, try using it as city ID directly
        return await manager.getCityLabel(city, locale);
      }
      return await manager.getCityLabel(cityObj.id, locale);
    },
    [locale]
  );

  const getDistrictLabel = useCallback(
    async (district, city) => {
      const cityObj = await manager.getCityByValue(city);
      const cityRef = cityObj ? cityObj.value : city;
      return await manager.getDistrictLabel(district, cityRef, locale);
    },
    [locale]
  );

  const getSubDistrictLabel = useCallback(
    async (subDistrict, city, district) => {
      const cityObj = await manager.getCityByValue(city);
      const cityRef = cityObj ? cityObj.value : city;
      return await manager.getSubDistrictLabel(subDistrict, cityRef, district, locale);
    },
    [locale]
  );

  const getAllCitiesWithLabels = useCallback(async () => {
    return await manager.getCitiesWithLabels(locale);
  }, [locale]);

  const getDistrictsWithLabels = useCallback(
    async (city) => {
      // city is the lowercase value (e.g., "cairo", "mostaqbal city")
      if (!city) {
        return [];
      }
      
      const cityObj = await manager.getCityByValue(city);
      if (!cityObj) {
        console.warn(`City not found for districts: "${city}"`);
        return [];
      }
      
      return await manager.getDistrictsWithLabels(cityObj.id, locale);
    },
    [locale]
  );

  const getAllDistrictsWithLabels = useCallback(async () => {
    return await manager.getDistrictsWithLabels(null, locale);
  }, [locale]);

  const getSubDistrictsWithLabels = useCallback(
    async (city, district) => {
      if (!city || !district) return [];
      const cityObj = await manager.getCityByValue(city);
      if (!cityObj) {
        console.warn(`City not found for sub-districts: "${city}"`);
        return [];
      }
      return await manager.getSubDistrictsWithLabels(
        cityObj.id,
        String(district).toLowerCase().trim(),
        locale
      );
    },
    [locale]
  );

  return {
    getCities,
    getDistricts,
    getCityLabel,
    getDistrictLabel,
    getSubDistrictLabel,
    getAllCitiesWithLabels,
    getDistrictsWithLabels,
    getAllDistrictsWithLabels,
    getSubDistrictsWithLabels,
  };
}
