/**
 * Singleton class to manage cities and districts data.
 * Sole source: GET /api/locations/catalog (market-index, server-cached).
 * Session cache: sessionStorage (one fetch per browser tab session).
 */
import { LOCATIONS_CATALOG_STORAGE_KEY } from "@/lib/locations/constants";

class CityManager {
  constructor() {
    this.cities = [];
    this.districts = [];
    this.subDistricts = [];
    this.isInitialized = false;
    this.isLoading = false;
    this.loadPromise = null;
    this.source = null;
  }

  /**
   * Get singleton instance
   */
  static getInstance() {
    if (!CityManager.instance) {
      CityManager.instance = new CityManager();
    }
    return CityManager.instance;
  }

  /** Drop in-memory state so the next read reloads from session/API. */
  reset() {
    this.cities = [];
    this.districts = [];
    this.subDistricts = [];
    this.isInitialized = false;
    this.isLoading = false;
    this.loadPromise = null;
    this.source = null;
  }

  readSessionCatalog() {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.sessionStorage.getItem(LOCATIONS_CATALOG_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.cities) || parsed.cities.length === 0) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  writeSessionCatalog(catalog) {
    if (typeof window === "undefined" || !catalog) return;
    try {
      window.sessionStorage.setItem(
        LOCATIONS_CATALOG_STORAGE_KEY,
        JSON.stringify({
          cities: catalog.cities,
          fetchedAt: catalog.fetchedAt || new Date().toISOString(),
          source: catalog.source || "market-index",
        })
      );
    } catch {
      // private mode / quota — memory cache still works for this page lifetime
    }
  }

  /**
   * Hydrate flat cities / districts / subDistricts from the catalog tree.
   * @param {object[]} citiesListData
   * @param {string} source
   */
  applyCitiesList(citiesListData, source) {
    this.cities = citiesListData.map((city) => ({
      id: city.id,
      en_name: city.en_name,
      ar_name: city.ar_name,
      value: city.en_name.toLowerCase(),
      label_en: city.en_name,
      label_ar: city.ar_name,
      aliases: city.alias || city.aliases || [],
      location_id: city.location_id || null,
    }));

    this.districts = [];
    this.subDistricts = [];
    citiesListData.forEach((city) => {
      if (city.districts && Array.isArray(city.districts)) {
        city.districts.forEach((district) => {
          const districtValue = district.en_name.toLowerCase();
          this.districts.push({
            id:
              city.id +
              "_" +
              district.en_name.toLowerCase().replace(/\s+/g, "_"),
            en_name: district.en_name,
            ar_name: district.ar_name,
            city_id: city.id,
            city_en_name: city.en_name,
            city_ar_name: city.ar_name,
            value: districtValue,
            label_en: district.en_name,
            label_ar: district.ar_name,
            aliases: district.aliases || [],
          });

          if (district.sub_districts && Array.isArray(district.sub_districts)) {
            district.sub_districts.forEach((sub) => {
              if (!sub?.en_name) return;
              this.subDistricts.push({
                id:
                  city.id +
                  "_" +
                  district.en_name.toLowerCase().replace(/\s+/g, "_") +
                  "_" +
                  sub.en_name.toLowerCase().replace(/\s+/g, "_"),
                en_name: sub.en_name,
                ar_name: sub.ar_name,
                city_id: city.id,
                district_value: districtValue,
                city_en_name: city.en_name,
                city_ar_name: city.ar_name,
                value: sub.en_name.toLowerCase(),
                label_en: sub.en_name,
                label_ar: sub.ar_name,
                aliases: sub.aliases || [],
              });
            });
          }
        });
      }
    });

    this.source = source;
    this.isInitialized = true;
  }

