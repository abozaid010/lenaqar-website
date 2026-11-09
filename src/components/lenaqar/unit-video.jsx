const IFRAME_ALLOW =
  "accelerometer; encrypted-media; gyroscope; picture-in-picture; web-share";

/**
 * Renders a video already validated by `parseUnitVideo` (never a raw string).
 * `file` plays natively; youtube/facebook embed lazily.
 */
export default function UnitVideo({ video, poster, title }) {
  if (!video) return null;
  const label = `فيديو ${title}`;

  return (
    <div className="mt-6 relative aspect-video w-full overflow-hidden rounded-lg bg-black">
      {video.provider === "file" ? (
        <video
          controls
          playsInline
          preload="metadata"
          poster={poster || undefined}
          aria-label={label}
          className="absolute inset-0 h-full w-full"
        >
          <source
            src={video.src}
            type={video.src.toLowerCase().endsWith(".webm") ? "video/webm" : "video/mp4"}
          />
        </video>
      ) : (
        <iframe
          src={video.src}
          title={label}
          loading="lazy"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          allow={IFRAME_ALLOW}
          className="absolute inset-0 h-full w-full border-0"
        />
      )}
    </div>
  );
}
