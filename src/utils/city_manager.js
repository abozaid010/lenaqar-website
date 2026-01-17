/**
 * Singleton class to manage cities and districts data from local JSON file
 * - Loads data from /cities_list.json (public folder)
 * - Provides formatted cities and districts lists
 * - Uses ar_name and en_name for translations
 */
class CityManager {
  constructor() {
    this.cities = [];
    this.districts = [];
    this.isInitialized = false;
    this.isLoading = false;
    this.loadPromise = null;
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

  /**
   * Initialize data by fetching from public folder
   */
  async initializeData() {
    if (this.isInitialized || this.isLoading) return;
    if (this.loadPromise) return this.loadPromise;

    this.isLoading = true;

    try {
      const response = await fetch('/cities_list.json');
      if (!response.ok) {
        throw new Error(`Failed to fetch cities data: ${response.status}`);
      }
      const citiesListData = await response.json();

      // Extract cities from the JSON array
      this.cities = citiesListData.map(city => ({
        id: city.id,
        en_name: city.en_name,
        ar_name: city.ar_name,
        value: city.id.toLowerCase(), // lowercase for API compatibility
        label_en: city.en_name,
        label_ar: city.ar_name
      }));

      // Extract all districts from all cities
      this.districts = [];
      citiesListData.forEach(city => {
        if (city.districts && Array.isArray(city.districts)) {
          city.districts.forEach(district => {
            this.districts.push({
              id: city.id + '_' + district.en_name.toLowerCase().replace(/\s+/g, '_'),
              en_name: district.en_name,
              ar_name: district.ar_name,
              city_id: city.id,
              city_en_name: city.en_name,
              city_ar_name: city.ar_name,
              value: district.en_name.toLowerCase(), // lowercase for API compatibility
              label_en: district.en_name,
              label_ar: district.ar_name,
              aliases: district.aliases || []
            });
          });
        }
      });

      this.isInitialized = true;
      this.isLoading = false;
      return this;
    } catch (error) {
      console.error("Failed to initialize CityManager data:", error);
      this.cities = [];
      this.districts = [];
      this.isLoading = false;
      throw error;
    }
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
   * Get districts for a specific city (async - ensures data is loaded)
   */
  async getDistrictsForCity(cityId) {
    await this.initializeData();
    return this.districts.filter(district => district.city_id === cityId);
  }

  /**
   * Get city by ID (async - ensures data is loaded)
   */
  async getCityById(cityId) {
    await this.initializeData();
    return this.cities.find(city => city.id === cityId);
  }

  /**
   * Get district by name and city (async - ensures data is loaded)
   */
  async getDistrictByName(districtName, cityId) {
    await this.initializeData();
    return this.districts.find(district =>
      district.value === districtName.toLowerCase() && district.city_id === cityId
    );
  }

  /**
   * Get formatted cities list for UI (with translations)
   */
  async getCitiesWithLabels(locale = "en") {
    const cities = await this.getCities();
    return cities.map(city => ({
      value: city.value,
      label: locale === "ar" ? city.label_ar : city.label_en,
      id: city.id
    }));
  }

  /**
   * Get formatted districts list for UI (with translations)
   */
  async getDistrictsWithLabels(cityId = null, locale = "en") {
    const districts = cityId ? await this.getDistrictsForCity(cityId) : await this.getDistricts();
    return districts.map(district => ({
      value: district.value,
      label: locale === "ar" ? district.label_ar : district.label_en,
      city_id: district.city_id,
      city_name: locale === "ar" ? district.city_ar_name : district.city_en_name
    }));
  }

  /**
   * Get city label with translation
   */
  async getCityLabel(cityId, locale = "en") {
    const city = await this.getCityById(cityId);
    if (!city) return "";
    return locale === "ar" ? city.label_ar : city.label_en;
  }

  /**
   * Get district label with translation
   */
  async getDistrictLabel(districtName, cityId, locale = "en") {
    const district = await this.getDistrictByName(districtName, cityId);
    if (!district) return "";
    return locale === "ar" ? district.label_ar : district.label_en;
  }

  /**
   * Get cities and districts data in the format expected by the API
   */
  async getCitiesAndDistrictsData() {
    const cities = await this.getCities();
    const districts = {};

    for (const city of cities) {
      const cityKey = city.id.toLowerCase();
      const cityDistricts = await this.getDistrictsForCity(city.id);
      districts[cityKey] = cityDistricts.map(district => district.value);
    }

    return {
      cities: cities.map(city => city.id.toLowerCase()),
      districts
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
      .filter(city =>
        city.label_en.toLowerCase().includes(lowercaseQuery) ||
        city.label_ar.includes(lowercaseQuery)
      )
      .map(city => ({
        value: city.value,
        label: locale === "ar" ? city.label_ar : city.label_en,
        id: city.id
      }));
  }

  /**
   * Search districts by name (supports both English and Arabic)
   */
  async searchDistricts(query, cityId = null, locale = "en") {
    const districts = cityId ? await this.getDistrictsForCity(cityId) : await this.getDistricts();
    if (!query) return this.getDistrictsWithLabels(cityId, locale);

    const lowercaseQuery = query.toLowerCase();

    return districts
      .filter(district =>
        district.label_en.toLowerCase().includes(lowercaseQuery) ||
        district.label_ar.includes(lowercaseQuery) ||
        district.aliases.some(alias => alias.toLowerCase().includes(lowercaseQuery))
      )
      .map(district => ({
        value: district.value,
        label: locale === "ar" ? district.label_ar : district.label_en,
        city_id: district.city_id,
        city_name: locale === "ar" ? district.city_ar_name : district.city_en_name
      }));
  }
}

export default CityManager;