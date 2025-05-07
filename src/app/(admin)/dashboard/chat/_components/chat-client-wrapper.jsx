"use client";

import SendNewMessageForm from "../_components/send-new-message";
import ChatHistory from "../_components/chat-history";

import { useState } from "react";

export default function ChatClientWrapper({ initialData, userId }) {
  const [chatHistory, setChatHistory] = useState(initialData);

  const onNewMessage = (newMessage) => {
    setChatHistory((prev) => [...prev, newMessage]);
  };

  return (
    <div className="container mx-auto flex flex-col gap-3 bg-gray-100 rounded-md h-full">
      <div className="flex-1 overflow-y-auto rounded-lg px-4 pt-4">
        <ChatHistory data={chatHistory} />
      </div>

      {/* Render the form and notify ChatHistory of new messages */}
      <SendNewMessageForm userId={userId} onNewMessage={onNewMessage} />
    </div>
  );
}
