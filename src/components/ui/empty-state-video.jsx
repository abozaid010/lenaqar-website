"use client";

import { useState } from "react";
import { useI18n } from "@/context/translate-api";
import {
  VIDEO_MAP,
  EMPTY_STATE_MESSAGES,
} from "@/constants/video-instructions";

/**
 * EmptyStateVideo Component
 *
 * @param {string} variant - The type of empty state (team, units, developers, etc.)
 * @param {string} title - Optional custom title
 * @param {string} description - Optional custom description
 * @param {boolean} autoPlay - Whether to autoplay the video (default: false)
 * @param {boolean} muted - Whether to mute the video (default: true for autoplay)
 * @param {boolean} showControls - Whether to show video controls (default: false)
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
 */
export default function EmptyStateVideo({
  variant = "default",
  title,
  description,
  autoPlay = false,
  muted = false,
  showControls = false,
  loop = false,
  showRelatedVideos = false,
  showFullscreen = true,
  showAnnotations = false,
  startTime = 0,
  endTime,
  quality = "default",
}) {
  const [videoError, setVideoError] = useState(false);
  const { t } = useI18n();

  const videoId = VIDEO_MAP[variant];
  const hasVideo = !!videoId;

  const content = EMPTY_STATE_MESSAGES[variant] || EMPTY_STATE_MESSAGES.default;
  const displayTitle =
    title || t.videoInstructions?.emptyState?.[variant]?.title || content.title;
  const displayDescription =
    description ||
    t.videoInstructions?.emptyState?.[variant]?.description ||
    content.description;

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
      params.push(`playlist=${videoId}`); // Required for loop to work
    }

    // Related videos
    if (showRelatedVideos) params.push("rel=1");
    else params.push("rel=0");

    // Annotations
    if (!showAnnotations) params.push("iv_load_policy=3");

    // Start and end time
    if (startTime > 0) params.push(`start=${startTime}`);
    if (endTime) params.push(`end=${endTime}`);

    // Video quality
    if (quality !== "default") params.push(`vq=${quality}`);

    // Branding
    params.push("modestbranding=1"); // Minimal YouTube branding

    // Fullscreen
    if (!showFullscreen) params.push("fs=0");

    const queryString = params.length > 0 ? `?${params.join("&")}` : "";
    return `https://www.youtube.com/embed/${videoId}${queryString}`;
  };

  const embedUrl = getYouTubeEmbedUrl();

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
      <div className="max-w-5xl w-full space-y-6">
        <h3 className="text-2xl font-semibold text-gray-800">{displayTitle}</h3>

        <p className="text-gray-600 dark:text-gray-400 text-lg">
          {displayDescription}
        </p>

        {hasVideo && !videoError && (
          <div className="w-full aspect-video rounded-lg overflow-hidden shadow-lg bg-gray-100 dark:bg-gray-800">
            <iframe
              src={embedUrl}
              title={displayTitle}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              className="w-full h-full"
              style={{ border: 0 }}
              loading="lazy"
            />
          </div>
        )}

        {(!hasVideo || videoError) && (
          <div className="w-full p-12 rounded-lg bg-gray-50 dark:bg-gray-800/50 border-2 border-dashed border-gray-300 dark:border-gray-600">
            <svg
              className="mx-auto h-24 w-24 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              {videoError
                ? "Unable to load video"
                : "No additional resources available"}
            </p>
          </div>
        )}

        {hasVideo && (
          <div className="pt-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t.videoInstructions?.dialog?.readyToStart ||
                "Ready to get started? Add your first"}{" "}
              {variant || "item"} {t.videoInstructions?.dialog?.now || "now."}.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
