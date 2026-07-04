"use client";

import { useEffect } from "react";
import ChatMessagesArea from "@/components/ui/chat-messages-area";
import ChatHistory from "@/components/chat/chat-history";
import ChatInput from "@/components/chat/chat-input";
import ChatConversationSkeleton from "@/components/chat/chat-conversation-skeleton";
import { useConversation } from "@/hooks/useConversation";
import { useI18n } from "@/hooks/useI18n";
import {
  LEAD_CONVERSATION_MESSAGE_LIMIT,
  UNIT_CONVERSATION_MESSAGE_LIMIT,
} from "@/constants/conversation-limits";

export interface ChatConversationProps {
  userId?: string | null;
  phoneNumber?: string | null;
  chatId?: string | null;
  clientId?: string | null;
  unitUrl?: string | null;
  compact?: boolean;
  /** Expand message history to fill available parent height (sidebar layouts). */
  fillHeight?: boolean;
  /** Max messages to load. Defaults: leads 49, phone-only (unit) 30. */
  messageLimit?: number;
  className?: string;
  /** Exposes refetch/isFetching for external refresh controls (e.g. unit inquiry header). */
  onConversationControls?: (controls: {
    refetch: () => Promise<unknown>;
    isFetching: boolean;
  }) => void;
}

export default function ChatConversation({
  userId,
  phoneNumber,
  chatId,
  clientId,
  unitUrl,
  compact = false,
  fillHeight = false,
  messageLimit,
  className = "",
  onConversationControls,
}: ChatConversationProps) {
  const { translate } = useI18n();

  const {
    messages,
    meta,
    isLoading,
    isError,
    onNewMessage,
    queryKey,
    refetch,
    isFetching,
  } = useConversation({
    userId,
    phoneNumber,
    clientId,
    messageLimit:
      messageLimit ??
      (userId ? LEAD_CONVERSATION_MESSAGE_LIMIT : UNIT_CONVERSATION_MESSAGE_LIMIT),
  });

  useEffect(() => {
    onConversationControls?.({ refetch, isFetching });
  }, [onConversationControls, refetch, isFetching]);

  const resolvedUserId = meta.userId ?? userId ?? null;
  const resolvedChatId = meta.chatId ?? chatId ?? null;
  const resolvedPhone = meta.phoneNumber ?? phoneNumber ?? null;
  const resolvedClientId = meta.clientId ?? clientId ?? null;

  const shellClass = compact
    ? `flex flex-col min-h-0 rounded-lg border border-gray-100 bg-gray-50 overflow-hidden ${className}`
    : `flex flex-col flex-1 min-h-0 overflow-hidden ${className}`;

  const historyHeightClass =
    fillHeight || !compact ? "flex-1 min-h-0" : "max-h-[360px] min-h-[220px]";

  if (!userId && !phoneNumber) {
    return null;
  }

  return (
    <div className={shellClass}>
      <ChatMessagesArea
        className={historyHeightClass}
        contentClassName={compact ? "py-2 px-1.5 overflow-y-auto" : "py-3 px-2 overflow-y-auto"}
      >
        {isLoading ? (
          <ChatConversationSkeleton rows={compact ? 3 : 5} />
        ) : isError ? (
          <div className="flex items-center justify-center h-full min-h-[8rem] px-4">
            <p className="text-sm text-red-600 text-center">
              {translate(
                "chatConversation.loadFailed",
                "Could not load conversation. Please try again.",
              )}
            </p>
          </div>
        ) : (
          <ChatHistory
            data={messages}
            emptyMessage={translate(
              "chatConversation.emptyState",
              "No conversation yet. Start by sending a message.",
            )}
          />
        )}
      </ChatMessagesArea>

      <ChatInput
        userId={resolvedUserId}
        phoneNumber={resolvedPhone}
        chatId={resolvedChatId}
        clientId={resolvedClientId}
        outgoingUrl={unitUrl}
        onNewMessage={onNewMessage}
        conversationQueryKey={queryKey}
        compact={compact}
      />
    </div>
  );
}
