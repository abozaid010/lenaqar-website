"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchDataProjection } from "@/utils/api";
import { useI18n } from "@/context/translate-api";
import { Loader2, Map, List, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
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
    console.error("Error extracting coordinates:", error);
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
    console.error("Geocoding error:", error);
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
  const [viewMode, setViewMode] = useState("map"); // "map" or "list"
  const [projectCoordinates, setProjectCoordinates] = useState({});
  const [isLoadingCoords, setIsLoadingCoords] = useState(true);

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

  // Process coordinates for all projects
  useEffect(() => {
    if (!projectionData) return;

    const loadCoordinates = async () => {
      setIsLoadingCoords(true);
      const coordsMap = {};

      for (const developer of projectionData) {
        for (const project of developer.projects || []) {
          const key = `${developer.developer_id}-${project.project_name}`;
          const coords = await getProjectCoordinates(project);
          if (coords) {
            coordsMap[key] = coords;
          }
        }
      }

      setProjectCoordinates(coordsMap);
      setIsLoadingCoords(false);
    };

    loadCoordinates();
  }, [projectionData]);

  // Calculate center of map (average of all coordinates)
  const getMapCenter = () => {
    const coords = Object.values(projectCoordinates);
    if (coords.length === 0) return [30.0444, 31.2357]; // Default to Cairo

    const avgLat = coords.reduce((sum, [lat]) => sum + lat, 0) / coords.length;
    const avgLng = coords.reduce((sum, [, lng]) => sum + lng, 0) / coords.length;
    return [avgLat, avgLng];
  };

  // Count total projects per developer
  const getDeveloperProjectCount = (developer) => {
    return developer.projects?.length || 0;
  };

  // Count total units per developer
  const getDeveloperTotalUnits = (developer) => {
    return developer.projects?.reduce((sum, project) => sum + (project.total_units || 0), 0) || 0;
  };

  if (isLoading || isLoadingCoords) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-gray-600">{t.map?.loading || "Loading map data..."}</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
          <p className="text-red-600 font-semibold mb-2">
            {t.map?.error || "Error loading map data"}
          </p>
          <p className="text-red-500 text-sm">
            {error?.message || "Please try again later"}
          </p>
        </div>
      </div>
    );
  }

  if (!projectionData || projectionData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] p-4">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 max-w-md text-center">
          <p className="text-gray-600 text-lg">
            {t.map?.noData || "No project data available"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header with Toggle */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t.sidebar?.map || "Map"}
          </h1>
          <p className="text-gray-600">
            {t.map?.subtitle || "View projects by location"}
          </p>
        </div>
        <div className="flex gap-2 bg-white rounded-lg p-1 shadow-sm border border-gray-200">
          <button
            onClick={() => setViewMode("map")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              viewMode === "map"
                ? "bg-primary text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Map className="h-4 w-4" />
            <span>{t.map?.mapView || "Map"}</span>
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              viewMode === "list"
                ? "bg-primary text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <List className="h-4 w-4" />
            <span>{t.map?.listView || "List"}</span>
          </button>
        </div>
      </div>

      {/* Map or List View */}
      {viewMode === "map" ? (
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
              {projectionData.map((developer) =>
                developer.projects?.map((project) => {
                  const key = `${developer.developer_id}-${project.project_name}`;
                  const coords = projectCoordinates[key];
                  if (!coords) return null;

                  return (
                    <Marker key={key} position={coords}>
                      <Popup>
                        <div className="p-2 min-w-[200px]">
                          <h3 className="font-bold text-lg mb-2">{project.project_name}</h3>
                          <p className="text-sm text-gray-600 mb-1">
                            <strong>{t.map?.developer || "Developer"}:</strong> {developer.developer_name}
                          </p>
                          <p className="text-sm text-gray-600 mb-1">
                            <strong>{t.map?.location || "Location"}:</strong> {project.city}, {project.district}
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
            {projectionData.map((developer) => (
              <div
                key={developer.developer_id}
                className="bg-white rounded-lg shadow-md border border-gray-200 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">
                      {developer.developer_name}
                    </h2>
                    <p className="text-gray-600">
                      {getDeveloperProjectCount(developer)} {t.map?.projects || "projects"} • {getDeveloperTotalUnits(developer)} {t.map?.totalUnits || "total units"}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  {developer.projects?.map((project, index) => (
                    <div
                      key={index}
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
                          <p className="font-medium">{project.city}, {project.district}</p>
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
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MapView;
