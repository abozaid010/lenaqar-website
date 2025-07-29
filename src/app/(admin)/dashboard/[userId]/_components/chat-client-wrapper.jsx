"use client";

import LoadingSpinner from "@/components/ui/loading-spinner";
import { getChatHistory, resetUnreadMessagesCount } from "@/utils/api";
import { useQuery } from "@tanstack/react-query";
import { CircleX } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import ChatHistory from "./chat-history";
import ChatWith from "./chat-with";
import NavigationButtons from "./NavigationButtons";
import ToggleReplyType from "./reply-type";
import SendNewMessageForm from "./send-new-message";
import ShowRequirementBtn from "./showRequirementBtn";

export default function ChatClientWrapper({ userId }) {
  const [chatHistory, setChatHistory] = useState([]);

  const { data, error, isLoading } = useQuery({
    queryKey: ["chatHistory", userId],
    queryFn: () => getChatHistory(userId),
    staleTime: 1000 * 60 * 15, // 15 minutes
    refetchOnWindowFocus: false,
  });

  const onNewMessage = (newMessage) => {
    setChatHistory((prev) => [...prev, newMessage]);
  };

  useEffect(() => {
    async function resetUnread(userId) {
      await resetUnreadMessagesCount(userId);
    }
    if (!isLoading && data) {
      setChatHistory(data.data.messages || []);

      if (data.data.unread_messages_count !== 0) {
        resetUnread(userId);
      }
    }
  }, [isLoading]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <CircleX className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-red-700">An Error Occurred</h1>
        <p className="text-gray-600 mt-2 text-center">
          Sorry, something went wrong or you do not have permission to view this
          chat.
          <br />
          Please try again later or contact support if the issue persists.
        </p>
        <Link
          href="/dashboard"
          className="underline text-sm text-blue-700 mt-4"
        >
          Go Back to Dashboard
        </Link>
      </div>
    );
  }
  return (
    <>
      <div className="flex items-center justify-between bg-white px-4 py-2 rounded-md shadow-md h-auto">
        <div className="flex items-center gap-3">
          <NavigationButtons id={userId} />
          <ChatWith name={data.data.name} />
        </div>
        <div className="flex items-center gap-3">
          <ShowRequirementBtn
            id={userId}
            name={data.data.name}
            phoneNumber={data.data.phoneNumber || null}
          />
          <ToggleReplyType
            userId={userId}
            clientID={data.data.client_id}
            source={data.data.source || null}
          />
          <Link
            href={`/dashboard`}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            <CircleX size={26} color="red" />
          </Link>
        </div>
      </div>

      <div className="flex-1 h-[90%]">
        <div className="flex flex-col gap-3 bg-gray-100 rounded-md h-full !px-0">
          <div className="flex-1 overflow-y-auto rounded-lg px-4 pt-4">
            <ChatHistory data={chatHistory} />
          </div>

          <SendNewMessageForm userId={userId} onNewMessage={onNewMessage} />
        </div>
      </div>
    </>
  );
}
