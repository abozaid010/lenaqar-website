"use client";

import SafeImage from "@/components/ui/safe-image";
import ChatMessageBubble from "@/components/ui/chat-message-bubble";
import { useI18n } from "@/hooks/useI18n";
import { formatChatMessageTime } from "@/utils/chat-date-format";
import { resolveChatMessageImageUrl, getDisplayUserMessageText } from "@/utils/imageUtils";

export default function UserMessageCard({
  message,
  imageUrl,
  timestamp,
  variant = "incoming",
}) {
  const { locale } = useI18n();
  const messageText = getDisplayUserMessageText(message);
  const resolvedImageUrl = resolveChatMessageImageUrl(imageUrl);
  const isOutgoing = variant === "outgoing";
  const timeLabel = formatChatMessageTime(timestamp, locale);

  if (!messageText && !resolvedImageUrl) {
    return null;
  }

  return (
    <div className={`flex flex-col ${isOutgoing ? "items-end" : "items-start"} max-w-[min(65%,28rem)]`}>
      {resolvedImageUrl && (
        <SafeImage
          src={resolvedImageUrl}
          alt=""
          width={240}
          height={240}
          className="max-w-[240px] max-h-[240px] rounded-lg mb-1 object-cover shadow-sm"
        />
      )}
      {messageText && (
        <ChatMessageBubble
          variant={isOutgoing ? "outgoing" : "incoming"}
          timestamp={timeLabel}
          showReadTicks={isOutgoing}
        >
          {messageText}
        </ChatMessageBubble>
      )}
    </div>
  );
}
