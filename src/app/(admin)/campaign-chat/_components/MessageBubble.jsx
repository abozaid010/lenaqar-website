"use client";

import SafeImage from "@/components/ui/safe-image";
import ChatDatePill from "@/components/ui/chat-date-pill";
import ChatMessageBubble from "@/components/ui/chat-message-bubble";
import { useI18n } from "@/hooks/useI18n";
import {
  formatChatDatePillLabel,
  formatChatMessageTime,
  shouldShowChatDatePill,
} from "@/utils/chat-date-format";
import { getChatBubbleVariant } from "@/utils/chat-message-source";
import { getClientLogoDisplayUrl, getDisplayImageUrl, getDisplayUserMessageText } from "@/utils/imageUtils";

function resolveChatImageUrl(url) {
  if (!url) return null;

  const trimmed = String(url).trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return getDisplayImageUrl(trimmed);
  }

  return getClientLogoDisplayUrl(trimmed);
}

function MessageBubbleItem({ message, translate, locale }) {
  const variant = getChatBubbleVariant(message);
  const isOutgoing = variant === "outgoing";

  const formatMessageContent = (content) => {
    if (!content) return "";

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = content.split(urlRegex);

    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  const role = message.role;
  const isUser = role === "user";
  const isAssistant = role === "assistant";
  const isAdmin = role === "admin";

  if (!isUser && !isAssistant && !isAdmin) {
    return null;
  }

  const showTemplateTag = isAdmin && message.template_name;
  const showAutomationBadge =
    message.source === "wa_automation" || message.source === "whatsapp_automation";
  const messageText = isUser
    ? getDisplayUserMessageText(message.content)
    : message.content
      ? String(message.content).trim()
      : "";
  const imageUrl = resolveChatImageUrl(message.image_url);
  const timeLabel = formatChatMessageTime(message.timestamp, locale);

  if (!messageText && !imageUrl && !showTemplateTag) {
    return null;
  }

  return (
    <div className={`flex ${isOutgoing ? "justify-end" : "justify-start"} mb-1 px-1`}>
      <div className={`flex flex-col max-w-[70%] ${isOutgoing ? "items-end" : "items-start"}`}>
        {showTemplateTag && (
          <div className="mb-1.5 px-2 py-0.5 bg-chat-panel-alt text-chat-text-muted rounded-full text-[10px] font-mono flex items-center gap-1">
            <span>Tag</span>
            {message.template_name}
            {message.language_code && (
              <span className="text-[10px] bg-chat-hover px-1 rounded">[{message.language_code}]</span>
            )}
          </div>
        )}

        {imageUrl && (
          <SafeImage
            src={imageUrl}
            alt={translate("campaignChat.messageImage", "Message image")}
            width={240}
            height={240}
            className="max-w-[240px] max-h-[240px] rounded-lg mb-1 object-cover shadow-sm"
          />
        )}

        {messageText && (
          <ChatMessageBubble
            variant={variant}
            timestamp={timeLabel}
            showReadTicks={isOutgoing}
          >
            {formatMessageContent(messageText)}
          </ChatMessageBubble>
        )}

        {showAutomationBadge && !messageText && (
          <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-[10px] font-medium mt-1">
            {translate("campaignChat.automationBadge", "Automation")}
          </span>
        )}
      </div>
    </div>
  );
}

export function MessageBubble({ message }) {
  const { translate, locale } = useI18n();
  return <MessageBubbleItem message={message} translate={translate} locale={locale} />;
}

export default function MessageBubbleList({ messages }) {
  const { translate, locale } = useI18n();

  if (!messages?.length) return null;

  let previousTimestamp = null;

  return (
    <>
      {messages.map((msg, index) => {
        const showDatePill = shouldShowChatDatePill(msg.timestamp, previousTimestamp);
        if (msg.timestamp) previousTimestamp = msg.timestamp;

        return (
          <div key={`${msg.timestamp || "t"}-${index}`}>
            {showDatePill && (
              <ChatDatePill
                label={formatChatDatePillLabel(msg.timestamp, locale, translate)}
              />
            )}
            <MessageBubbleItem message={msg} translate={translate} locale={locale} />
          </div>
        );
      })}
    </>
  );
}