  async fetchCatalogFromApi(maxAttempts = 3) {
    let lastError;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      try {
        const response = await fetch("/api/locations/catalog", {
          credentials: "include",
          headers: { Accept: "application/json" },
        });
        if (!response.ok) {
          const err = new Error(`Locations catalog HTTP ${response.status}`);
          err.status = response.status;
          throw err;
        }
        const catalog = await response.json();
        if (!catalog || !Array.isArray(catalog.cities) || catalog.cities.length === 0) {
          throw new Error("Invalid locations catalog payload");
        }
        return catalog;
      } catch (error) {
        lastError = error;
        if (attempt < maxAttempts - 1) {
          await new Promise((resolve) =>
            setTimeout(resolve, Math.min(1000 * 2 ** attempt, 8000)),
          );
        }
      }
    }
    throw lastError;
  }

  /**
   * Initialize from session cache → API catalog.
   * Concurrent callers share one in-flight promise.
   */
  async initializeData() {
    if (this.isInitialized) return this;
    if (this.loadPromise) return this.loadPromise;

    this.isLoading = true;
    this.loadPromise = (async () => {
      try {
        const sessionCatalog = this.readSessionCatalog();
        if (sessionCatalog) {
          this.applyCitiesList(
            sessionCatalog.cities,
            sessionCatalog.source || "session"
          );
          return this;
        }

        const catalog = await this.fetchCatalogFromApi();
        this.applyCitiesList(catalog.cities, catalog.source || "market-index");
        this.writeSessionCatalog(catalog);
        return this;
      } catch (error) {
        console.error(
          "Failed to initialize CityManager data:",
          error?.message ?? error
        );
        this.cities = [];
        this.districts = [];
        this.subDistricts = [];
        throw error;
      } finally {
        this.isLoading = false;
        this.loadPromise = null;
      }
    })();

    return this.loadPromise;
  }

  /**
   * Get all cities (async - ensures data is loaded)
   */
  async getCities() {
    await this.initializeData();
    return this.cities;
  }

  /**
   * Get all districts (async - ensures data is loaded)
   */
  async getDistricts() {
    await this.initializeData();
    return this.districts;
  }

  /**
   * Get all sub-districts (async - ensures data is loaded)
   */
  async getSubDistricts() {
    await this.initializeData();
    return this.subDistricts;
  }

  /**
   * Get districts for a specific city (async - ensures data is loaded)
   */
  async getDistrictsForCity(cityId) {
    await this.initializeData();
    return this.districts.filter((district) => district.city_id === cityId);
  }

  /**
   * Get sub-districts for a given city + district value (lowercase)
   */
  async getSubDistrictsForCityDistrict(cityId, districtValue) {
    await this.initializeData();
    if (!cityId || !districtValue) return [];
    const normalizedDistrict = String(districtValue).toLowerCase().trim();
    return this.subDistricts.filter(
      (sd) => sd.city_id === cityId && sd.district_value === normalizedDistrict
    );
  }

  /**
   * Get city by ID (async - ensures data is loaded)
   */
  async getCityById(cityId) {
    await this.initializeData();
    return this.cities.find((city) => city.id === cityId);
  }

  /**
   * Get city by value (lowercase) or ID (async - ensures data is loaded)
   */
  async getCityByValue(cityValue) {
    await this.initializeData();
    if (!cityValue) return null;

    const normalizedValue = String(cityValue).toLowerCase().trim();
    return this.cities.find(
      (city) =>
        city.value === normalizedValue ||
        city.value === cityValue ||
        city.id === cityValue ||
        city.id.toLowerCase() === normalizedValue ||
        city.en_name.toLowerCase() === normalizedValue ||
        city.ar_name === cityValue ||
        (city.aliases || []).some(
          (alias) => String(alias).toLowerCase() === normalizedValue
        )
    );
  }

  /**
   * Get district by name and city (async - ensures data is loaded)
   */
  async getDistrictByName(districtName, cityId) {
    await this.initializeData();
    if (!districtName || !cityId) return null;
    return this.resolveDistrict(districtName, cityId);
  }

  /**
   * Resolve a district from API/form raw value (value, id, en/ar name, or alias).
   */
  resolveDistrict(districtRaw, cityRaw) {
    if (!districtRaw || !cityRaw) return null;

    const city =
      this.cities.find(
        (c) =>
          c.id === cityRaw ||
          c.value === String(cityRaw).toLowerCase().trim() ||
          c.id.toLowerCase() === String(cityRaw).toLowerCase().trim()
      ) || null;
    if (!city) return null;

    const normalized = String(districtRaw).toLowerCase().trim();
    return (
      this.districts.find((district) => {
        if (district.city_id !== city.id) return false;
        return (
          district.value === normalized ||
          district.id === districtRaw ||
          district.id.toLowerCase() === normalized ||
          district.en_name.toLowerCase() === normalized ||
          district.ar_name === districtRaw ||
          (district.aliases || []).some(
            (alias) => alias.toLowerCase() === normalized
          )
        );
      }) || null
    );
  }

  /**
   * Normalize city raw value to canonical backend value (lowercase en_name).
   */
  normalizeCityValue(cityRaw) {
    if (!cityRaw) return "";
    const normalized = String(cityRaw).toLowerCase().trim();
    const city = this.cities.find(
      (c) =>
        c.id === cityRaw ||
        c.value === normalized ||
        c.id.toLowerCase() === normalized ||
        c.en_name.toLowerCase() === normalized ||
        c.ar_name === cityRaw ||
        (c.aliases || []).some(
          (alias) => String(alias).toLowerCase() === normalized
        )
    );
    if (!city) return String(cityRaw).trim().toLowerCase();
    return city.value;
  }

  /**
   * Resolve a sub-district within a city when district is unknown or mismatched.
   */
  resolveSubDistrictInCity(subRaw, cityRaw) {
    if (!subRaw || !cityRaw) return null;

    const city =
      this.cities.find(
        (c) =>
          c.id === cityRaw ||
          c.value === String(cityRaw).toLowerCase().trim() ||
          c.id.toLowerCase() === String(cityRaw).toLowerCase().trim()
      ) || null;
    if (!city) return null;

    const normalized = String(subRaw).toLowerCase().trim();
    return (
      this.subDistricts.find((sub) => {
        if (sub.city_id !== city.id) return false;
        return (
          sub.value === normalized ||
          sub.id === subRaw ||
          sub.id.toLowerCase() === normalized ||
          sub.en_name.toLowerCase() === normalized ||
          sub.ar_name === subRaw ||
          (sub.aliases || []).some(
            (alias) => alias.toLowerCase() === normalized
          )
        );
      }) || null
    );
  }

  /**
   * Resolve a sub-district from API/form raw value (value, en/ar name, or alias).
   */
  resolveSubDistrict(subRaw, cityRaw, districtRaw) {
    if (!subRaw || !cityRaw || !districtRaw) return null;

    const city =
      this.cities.find(
        (c) =>
          c.id === cityRaw ||
          c.value === String(cityRaw).toLowerCase().trim() ||
          c.id.toLowerCase() === String(cityRaw).toLowerCase().trim()
      ) || null;
    if (!city) return null;

    const district = this.resolveDistrict(districtRaw, city.id);
    if (!district) return null;

    const normalized = String(subRaw).toLowerCase().trim();
    return (
      this.subDistricts.find((sub) => {
        if (sub.city_id !== city.id || sub.district_value !== district.value) {
          return false;
        }
        return (
          sub.value === normalized ||
          sub.id === subRaw ||
          sub.id.toLowerCase() === normalized ||
          sub.en_name.toLowerCase() === normalized ||
          sub.ar_name === subRaw ||
          (sub.aliases || []).some(
            (alias) => alias.toLowerCase() === normalized
          )
        );
      }) || null
    );
  }

  /**
   * Normalize district raw value to canonical backend value (lowercase en_name).
   */
  normalizeDistrictValue(districtRaw, cityRaw) {
    if (!districtRaw || !cityRaw) return "";
    const district = this.resolveDistrict(districtRaw, cityRaw);
    if (!district) return String(districtRaw).trim().toLowerCase();
    return district.value;
  }

  /**
   * Normalize sub-district raw value to canonical backend value (lowercase en_name).
   */
  normalizeSubDistrictValue(subRaw, cityRaw, districtRaw) {
    if (!subRaw || !cityRaw) return "";
    let sub = districtRaw
      ? this.resolveSubDistrict(subRaw, cityRaw, districtRaw)
      : null;
    if (!sub) sub = this.resolveSubDistrictInCity(subRaw, cityRaw);
    if (!sub) return String(subRaw).trim().toLowerCase();
    return sub.value;
  }

  /**
   * Match a district raw value against known districts (any city).
   */
  matchDistrictsByRaw(districtRaw) {
    if (!districtRaw) return [];
    const normalized = String(districtRaw).toLowerCase().trim();
    return this.districts.filter(
      (district) =>
        district.value === normalized ||
        district.id === districtRaw ||
        district.id.toLowerCase() === normalized ||
        district.en_name.toLowerCase() === normalized ||
        district.ar_name === districtRaw ||
        (district.aliases || []).some(
          (alias) => alias.toLowerCase() === normalized
        )
    );
  }

  /**
   * Match a sub-district raw value against known sub-districts (any city/district).
   */
  matchSubDistrictsByRaw(subRaw) {
    if (!subRaw) return [];
    const normalized = String(subRaw).toLowerCase().trim();
    return this.subDistricts.filter(
      (sub) =>
        sub.value === normalized ||
        sub.id === subRaw ||
        sub.id.toLowerCase() === normalized ||
        sub.en_name.toLowerCase() === normalized ||
        sub.ar_name === subRaw ||
        (sub.aliases || []).some((alias) => alias.toLowerCase() === normalized)
    );
  }

  /**
   * Resolve the full location hierarchy from any subset of city/district/sub_district.
   * Fills missing parents when a unique match exists in the cities list.
   */
  resolveLocationHierarchy({
    city = "",
    district = "",
    sub_district = "",
  } = {}) {
    let resolvedCity = city ? this.normalizeCityValue(city) : "";
    let resolvedDistrict = "";
    let resolvedSub = "";

    if (district && resolvedCity) {
      resolvedDistrict = this.normalizeDistrictValue(district, resolvedCity);
    } else if (district && !resolvedCity) {
      const matches = this.matchDistrictsByRaw(district);
      if (matches.length === 1) {
        const cityObj = this.cities.find((c) => c.id === matches[0].city_id);
        resolvedCity = cityObj?.value || "";
        resolvedDistrict = matches[0].value;
      } else if (matches.length > 1) {
        resolvedDistrict = String(district).toLowerCase().trim();
      } else {
        resolvedDistrict = String(district).toLowerCase().trim();
      }
    }

    if (sub_district) {
      if (resolvedCity) {
        let sub = resolvedDistrict
          ? this.resolveSubDistrict(sub_district, resolvedCity, resolvedDistrict)
          : null;
        if (!sub) sub = this.resolveSubDistrictInCity(sub_district, resolvedCity);
        if (sub) {
          resolvedSub = sub.value;
          if (!resolvedDistrict) resolvedDistrict = sub.district_value;
        } else {
          resolvedSub = String(sub_district).toLowerCase().trim();
        }
      } else {
        const matches = this.matchSubDistrictsByRaw(sub_district);
        if (matches.length === 1) {
          const cityObj = this.cities.find((c) => c.id === matches[0].city_id);
          resolvedCity = cityObj?.value || "";
          resolvedDistrict = matches[0].district_value;
          resolvedSub = matches[0].value;
        } else {
          resolvedSub = String(sub_district).toLowerCase().trim();
        }
      }
    }

    if (district && resolvedCity && !resolvedDistrict) {
      resolvedDistrict = this.normalizeDistrictValue(district, resolvedCity);
    }

    return {
      city: resolvedCity || "",
      district: resolvedDistrict || "",
      sub_district: resolvedSub || "",
    };
  }

  /**
   * Async wrappers for normalization (ensures data is loaded).
   */
  async normalizeCityValueAsync(cityRaw) {
    await this.initializeData();
    return this.normalizeCityValue(cityRaw);
  }

  async normalizeDistrictValueAsync(districtRaw, cityRaw) {
    await this.initializeData();
    return this.normalizeDistrictValue(districtRaw, cityRaw);
  }

  async normalizeSubDistrictValueAsync(subRaw, cityRaw, districtRaw) {
    await this.initializeData();
    return this.normalizeSubDistrictValue(subRaw, cityRaw, districtRaw);
  }

  async resolveLocationHierarchyAsync(location = {}) {
    await this.initializeData();
    return this.resolveLocationHierarchy(location);
  }

  /**
   * Get formatted cities list for UI (with translations)
   */
  async getCitiesWithLabels(locale = "en") {
    const cities = await this.getCities();
    return cities.map((city) => ({
      value: city.value,
      label: locale === "ar" ? city.label_ar : city.label_en,
      id: city.id,
    }));
  }

  /**
   * Get formatted districts list for UI (with translations)
   */
  async getDistrictsWithLabels(cityId = null, locale = "en") {
    const districts = cityId
      ? await this.getDistrictsForCity(cityId)
      : await this.getDistricts();
    return districts.map((district) => ({
      value: district.value,
      label: locale === "ar" ? district.label_ar : district.label_en,
      city_id: district.city_id,
      city_name:
        locale === "ar" ? district.city_ar_name : district.city_en_name,
      id: district.id,
    }));
  }

  /**
   * Get formatted sub-districts list for UI (with translations)
   */
  async getSubDistrictsWithLabels(cityId, districtValue, locale = "en") {
    if (!cityId || !districtValue) return [];
    const subs = await this.getSubDistrictsForCityDistrict(
      cityId,
      districtValue
    );
    return subs.map((sd) => ({
      value: sd.value,
      label: locale === "ar" ? sd.label_ar : sd.label_en,
      city_id: sd.city_id,
      district_value: sd.district_value,
      city_name: locale === "ar" ? sd.city_ar_name : sd.city_en_name,
      id: sd.id,
    }));
  }

  /**
   * Get city label with translation (accepts city id or canonical lowercase value).
   */
  async getCityLabel(cityRaw, locale = "en") {
    await this.initializeData();
    if (!cityRaw) return "";
    const city =
      (await this.getCityByValue(cityRaw)) || (await this.getCityById(cityRaw));
    if (!city) return "";
    return locale === "ar" ? city.label_ar : city.label_en;
  }

  /**
   * Get district label with translation (city accepts id or canonical value).
   */
  async getDistrictLabel(districtName, cityRaw, locale = "en") {
    await this.initializeData();
    if (!districtName || !cityRaw) return "";
    const district = await this.getDistrictByName(districtName, cityRaw);
    if (!district) return "";
    return locale === "ar" ? district.label_ar : district.label_en;
  }

  /**
   * Get sub-district label with translation
   */
  async getSubDistrictLabel(subRaw, cityRaw, districtRaw, locale = "en") {
    await this.initializeData();
    let sub = districtRaw
      ? this.resolveSubDistrict(subRaw, cityRaw, districtRaw)
      : null;
    if (!sub) sub = this.resolveSubDistrictInCity(subRaw, cityRaw);
    if (!sub) return "";
    return locale === "ar" ? sub.label_ar : sub.label_en;
  }

  /**
   * Resolve localized display labels for city, district, and sub-district.
   */
  async getLocationDisplayLabels(
    { city = "", district = "", sub_district = "" } = {},
    locale = "en"
  ) {
    await this.initializeData();
    const resolved = this.resolveLocationHierarchy({
      city,
      district,
      sub_district,
    });
    const cityLabel = resolved.city
      ? await this.getCityLabel(resolved.city, locale)
      : "";
    const districtLabel =
      resolved.district && resolved.city
        ? await this.getDistrictLabel(resolved.district, resolved.city, locale)
        : resolved.district || "";
    const subDistrictLabel =
      resolved.sub_district && resolved.city
        ? await this.getSubDistrictLabel(
            resolved.sub_district,
            resolved.city,
            resolved.district,
            locale
          )
        : resolved.sub_district || "";
    return {
      city: cityLabel || resolved.city || "",
      district: districtLabel,
      subDistrict: subDistrictLabel,
    };
  }

  /**
   * Build a comma-separated localized location string.
   */
  async formatLocationDisplay(
    { city = "", district = "", sub_district = "" } = {},
    locale = "en"
  ) {
    const labels = await this.getLocationDisplayLabels(
      { city, district, sub_district },
      locale
    );
    return [labels.city, labels.district, labels.subDistrict]
      .filter(Boolean)
      .join(", ");
  }

  /**
   * Get cities and districts data in the format expected by the API
   */
  async getCitiesAndDistrictsData() {
    const cities = await this.getCities();
    const districts = {};

    for (const city of cities) {
      const cityKey = city.value;
      const cityDistricts = await this.getDistrictsForCity(city.id);
      districts[cityKey] = cityDistricts.map((district) => district.value);
    }

    return {
      cities: cities.map((city) => city.value),
      districts,
    };
  }

  /**
   * Search cities by name (supports both English and Arabic)
   */
  async searchCities(query, locale = "en") {
    const cities = await this.getCities();
    if (!query) return this.getCitiesWithLabels(locale);

    const lowercaseQuery = query.toLowerCase();
    return cities
      .filter(
        (city) =>
          city.label_en.toLowerCase().includes(lowercaseQuery) ||
          city.label_ar.includes(lowercaseQuery) ||
          (city.aliases || []).some((alias) =>
            String(alias).toLowerCase().includes(lowercaseQuery)
          )
      )
      .map((city) => ({
        value: city.value,
        label: locale === "ar" ? city.label_ar : city.label_en,
        id: city.id,
      }));
  }

  /**
   * Search districts by name (supports both English and Arabic)
   */
  async searchDistricts(query, cityId = null, locale = "en") {
    const districts = cityId
      ? await this.getDistrictsForCity(cityId)
      : await this.getDistricts();
    if (!query) return this.getDistrictsWithLabels(cityId, locale);

    const lowercaseQuery = query.toLowerCase();

    return districts
      .filter(
        (district) =>
          district.label_en.toLowerCase().includes(lowercaseQuery) ||
          district.label_ar.includes(lowercaseQuery) ||
          district.aliases.some((alias) =>
            alias.toLowerCase().includes(lowercaseQuery)
          )
      )
      .map((district) => ({
        value: district.value,
        label: locale === "ar" ? district.label_ar : district.label_en,
        city_id: district.city_id,
        city_name:
          locale === "ar" ? district.city_ar_name : district.city_en_name,
        id: district.id,
      }));
  }
}

export default CityManager;
