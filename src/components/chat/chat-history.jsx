"use client";

import { useEffect, useRef } from "react";
import ChatDatePill from "@/components/ui/chat-date-pill";
import { useI18n } from "@/hooks/useI18n";
import {
  formatChatDatePillLabel,
  shouldShowChatDatePill,
} from "@/utils/chat-date-format";
import { getChatBubbleVariant } from "@/utils/chat-message-source";
import {
  hasBotTurnContent,
  hasUserTurnContent,
  resolveUserTurnImageUrl,
} from "@/utils/imageUtils";
import UserMessageCard from "@/app/(admin)/dashboard/[userId]/_components/user-message";
import BotMessageCard from "@/app/(admin)/dashboard/[userId]/_components/bot-message";

export default function ChatHistory({
  data,
  emptyMessage,
  className = "",
}) {
  const { translate, locale } = useI18n();
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div
        className={`flex items-center justify-center h-full min-h-[8rem] px-4 ${className}`}
      >
        <p className="text-chat-text-muted text-sm font-medium text-center">
          {emptyMessage ??
            translate(
              "chatConversation.emptyState",
              "No conversation yet. Start by sending a message.",
            )}
        </p>
      </div>
    );
  }

  let previousTimestamp = null;

  return (
    <div className={className}>
      {data.map((message, index) => {
        const turnTimestamp = message.timestamp;
        const showDatePill = shouldShowChatDatePill(
          turnTimestamp,
          previousTimestamp,
        );
        if (turnTimestamp) previousTimestamp = turnTimestamp;

        const userVariant = getChatBubbleVariant(message);

        return (
          <div key={index} className="w-full flex flex-col">
            {showDatePill && (
              <ChatDatePill
                label={formatChatDatePillLabel(
                  turnTimestamp,
                  locale,
                  translate,
                )}
              />
            )}

            {hasUserTurnContent(message) && (
              <div
                className={`flex mb-1 px-1 ${
                  userVariant === "outgoing" ? "justify-end" : "justify-start"
                }`}
              >
                <UserMessageCard
                  message={message.user_message}
                  imageUrl={resolveUserTurnImageUrl(message)}
                  timestamp={message.timestamp}
                  variant={userVariant}
                />
              </div>
            )}

            {hasBotTurnContent(message) && (
              <div className="flex justify-end mb-1 px-1">
                <BotMessageCard message={message} variant="outgoing" />
              </div>
            )}
          </div>
        );
      })}

      <div ref={chatEndRef} />
    </div>
  );
}
