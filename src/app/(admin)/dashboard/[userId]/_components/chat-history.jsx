"use client";

import { useEffect, useRef } from "react";
import { useI18n } from "@/hooks/useI18n";
import UserMessageCard from "./user-message";
import BotMessageCard from "./bot-message";

export default function ChatHistory({ data }) {
  const { t, translate } = useI18n();
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500 text-2xl font-meduim">
          {translate("chatHistory.noMessages", t?.chatHistory?.noMessages)}
        </p>
      </div>
    );
  }

  return (
    <>
      {data.map((message, index) => (
        <div key={index} className="w-full flex flex-col">
          {message.user_message && (
            <div className="flex justify-end mb-3">
              <UserMessageCard
                message={message.user_message}
                timestamp={message.timestamp}
              />
            </div>
          )}

          <div className="flex justify-start mb-3">
            <BotMessageCard message={message} />
          </div>
        </div>
      ))}

      {/* Invisible div to scroll to */}
      <div ref={chatEndRef} />
    </>
  );
}
