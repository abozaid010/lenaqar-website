"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
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
 * @param {string} className - Alias for iconClassName (backwards compatibility)
 * @param {string} tooltipText - Tooltip text for the icon (default: "View instructions")
 * @param {boolean} isOpen - External control for dialog open state (optional)
 * @param {function} onOpen - Callback when dialog is opened (optional)
 * @param {function} onClose - Callback when dialog is closed (optional)
 * @param {boolean} showIcon - Whether to show the icon button (default: true)
 * @param {number} zIndex - Custom z-index for the dialog overlay (default: 50)
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
  className = "",
  svgClassName = "",
  tooltipText,
  isOpen: externalIsOpen,
  onOpen: externalOnOpen,
  onClose: externalOnClose,
  showIcon = true,
  zIndex = 50,
}) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const { translate } = useI18n();

  // Use external state if provided, otherwise use internal state
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const mergedIconClassName = [iconClassName, className].filter(Boolean).join(" ");
  
  // Sync external state changes to internal state
  useEffect(() => {
    if (externalIsOpen !== undefined) {
      setInternalIsOpen(externalIsOpen);
    }
  }, [externalIsOpen]);

  const videoId = VIDEO_MAP[variant];
  const hasVideo = !!videoId;

  // Don't render if no video available for this variant
  if (!hasVideo) {
    return null;
  }

  const content = DEFAULT_MESSAGES[variant];
  const displayTitle =
    title ||
    translate(
      `videoInstructions.titles.${variant}`,
      content?.title || "Instructions",
    );
  const displayDescription =
    description ||
    translate(`videoInstructions.descriptions.${variant}`, content?.description || "");
  const displayTooltip =
    tooltipText ||
    translate(
      `videoInstructions.tooltips.${variant}`,
      "View instructions",
    );

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
    if (externalOnClose) {
      externalOnClose();
    } else {
      setInternalIsOpen(false);
    }
  };

  const handleOpen = () => {
    // If parent controls open state, notify it
    if (externalOnOpen) {
      externalOnOpen();
      return;
    }

    // Otherwise use internal state
    if (externalIsOpen === undefined) setInternalIsOpen(true);
  };

  return (
    <>
      {/* YouTube Icon Button */}
      {showIcon && (
        <button
          type="button"
          onClick={handleOpen}
          className={`inline-flex items-center justify-center transition-colors group relative ${mergedIconClassName}`}
          aria-label={displayTooltip}
        >
        <span className={`block`} style={{ width: "2.5rem", height: "2.5rem" }}>
          <svg
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`w-full h-full ${svgClassName}`}
          >
            <rect width="32" height="32" rx="8" fill="#fff" />
            <path
              d="M27.5 10.5c-.3-1.1-1.2-2-2.3-2.2C23.1 8 16 8 16 8s-7.1 0-9.2.3c-1.1.2-2 1.1-2.3 2.2C4 12.6 4 16 4 16s0 3.4.5 5.5c.3 1.1 1.2 2 2.3 2.2C8.9 24 16 24 16 24s7.1 0 9.2-.3c1.1-.2 2-1.1 2.3-2.2.5-2.1.5-5.5.5-5.5s0-3.4-.5-5.5z"
              fill="#FF0000"
            />
            <path d="M13 20l7-4-7-4v8z" fill="#fff" />
          </svg>
        </span>

          {/* Tooltip */}
          <span className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 text-xs font-medium text-white bg-gray-900 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            {displayTooltip}
          </span>
        </button>
      )}

      {/* Dialog/Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          style={{ zIndex }}
          onClick={handleClose}
        >
          <div
            className="relative bg-white rounded-lg shadow-2xl w-full max-w-7xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Video Content with Close Button Overlay */}
            <div className="relative w-full aspect-video rounded-lg overflow-hidden shadow-lg bg-gray-100">
              {/* Close Button Overlay */}
              <button
                onClick={handleClose}
                className="absolute top-8 rtl:left-8 ltr:right-8 z-20 flex-shrink-0 p-2 rounded-full hover:bg-white/20 transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-8 h-8 text-white drop-shadow-lg" />
              </button>

              {/* Video iframe */}
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
        </div>
      )}
    </>
  );
}
