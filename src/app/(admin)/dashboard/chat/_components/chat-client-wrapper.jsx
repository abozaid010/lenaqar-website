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
    <div className="relative container mx-auto flex flex-col h-full bg-gray-200 rounded-md pb-14">
      <ChatHistory data={chatHistory} />

      {/* Render the form and notify ChatHistory of new messages */}
      <SendNewMessageForm userId={userId} onNewMessage={onNewMessage} />
    </div>
  );
}
