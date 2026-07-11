"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchDataProjection } from "@/utils/api";
import { useI18n } from "@/context/translate-api";
import SearchableDropdownSelect from "@/components/ui/inputs/searchable-dropdown-select";
import LocalizedLocationText from "@/components/ui/localized-location-text";
import { Loader2, Map, List, ExternalLink } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";

// Dynamically import MapContainer to avoid SSR issues with Leaflet
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);

// Import Leaflet CSS
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in Next.js (only on client side)
if (typeof window !== "undefined") {
  const L = require("leaflet");
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  });
}

// Helper function to extract coordinates from Google Maps link
const extractCoordinatesFromLink = async (googleMapLink) => {
  if (!googleMapLink) return null;

  try {
    // Try to extract from different Google Maps URL formats
    // Format 1: https://maps.google.com/?q=lat,lng
    const qMatch = googleMapLink.match(/[?&]q=([^&]+)/);
    if (qMatch) {
      const coords = qMatch[1].split(",");
      if (coords.length === 2) {
        const lat = parseFloat(coords[0]);
        const lng = parseFloat(coords[1]);
        if (!isNaN(lat) && !isNaN(lng)) {
          return [lat, lng];
        }
      }
    }

    // Format 2: https://www.google.com/maps/place/.../@lat,lng
    const placeMatch = googleMapLink.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (placeMatch) {
      const lat = parseFloat(placeMatch[1]);
      const lng = parseFloat(placeMatch[2]);
      if (!isNaN(lat) && !isNaN(lng)) {
        return [lat, lng];
      }
    }

    // Format 3: Short URL - we'll need to geocode using city/district
    // This will be handled by the geocodeCityDistrict function
    return null;
  } catch (error) {
    console.error("Error extracting coordinates:", error?.message ?? error);
    return null;
  }
};

