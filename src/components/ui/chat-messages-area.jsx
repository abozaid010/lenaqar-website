"use client";

import ChatWallpaper from "@/components/ui/chat-wallpaper";

export default function ChatMessagesArea({
  children,
  className = "",
  contentClassName = "py-3 px-4",
}) {
  return (
    <div className={`chat-messages-shell flex flex-col min-h-0 ${className}`.trim()}>
      <ChatWallpaper />
      <div className={`chat-messages-content ${contentClassName}`.trim()}>
        {children}
      </div>
    </div>
  );
}
