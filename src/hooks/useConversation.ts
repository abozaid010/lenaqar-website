"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  LEAD_CONVERSATION_MESSAGE_LIMIT,
  UNIT_CONVERSATION_MESSAGE_LIMIT,
} from "@/constants/conversation-limits";
import {
  getChatHistory,
  getConversationByPhone,
  resetUnreadMessagesCount,
} from "@/utils/api";
import { normalizeConversationPhone } from "@/utils/normalize-conversation-phone";

export type ChatTurn = {
  user_message?: string;
  bot_response?: string;
  bot_message?: string;
  timestamp?: number | string;
  source?: string;
  role?: string;
  [key: string]: unknown;
};

export type ConversationMeta = {
  userId?: string | null;
  chatId?: string | null;
  phoneNumber?: string | null;
  clientId?: string | null;
  name?: string | null;
};

export interface UseConversationOptions {
  userId?: string | null;
  phoneNumber?: string | null;
  clientId?: string | null;
  /** When set, loads via GET /messages/conversation/{userId} */
  messageLimit?: number;
}

export function conversationQueryKey({
  userId,
  phoneNumber,
  clientId,
  messageLimit,
}: UseConversationOptions) {
  if (userId) {
    return [
      "chatHistory",
      userId,
      messageLimit ?? LEAD_CONVERSATION_MESSAGE_LIMIT,
    ] as const;
  }

  const normalized = normalizeConversationPhone(phoneNumber ?? "") ?? "";
  return [
    "conversationByPhone",
    normalized,
    clientId ?? "",
    messageLimit ?? UNIT_CONVERSATION_MESSAGE_LIMIT,
  ] as const;
}

export function useConversation({
  userId,
  phoneNumber,
  clientId,
  messageLimit,
}: UseConversationOptions) {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<ChatTurn[]>([]);

  const normalizedPhone = useMemo(() => {
    if (!phoneNumber) return null;
    return normalizeConversationPhone(phoneNumber);
  }, [phoneNumber]);

  const resolvedLimit = useMemo(() => {
    if (messageLimit != null) return messageLimit;
    return userId
      ? LEAD_CONVERSATION_MESSAGE_LIMIT
      : UNIT_CONVERSATION_MESSAGE_LIMIT;
  }, [messageLimit, userId]);

  const queryKey = useMemo(
    () =>
      conversationQueryKey({
        userId,
        phoneNumber: normalizedPhone,
        clientId,
        messageLimit: resolvedLimit,
      }),
    [userId, normalizedPhone, clientId, resolvedLimit],
  );

  const fetchByUserId = Boolean(userId);
  const fetchByPhone = !fetchByUserId && Boolean(normalizedPhone);

  const { data, error, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey,
    queryFn: () =>
      fetchByUserId
        ? getChatHistory(userId!, { limit: resolvedLimit })
        : getConversationByPhone(normalizedPhone!, {
            client_id: clientId ?? undefined,
            limit: resolvedLimit,
          }),
    enabled: fetchByUserId || fetchByPhone,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (isLoading) return;

    const payload = data?.data;
    if (payload) {
      setMessages(Array.isArray(payload.messages) ? payload.messages : []);

      if (userId && payload.unread_messages_count !== 0) {
        void resetUnreadMessagesCount(userId);
      }
      return;
    }

    if (!isError) {
      setMessages([]);
    }
  }, [isLoading, isError, data, userId]);

  const meta: ConversationMeta = useMemo(
    () => ({
      userId:
        (data?.data?.user_id as string | undefined) ??
        (data?.data?.userId as string | undefined) ??
        userId ??
        null,
      chatId: (data?.data?.chat_id as string | undefined) ?? null,
      phoneNumber:
        (data?.data?.phone_number as string | undefined) ??
        (data?.data?.phoneNumber as string | undefined) ??
        normalizedPhone,
      clientId:
        (data?.data?.client_id as string | undefined) ?? clientId ?? null,
      name: (data?.data?.name as string | undefined) ?? null,
    }),
    [data, userId, normalizedPhone, clientId],
  );

  const onNewMessage = useCallback(
    (newMessage: ChatTurn) => {
      setMessages((prev) => [...prev, newMessage]);
    },
    [],
  );

  const invalidateConversation = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  return {
    messages,
    meta,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
    onNewMessage,
    invalidateConversation,
    queryKey,
  };
}
