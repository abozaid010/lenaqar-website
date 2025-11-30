"use client";

import { useState } from "react";
import { Info, X } from "lucide-react";
import { useI18n } from "@/context/translate-api";
import { VIDEO_MAP, DEFAULT_MESSAGES } from "@/constants/video-instructions";

/**
 * VideoInstructionsDialog Component
 * Shows an info icon that opens a dialog with instructional video
 *
 * @param {string} variant - The type of instructions (team, units, developers, etc.)
 * @param {string} title - Optional custom title
 * @param {string} description - Optional custom description
 * @param {boolean} autoPlay - Whether to autoplay the video when dialog opens (default: true)
 * @param {boolean} muted - Whether to mute the video (default: false)
 * @param {boolean} showControls - Whether to show video controls (default: true)
 * @param {boolean} loop - Whether to loop the video (default: false)
 * @param {boolean} showRelatedVideos - Whether to show related videos at the end (default: false)
 * @param {boolean} showFullscreen - Whether to allow fullscreen mode (default: true)
 * @param {boolean} showAnnotations - Whether to show video annotations (default: false)
 * @param {number} startTime - Start time in seconds (default: 0)
 * @param {number} endTime - End time in seconds (optional)
 * @param {string} playerLanguage - Player interface language (e.g., 'en', 'ar')
 * @param {string} captionsLanguage - Captions language (e.g., 'en', 'ar')
 * @param {boolean} showCaptions - Whether to show captions by default (default: false)
 * @param {string} quality - Preferred video quality: 'default', 'hd720', 'hd1080' (default: 'default')
 * @param {string} iconSize - Size of the info icon: 'sm', 'md', 'lg' (default: 'md')
 * @param {string} iconClassName - Additional classes for the icon button
 * @param {string} tooltipText - Tooltip text for the icon (default: "View instructions")
 */
export default function VideoInstructionsDialog({
  variant,
  title,
  description,
  autoPlay = true,
  muted = false,
  showControls = true,
  loop = false,
  showRelatedVideos = false,
  showFullscreen = true,
  startTime = 0,
  endTime,
  quality = "default",
  iconSize = "md",
  iconClassName = "",
  svgClassName = "",
  tooltipText,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useI18n();

  const videoId = VIDEO_MAP[variant];
  const hasVideo = !!videoId;

  // Don't render if no video available for this variant
  if (!hasVideo) {
    return null;
  }

  const content = DEFAULT_MESSAGES[variant];
  const displayTitle =
    title ||
    t.videoInstructions?.titles?.[variant] ||
    content?.title ||
    "Instructions";
  const displayDescription =
    description ||
    t.videoInstructions?.descriptions?.[variant] ||
    content?.description ||
    "";
  const displayTooltip =
    tooltipText ||
    t.videoInstructions?.tooltips?.[variant] ||
    "View instructions";

  const getYouTubeEmbedUrl = () => {
    if (!videoId) return null;

    const params = [];

    // Playback controls
    if (autoPlay) params.push("autoplay=1");
    if (muted || autoPlay) params.push("mute=1");
    if (showControls) params.push("controls=1");
    else params.push("controls=0");

    // Loop functionality
    if (loop) {
      params.push("loop=1");
      params.push(`playlist=${videoId}`);
    }

    // Related videos
    if (showRelatedVideos) params.push("rel=1");
    else params.push("rel=0");

    // Start and end time
    if (startTime > 0) params.push(`start=${startTime}`);
    if (endTime) params.push(`end=${endTime}`);

    // Video quality
    if (quality !== "default") params.push(`vq=${quality}`);

    // Branding
    params.push("modestbranding=1");

    // Fullscreen
    if (!showFullscreen) params.push("fs=0");

    const queryString = params.length > 0 ? `?${params.join("&")}` : "";
    return `https://www.youtube.com/embed/${videoId}${queryString}`;
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Info Icon Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center justify-center p-2 rounded-full hover:bg-gray-100 transition-colors group relative ${iconClassName}`}
        aria-label={displayTooltip}
      >
        <Info
          className={`${iconSizes[iconSize]} text-primary group-hover:text-primary-dark ${svgClassName}`}
        />

        {/* Tooltip */}
        <span className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 text-xs font-medium text-white bg-gray-900 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          {displayTooltip}
        </span>
      </button>

      {/* Dialog/Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={handleClose}
        >
          <div
            className="relative bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-gray-200 bg-white">
              <div className="flex-1 pr-8">
                <h2 className="text-xl font-semibold text-gray-900">
                  {displayTitle}
                </h2>
                {displayDescription && (
                  <p className="text-sm text-gray-600 mt-1">
                    {displayDescription}
                  </p>
                )}
              </div>
              <button
                onClick={handleClose}
                className="flex-shrink-0 p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Video Content */}
            <div className="p-6">
              <div className="w-full aspect-video rounded-lg overflow-hidden shadow-lg bg-gray-100">
                <iframe
                  src={getYouTubeEmbedUrl()}
                  title={displayTitle}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                  className="w-full h-full"
                  style={{ border: 0 }}
                  loading="lazy"
                />
              </div>
            </div>

            {/* Footer (optional) */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={handleClose}
                className="w-full sm:w-auto px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
              >
                {t.videoInstructions?.dialog?.gotIt || "Got it!"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
