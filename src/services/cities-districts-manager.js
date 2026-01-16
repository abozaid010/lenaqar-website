"use client";

import { axiosInstance } from "@/lib/axiosInstance";
import { CITIES_DISTRICTS_TRANSLATIONS, capitalizeWords } from "@/data/cities-districts-translations";

const CACHE_KEY = "lenaai_cities_districts_cache";
const CACHE_TIMESTAMP_KEY = "lenaai_cities_districts_cache_timestamp";

/**
 * Singleton class to manage cities and districts data
 * - Loads data once from API
 * - Caches in memory and localStorage
 * - Provides formatted labels with translations
 */
class CitiesAndDistrictsManager {
  constructor() {
    this.data = null;
    this.isLoading = false;
    this.error = null;
    this.loadPromise = null;
  }

  /**
   * Get singleton instance
   */
  static getInstance() {
    if (!CitiesAndDistrictsManager.instance) {
      CitiesAndDistrictsManager.instance = new CitiesAndDistrictsManager();
    }
    return CitiesAndDistrictsManager.instance;
  }

  /**
   * Load data from cache or API
   */
  async load() {
    // If already loading, return the existing promise
    if (this.loadPromise) {
      return this.loadPromise;
    }

    // If data already loaded, return immediately
    if (this.data) {
      return this.data;
    }

    // Check localStorage cache
    if (typeof window !== "undefined") {
      try {
        const cachedData = localStorage.getItem(CACHE_KEY);
        const cacheTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
        
        if (cachedData && cacheTimestamp) {
          const data = JSON.parse(cachedData);
          this.data = data;
          return this.data;
        }
      } catch (error) {
        console.warn("Failed to load from localStorage cache:", error);
      }
    }

    // Load from API
    this.isLoading = true;
    this.error = null;

    this.loadPromise = this.fetchFromAPI()
      .then((data) => {
        this.data = data;
        this.isLoading = false;
        this.loadPromise = null;
        return data;
      })
      .catch((error) => {
        this.error = error;
        this.isLoading = false;
        this.loadPromise = null;
        throw error;
      });

    return this.loadPromise;
  }

  /**
   * Fetch data from API
   */
  async fetchFromAPI() {
    try {
      const response = await axiosInstance.get("/projects/cities-and-districts");

      if (!response.data || !response.data.data) {
        throw new Error("Invalid response format from server: missing response.data.data");
      }

      const data = response.data.data;

      // Store in localStorage
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(data));
          localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
        } catch (error) {
          console.warn("Failed to save to localStorage cache:", error);
        }
      }

      return data;
    } catch (error) {
      console.error("Failed to fetch cities and districts:", error.message);
      throw error;
    }
  }

  /**
   * Get all cities (lowercase English for API)
   */
  getCities() {
    if (!this.data || !this.data.cities) {
      return [];
    }
    return this.data.cities;
  }

  /**
   * Get districts for a city (lowercase English for API)
   */
  getDistricts(city) {
    if (!this.data || !city) {
      return [];
    }
    const cityKey = city.toLowerCase();
    return this.data[cityKey] || [];
  }

  /**
   * Get city label with translation and capitalization
   */
  getCityLabel(city, locale = "en") {
    if (!city) return "";

    const cityKey = city.toLowerCase();
    const translation = CITIES_DISTRICTS_TRANSLATIONS.cities[cityKey];

    if (translation) {
      return locale === "ar" ? translation.ar_label : translation.en_label;
    }

    // Log error for missing translation
    console.error(
      `[CitiesAndDistrictsManager] Missing translation for city: "${cityKey}" (locale: ${locale}). ` +
      `Please add translation to cities-districts-translations.js. ` +
      `Showing key as fallback: "${city}"`
    );

    // Fallback: return capitalized key
    return capitalizeWords(city);
  }

  /**
   * Get district label with translation and capitalization
   */
  getDistrictLabel(district, city, locale = "en") {
    if (!district) return "";

    const cityKey = city?.toLowerCase() || "";
    const districtKey = district.toLowerCase();
    const translation =
      CITIES_DISTRICTS_TRANSLATIONS.districts[cityKey]?.[districtKey];

    if (translation) {
      return locale === "ar" ? translation.ar_label : translation.en_label;
    }

    // Log error for missing translation
    console.error(
      `[CitiesAndDistrictsManager] Missing translation for district: "${districtKey}" in city: "${cityKey}" (locale: ${locale}). ` +
      `Please add translation to cities-districts-translations.js. ` +
      `Showing key as fallback: "${district}"`
    );

    // Fallback: return capitalized key
    return capitalizeWords(district);
  }

  /**
   * Get all cities with formatted labels for UI
   */
  getAllCitiesWithLabels(locale = "en") {
    const cities = this.getCities();
    return cities.map((city) => ({
      value: city, // lowercase for API
      label: this.getCityLabel(city, locale), // formatted for UI
    }));
  }

  /**
   * Get districts for a city with formatted labels for UI
   */
  getDistrictsWithLabels(city, locale = "en") {
    const districts = this.getDistricts(city);
    return districts.map((district) => ({
      value: district, // lowercase for API
      label: this.getDistrictLabel(district, city, locale), // formatted for UI
    }));
  }

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  clearCache() {
    this.data = null;
    this.loadPromise = null;
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(CACHE_KEY);
        localStorage.removeItem(CACHE_TIMESTAMP_KEY);
      } catch (error) {
        console.warn("Failed to clear localStorage cache:", error);
      }
    }
  }

  /**
   * Force refresh from API
   */
  async refresh() {
    this.clearCache();
    return this.load();
  }
}

export default CitiesAndDistrictsManager;
