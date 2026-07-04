"use client";

import ChatMessagesArea from "@/components/ui/chat-messages-area";
import ChatHistory from "@/components/chat/chat-history";
import ChatInput from "@/components/chat/chat-input";
import ChatConversationSkeleton from "@/components/chat/chat-conversation-skeleton";
import { useConversation } from "@/hooks/useConversation";
import { useI18n } from "@/hooks/useI18n";
import { formatPhoneForDisplay } from "@/components/phone/phone-utils";
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
  /** @deprecated Use headerName instead */
  conversationLabel?: string | null;
  headerName?: string | null;
  headerPhone?: string | null;
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
  conversationLabel,
  headerName,
  headerPhone,
}: ChatConversationProps) {
  const { translate } = useI18n();

  const {
    messages,
    meta,
    isLoading,
    isError,
    onNewMessage,
    queryKey,
  } = useConversation({
    userId,
    phoneNumber,
    clientId,
    messageLimit:
      messageLimit ??
      (userId ? LEAD_CONVERSATION_MESSAGE_LIMIT : UNIT_CONVERSATION_MESSAGE_LIMIT),
  });

  const resolvedUserId = meta.userId ?? userId ?? null;
  const resolvedChatId = meta.chatId ?? chatId ?? null;
  const resolvedPhone = meta.phoneNumber ?? phoneNumber ?? null;
  const resolvedClientId = meta.clientId ?? clientId ?? null;

  const displayHeaderName =
    headerName?.trim() || meta.name?.trim() || null;
  const displayHeaderPhone =
    headerPhone?.trim() ||
    formatPhoneForDisplay(resolvedPhone ?? "", "EG") ||
    resolvedPhone;

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
      {displayHeaderName || displayHeaderPhone ? (
        <div className="px-3 py-2.5 border-b border-gray-100 bg-white space-y-0.5">
          {displayHeaderName ? (
            <p className="text-sm font-semibold text-gray-900 truncate">
              {displayHeaderName}
            </p>
          ) : null}
          {displayHeaderPhone ? (
            <p className="text-xs text-gray-600" dir="ltr">
              {displayHeaderPhone}
            </p>
          ) : null}
        </div>
      ) : conversationLabel ? (
        <div className="px-3 py-2 border-b border-gray-100 bg-white">
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
            {conversationLabel}
          </p>
        </div>
      ) : null}

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
