/**
 * Singleton class to manage lightweight project names data
 * - Fetches data from /projectsv2/all_projects_names endpoint
 * - Provides formatted projects lists for dropdowns
 * - Uses ar_name and en_name for translations
 * - Stores only essential fields: id, en_name, ar_name, city, district
 */
class ProjectsNamesManager {
  constructor() {
    this.projects = [];
    this.isInitialized = false;
    this.isLoading = false;
    this.loadPromise = null;
  }

  /**
   * Get singleton instance
   */
  static getInstance() {
    if (!ProjectsNamesManager.instance) {
      ProjectsNamesManager.instance = new ProjectsNamesManager();
    }
    return ProjectsNamesManager.instance;
  }

  /**
   * Initialize data by fetching from API
   * Note: This is typically called via the useProjectsNames hook with TanStack Query
   * Direct usage should be rare - prefer using the hook for automatic caching
   */
  async initializeData(fetchFunction) {
    if (this.isInitialized || this.isLoading) return this.projects;
    if (this.loadPromise) return this.loadPromise;

    this.isLoading = true;
    this.loadPromise = this._fetchData(fetchFunction);

    try {
      const projects = await this.loadPromise;
      this.projects = projects;
      this.isInitialized = true;
      this.isLoading = false;
      this.loadPromise = null;
      return projects;
    } catch (error) {
      this.isLoading = false;
      this.loadPromise = null;
      throw error;
    }
  }

  /**
   * Internal method to fetch data
   */
  async _fetchData(fetchFunction) {
    if (!fetchFunction) {
      throw new Error("fetchFunction is required for ProjectsNamesManager initialization");
    }

    try {
      const data = await fetchFunction();
      
      if (!Array.isArray(data)) {
        throw new Error(`Expected array but received: ${typeof data}`);
      }

      return data;
    } catch (error) {
      console.error("Failed to initialize ProjectsNamesManager data:", error?.message ?? error);
      this.projects = [];
      throw error;
    }
  }

  /**
   * Get all projects
   */
  getProjects() {
    return this.projects;
  }

  /**
   * Set projects data (used by TanStack Query hook)
   */
  setProjects(projects) {
    if (!Array.isArray(projects)) {
      console.warn("ProjectsNamesManager.setProjects: expected array, received:", typeof projects);
      this.projects = [];
      return;
    }
    this.projects = projects;
    this.isInitialized = true;
  }

  /**
   * Get project by ID
   */
  getProjectById(projectId) {
    if (!projectId) return null;
    return this.projects.find(project => project.id === projectId);
  }

  /**
   * Get project by en_name
   */
  getProjectByEnName(enName) {
    if (!enName) return null;
    return this.projects.find(project => 
      project.en_name && project.en_name.toLowerCase() === enName.toLowerCase()
    );
  }

  /**
   * Get projects by city
   */
  getProjectsByCity(cityName) {
    if (!cityName) return this.projects;

    const normalizedCity = String(cityName).toLowerCase().trim();
    return this.projects.filter(project =>
      project.city && project.city.toLowerCase() === normalizedCity
    );
  }

  /**
   * Get projects by city and district (for dropdown filtering)
   */
  getProjectsByCityAndDistrict(cityName, districtName) {
    if (!cityName || !districtName) return [];

    const normalizedCity = String(cityName).toLowerCase().trim();
    const normalizedDistrict = String(districtName).toLowerCase().trim();
    return this.projects.filter(
      (project) =>
        project.city &&
        project.city.toLowerCase() === normalizedCity &&
        project.district &&
        project.district.toLowerCase() === normalizedDistrict
    );
  }

  /**
   * Get formatted projects list for UI (with translations)
   */
  getProjectsWithLabels(locale = "en") {
    return this.projects.map(project => ({
      id: project.id,
      value: project.en_name,
      en_name: project.en_name,
      ar_name: project.ar_name,
      city: project.city,
      district: project.district,
      label: locale === "ar" ? project.ar_name : project.en_name,
    }));
  }

  /**
   * Search projects by name (supports both English and Arabic)
   */
  searchProjects(query, locale = "en") {
    if (!query) return this.getProjectsWithLabels(locale);

    const lowercaseQuery = query.toLowerCase();
    return this.projects
      .filter(project =>
        (project.en_name && project.en_name.toLowerCase().includes(lowercaseQuery)) ||
        (project.ar_name && project.ar_name.includes(query))
      )
      .map(project => ({
        id: project.id,
        value: project.en_name,
        en_name: project.en_name,
        ar_name: project.ar_name,
        city: project.city,
        district: project.district,
        label: locale === "ar" ? project.ar_name : project.en_name,
      }));
  }

  /**
   * Get project label with translation
   */
  getProjectLabel(projectId, locale = "en") {
    const project = this.getProjectById(projectId);
    if (!project) return "";
    return locale === "ar" ? project.ar_name : project.en_name;
  }

  /**
   * Get unique cities from projects
   */
  getCities() {
    const citySet = new Set();
    this.projects.forEach(project => {
      if (project.city) {
        citySet.add(project.city.toLowerCase());
      }
    });
    return Array.from(citySet).sort();
  }

  /**
   * Clear cached data (useful for testing or forced refresh)
   */
  clear() {
    this.projects = [];
    this.isInitialized = false;
    this.isLoading = false;
    this.loadPromise = null;
  }
}

export default ProjectsNamesManager;
