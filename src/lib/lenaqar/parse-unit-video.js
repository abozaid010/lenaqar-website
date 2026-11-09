const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
]);
const FACEBOOK_HOSTS = new Set([
  "facebook.com",
  "www.facebook.com",
  "m.facebook.com",
  "fb.watch",
]);
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const FILE_EXTENSIONS = [".mp4", ".webm"];
const MAX_LENGTH = 2048;

function parseHttpsUrl(raw) {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > MAX_LENGTH) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:" || url.username || url.password || url.port) {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}

function youtubeId(url) {
  const segments = url.pathname.split("/").filter(Boolean);
  if (url.hostname === "youtu.be") return segments[0];
  if (url.pathname === "/watch") return url.searchParams.get("v");
  if (segments[0] === "shorts" || segments[0] === "embed") return segments[1];
  return null;
}

/**
 * Strict allowlist parser for the owner-supplied unit `video` string.
 * Returns only a known-safe embed/file descriptor, or null. The raw string
 * never reaches the browser.
 *
 * @returns {{ provider: "youtube"|"facebook"|"file", src: string } | null}
 */
export function parseUnitVideo(raw, { videoBaseUrl } = {}) {
  const url = parseHttpsUrl(raw);
  if (!url) return null;

  if (YOUTUBE_HOSTS.has(url.hostname)) {
    const id = youtubeId(url);
    if (!id || !YOUTUBE_ID.test(id)) return null;
    return {
      provider: "youtube",
      src: `https://www.youtube-nocookie.com/embed/${id}`,
    };
  }

  if (FACEBOOK_HOSTS.has(url.hostname)) {
    if (url.pathname.length <= 1) return null;
    return {
      provider: "facebook",
      src: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url.href)}&show_text=false`,
    };
  }

  const base = parseHttpsUrl(videoBaseUrl);
  if (
    base &&
    url.hostname === base.hostname &&
    FILE_EXTENSIONS.some((ext) => url.pathname.toLowerCase().endsWith(ext))
  ) {
    return { provider: "file", src: url.href };
  }

  return null;
}
