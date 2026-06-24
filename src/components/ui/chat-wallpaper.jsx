"use client";

/**
 * WhatsApp light-mode doodle wallpaper layer.
 * Sits behind chat messages; opacity tuned in globals.css (.chat-bg).
 */
export default function ChatWallpaper() {
  return <div className="chat-bg" aria-hidden="true" />;
}