// Helper function to geocode city and district
const geocodeCityDistrict = async (city, district) => {
  if (!city && !district) return null;

  try {
    const query = [city, district].filter(Boolean).join(", ");
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ", Egypt")}&limit=1`
    );
    const data = await response.json();

    if (data && data.length > 0) {
      return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    }
  } catch (error) {
    console.error("Geocoding error:", error?.message ?? error);
  }

  return null;
};

// Helper function to get coordinates for a project
const getProjectCoordinates = async (project) => {
  // First try to extract from Google Maps link
  if (project.google_map_link) {
    const coords = await extractCoordinatesFromLink(project.google_map_link);
    if (coords) return coords;
  }

  // Fallback to geocoding city/district
  if (project.city || project.district) {
    const coords = await geocodeCityDistrict(project.city, project.district);
    if (coords) return coords;
  }

  return null;
};

const MapView = () => {
  const { t, locale } = useI18n();
  const [viewMode, setViewMode] = useState("list"); // "map" or "list" - default to list for faster initial load
  const [projectCoordinates, setProjectCoordinates] = useState({});
  const [isLoadingCoords, setIsLoadingCoords] = useState(false);
  const [selectedDeveloperId, setSelectedDeveloperId] = useState("");

  const getProjectKey = (developer, project, projectIndex) => {
    const developerId = developer?.developer_id;
    const projectId = project?.project_id ?? project?.id;

    if (developerId != null && projectId != null) {
      return `${developerId}-${projectId}`;
    }

    // Fallback: stable-ish key (avoid random to allow caching between toggles)
    const projectName = project?.project_name || "project";
    return `${developerId ?? "dev"}-${projectName}-${projectIndex}`;
  };

  const {
    data: projectionData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["data-projection"],
    queryFn: fetchDataProjection,
    staleTime: Infinity, // Never consider data stale - cache for entire session lifetime
    gcTime: Infinity, // Never garbage collect - keep in memory for entire session
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Don't refetch when component mounts if data exists
    refetchOnReconnect: false, // Don't refetch on network reconnect
    retry: false, // Don't retry on failure (expensive API, user should logout/login to retry)
  });

  const displayedProjectionData = useMemo(() => {
    if (!projectionData || !Array.isArray(projectionData)) return [];
    if (!selectedDeveloperId) return projectionData;
    return projectionData.filter(
      (developer) => String(developer?.developer_id) === selectedDeveloperId
    );
  }, [projectionData, selectedDeveloperId]);

  const isBusy = isLoading || (viewMode === "map" && isLoadingCoords);

  // Process coordinates only when map view is active
  useEffect(() => {
    if (!displayedProjectionData || viewMode !== "map") return;

    const loadCoordinates = async () => {
      // Only fetch missing coordinates (avoid re-calling external APIs on toggles)
      const missing = [];
      for (const developer of displayedProjectionData) {
        for (const [projectIndex, project] of (developer.projects || []).entries()) {
          const key = getProjectKey(developer, project, projectIndex);
          if (!projectCoordinates[key]) {
            missing.push({ key, project });
          }
        }
      }

      if (missing.length === 0) {
        setIsLoadingCoords(false);
        return;
      }

      setIsLoadingCoords(true);
      const coordsMap = { ...projectCoordinates };

      for (const item of missing) {
        const coords = await getProjectCoordinates(item.project);
        if (coords) {
          coordsMap[item.key] = coords;
        }
      }

      setProjectCoordinates(coordsMap);
      setIsLoadingCoords(false);
    };

    loadCoordinates();
  }, [displayedProjectionData, viewMode, projectCoordinates]);

  // Calculate center of map (average of all coordinates)
  const getMapCenter = () => {
    const visibleCoords = [];

    for (const developer of displayedProjectionData) {
      for (const [projectIndex, project] of (developer.projects || []).entries()) {
        const key = getProjectKey(developer, project, projectIndex);
        const coords = projectCoordinates[key];
        if (coords) visibleCoords.push(coords);
      }
    }

    const coords = visibleCoords;
    if (coords.length === 0) return [30.0444, 31.2357]; // Default to Cairo

    const avgLat = coords.reduce((sum, [lat]) => sum + lat, 0) / coords.length;
    const avgLng = coords.reduce((sum, [, lng]) => sum + lng, 0) / coords.length;
    return [avgLat, avgLng];
  };

  const getDeveloperDisplayName = (developer) => {
    if (!developer) return "";
    if (locale === "ar") {
      return developer.ar_name || developer.developer_name || developer.en_name || "";
    }
    return developer.en_name || developer.developer_name || developer.ar_name || "";
  };

  // Count total projects per developer
  const getDeveloperProjectCount = (developer) => {
    return developer.projects?.length || 0;
  };

  // Count total units per developer
  const getDeveloperTotalUnits = (developer) => {
    return developer.projects?.reduce((sum, project) => sum + (project.total_units || 0), 0) || 0;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 p-4 bg-white rounded-lg shadow-md mb-4">
        <div className="flex items-center flex-wrap md:flex-nowrap gap-2 md:justify-between">
          <div className="w-full md:w-auto md:flex-1 min-w-0">
            <SearchableDropdownSelect
              options={projectionData || []}
              value={selectedDeveloperId}
              onChange={(e) => setSelectedDeveloperId(e.target.value)}
              name="developerFilter"
              showAllOption
              allOptionLabel={locale === "ar" ? "كل المطورين" : "All developers"}
              allOptionValue=""
              placeholder={locale === "ar" ? "اختر مطور" : "Select developer"}
              searchPlaceholder={locale === "ar" ? "ابحث بالاسم..." : "Search by name..."}
              searchFields={["ar_name", "en_name", "developer_name"]}
              getValue={(developer) => String(developer?.developer_id ?? "")}
              getLabel={(developer, currentLocale) => {
                if (currentLocale === "ar") {
                  return developer?.ar_name || developer?.developer_name || developer?.en_name || "";
                }
                return developer?.en_name || developer?.developer_name || developer?.ar_name || "";
              }}
              buttonClassName="bg-[#F6F7FB] border-[#E6E6E6] text-[#494A4B] text-sm h-10 hover:border-primary/40 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              disabled={isLoading || isError}
            />
          </div>
          <div className="w-full md:w-auto flex-shrink-0 flex gap-2 items-center">
            <div className="flex gap-1 bg-[#F6F7FB] border border-[#E6E6E6] rounded-md p-1">
              <button
                onClick={() => setViewMode("map")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors ${viewMode === "map" ? "bg-primary text-white" : "text-[#494A4B] hover:bg-white"}`}
              >
                <Map className="h-4 w-4" />
                <span>{t.map?.mapView || "Map"}</span>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors ${viewMode === "list" ? "bg-primary text-white" : "text-[#494A4B] hover:bg-white"}`}
              >
                <List className="h-4 w-4" />
                <span>{t.map?.listView || "List"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Map or List View */}
      {isBusy && (
        <div className="flex flex-col items-center justify-center flex-1">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-gray-600">{t.map?.loading || "Loading map data..."}</p>
        </div>
      )}

      {!isBusy && isError && (
        <div className="flex flex-col items-center justify-center flex-1 p-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
            <p className="text-red-600 font-semibold mb-2">
              {t.map?.error || "Error loading map data"}
            </p>
            <p className="text-red-500 text-sm">
              {error?.message || "Please try again later"}
            </p>
          </div>
        </div>
      )}

      {!isBusy && !isError && (!projectionData || projectionData.length === 0) && (
        <div className="flex flex-col items-center justify-center flex-1 p-4">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 max-w-md text-center">
            <p className="text-gray-600 text-lg">
              {t.map?.noData || "No project data available"}
            </p>
          </div>
        </div>
      )}

      {!isBusy && !isError && displayedProjectionData && displayedProjectionData.length > 0 && (
        viewMode === "map" ? (
          <div className="flex-1 rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-white">
            {typeof window !== "undefined" && (
              <MapContainer
                center={getMapCenter()}
                zoom={8}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {displayedProjectionData.map((developer) =>
                  developer.projects?.map((project, projectIndex) => {
                    const key = getProjectKey(developer, project, projectIndex);
                    const coords = projectCoordinates[key];
                    if (!coords) return null;

                    return (
                      <Marker key={key} position={coords}>
                        <Popup>
                          <div className="p-2 min-w-[200px]">
                            <h3 className="font-bold text-lg mb-2">{project.project_name}</h3>
                            <p className="text-sm text-gray-600 mb-1">
                              <strong>{t.map?.developer || "Developer"}:</strong> {getDeveloperDisplayName(developer)}
                            </p>
                            <p className="text-sm text-gray-600 mb-1">
                              <strong>{t.map?.location || "Location"}:</strong>{" "}
                              <LocalizedLocationText
                                city={project.city || ""}
                                district={project.district || ""}
                              />
                            </p>
                            <p className="text-sm text-gray-600 mb-2">
                              <strong>{t.map?.totalUnits || "Total Units"}:</strong> {project.total_units || 0}
                            </p>
                            {project.unit_type && Object.keys(project.unit_type).length > 0 && (
                              <div className="mb-2">
                                <p className="text-xs font-semibold text-gray-700 mb-1">
                                  {t.map?.unitTypes || "Unit Types"}:
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {Object.entries(project.unit_type).map(([type, count]) => (
                                    <span
                                      key={type}
                                      className="text-xs bg-primary/10 text-primary px-2 py-1 rounded"
                                    >
                                      {type}: {count}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {project.google_map_link && (
                              <a
                                href={project.google_map_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline flex items-center gap-1 mt-2"
                              >
                                <ExternalLink className="h-3 w-3" />
                                {t.map?.viewOnGoogleMaps || "View on Google Maps"}
                              </a>
                            )}
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })
                )}
              </MapContainer>
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-4">
              {displayedProjectionData.map((developer) => (
                <div
                  key={developer.developer_id}
                  className="bg-white rounded-lg shadow-md border border-gray-200 p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-1">
                        {getDeveloperDisplayName(developer)}
                      </h2>
                      <p className="text-gray-600">
                        {getDeveloperProjectCount(developer)} {t.map?.projects || "projects"} • {getDeveloperTotalUnits(developer)} {t.map?.totalUnits || "total units"}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {developer.projects?.map((project, index) => {
                      const uniqueKey = getProjectKey(developer, project, index);

                      return (
                        <div
                          key={uniqueKey}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {project.project_name}
                            </h3>
                            {project.google_map_link && (
                              <a
                                href={project.google_map_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline flex items-center gap-1 text-sm"
                              >
                                <ExternalLink className="h-4 w-4" />
                                {t.map?.viewOnMap || "View on Map"}
                              </a>
                            )}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                            <div>
                              <span className="text-gray-600">{t.map?.location || "Location"}:</span>
                              <p className="font-medium">
                                <LocalizedLocationText
                                  city={project.city || ""}
                                  district={project.district || ""}
                                />
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-600">{t.map?.totalUnits || "Total Units"}:</span>
                              <p className="font-medium">{project.total_units || 0}</p>
                            </div>
                            {project.unit_type && Object.keys(project.unit_type).length > 0 && (
                              <div className="col-span-2">
                                <span className="text-gray-600">{t.map?.unitTypes || "Unit Types"}:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {Object.entries(project.unit_type).map(([type, count]) => (
                                    <span
                                      key={type}
                                      className="text-xs bg-primary/10 text-primary px-2 py-1 rounded"
                                    >
                                      {type}: {count}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default MapView;
