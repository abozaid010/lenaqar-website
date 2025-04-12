"use client";

import { useEffect, useRef } from "react";
import UserMessageCard from "./user-message";
import BotMessageCard from "./bot-message";

export default function ChatHistory({ data }) {
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [data]);

  return (
    <div className="rounded-lg px-4 pt-4 overflow-y-auto h-full">
      {data.map((message, index) => (
        <div key={index} className="w-full flex flex-col">
          {message.user_message && (
            <div className="flex justify-end mb-3">
              <UserMessageCard message={message.user_message} />
            </div>
          )}

          <div className="flex justify-start mb-3">
            <BotMessageCard message={message} />
          </div>
        </div>
      ))}

      {/* Invisible div to scroll to */}
      <div ref={chatEndRef} />
    </div>
  );
}
