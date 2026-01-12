"use client";

import LoadingSpinner from "@/components/ui/loading-spinner";
import { getChatHistory, resetUnreadMessagesCount } from "@/utils/api";
import { handleOpenWhatsApp, handleCopyPhoneNumber } from "@/utils/phone-utils";
import { useQuery } from "@tanstack/react-query";
import { CircleX, Copy } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
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

  if (!data || !data.data) {
    return <LoadingSpinner />;
  }

  // Get phone number from data (try different possible field names)
  const phoneNumber = data?.data?.phoneNumber || data?.data?.phone_number || null;

  return (
    <>
      <div className="flex items-center justify-between bg-white px-4 py-2 rounded-md shadow-md h-auto">
        <div className="flex items-center gap-3">
          <NavigationButtons id={userId} />
          <ChatWith name={data.data.name} />
          {phoneNumber && (
            <div className="flex items-center gap-2 px-2 py-1 bg-gray-50 rounded-md">
              <a
                href={`tel:${phoneNumber}`}
                className="text-sm text-gray-700 hover:text-primary transition-colors font-medium"
                onClick={(e) => e.stopPropagation()}
              >
                {phoneNumber}
              </a>
              <button
                onClick={(e) =>
                  handleCopyPhoneNumber(
                    e,
                    phoneNumber,
                    () => toast.success("Phone number copied"),
                    () => toast.error("Failed to copy phone number")
                  )
                }
                className="p-1 hover:bg-gray-200 rounded transition-colors"
                title="Copy phone number"
              >
                <Copy size={16} className="text-gray-600" />
              </button>
              <button
                onClick={(e) => handleOpenWhatsApp(e, phoneNumber)}
                className="p-1 bg-green-500 hover:bg-green-600 rounded-full shadow transition-all duration-200 flex items-center justify-center"
                title="Open WhatsApp"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4 text-white"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.188z" />
                </svg>
              </button>
            </div>
          )}
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
