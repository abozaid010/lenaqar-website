import { MapPin, Navigation, ExternalLink, Video, Car, Crosshair, FileVideo } from 'lucide-react';
import type { ProjectLocationContextProps } from '@/lib/projects/project-types';

export default function ProjectLocationContext({ project }: ProjectLocationContextProps) {
  return (
    <div className="bg-white rounded-lg border p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Location & Context</h2>
      
      {/* Location Information */}
      <div className="space-y-6">
        {/* Primary Location */}
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="p-2 bg-red-100 rounded-lg">
              <MapPin className="w-5 h-5 text-red-600" />
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Project Location</h3>
            <p className="text-gray-700">{project.locationLabel}</p>
          </div>
        </div>

        {/* Google Maps Link */}
        {project.googleMapLink && (
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Navigation className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">View on Map</h3>
              <a 
                href={project.googleMapLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
              >
                <span>Open in Google Maps</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        )}

        {/* Location Landmark */}
        {project.locationLandmark && (
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <MapPin className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Location Landmark</h3>
              <p className="text-gray-700 text-sm">{project.locationLandmark}</p>
            </div>
          </div>
        )}

        {/* Coordinates */}
        {project.latitude != null && project.longitude != null && (
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="p-2 bg-teal-100 rounded-lg">
                <Crosshair className="w-5 h-5 text-teal-600" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Coordinates</h3>
              <a
                href={`https://maps.google.com/?q=${project.latitude},${project.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-800 text-sm transition-colors"
              >
                <span>{project.latitude.toFixed(6)}, {project.longitude.toFixed(6)}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}

        {/* Video Tour */}
        {project.videoUrl && (
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Video className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">Video Tour</h3>
              <a 
                href={project.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
              >
                <span>Watch Project Video</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        )}

        {/* Orientation Video */}
        {project.orientationUrl && (
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="p-2 bg-orange-100 rounded-lg">
                <FileVideo className="w-5 h-5 text-orange-600" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">Orientation Video</h3>
              <a
                href={project.orientationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
              >
                <span>Watch Orientation</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        )}

        {/* Amenities */}
        {project.amenities && project.amenities.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Car className="w-5 h-5 text-gray-600" />
              Nearby Amenities
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {project.amenities.map((amenity, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-gray-700">{amenity}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Building Types */}
        {project.buildingTypes && project.buildingTypes.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Available Building Types</h3>
            <div className="flex flex-wrap gap-2">
              {project.buildingTypes.map((type, index) => (
                <span 
                  key={index}
                  className="px-3 py-1 bg-gray-100 text-gray-800 text-sm font-medium rounded-lg"
                >
                  {type}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Payment Plans */}
        {project.paymentPlans && project.paymentPlans.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Available Payment Plans</h3>
            <div className="space-y-2">
              {project.paymentPlans.map((plan, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200"
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-green-800 font-medium">{plan}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
