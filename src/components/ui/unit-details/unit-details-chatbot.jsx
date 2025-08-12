"use client";
import { Bot } from "lucide-react";
import { useState } from "react";
import ChatBot from "../ChatBot";

const UnitDetailsChatBot = ({ isInline = false, unitId = null }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  // LenaAI Chat URL with unit ID parameter
  const chatUrl = unitId
    ? `https://chat.lenaai.net?unit_id=${encodeURIComponent(unitId)}`
    : "https://chat.lenaai.net";

  console.log(chatUrl);
  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  if (isInline) {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-[#3926A7] to-[#21EAF4] p-4 flex justify-between items-center">
          <div className="flex items-center justify-end w-full space-x-2">
            <h3 className="text-lg font-medium text-white">LenaAI Assistant</h3>
            <Bot size={20} className="text-white" />
          </div>
        </div>

        {/* Desktop Inline Chat iFrame */}
        <div className="h-96 lg:h-[580px]">
          <iframe
            src={chatUrl}
            title="LenaAI Chat"
            className="w-full h-full border-0"
            allow="microphone; camera; geolocation"
            loading="lazy"
            scrolling="no"
            style={{ overflow: "hidden" }}
          />
        </div>
      </div>
    );
  }

  // Mobile version - floating button
  return <ChatBot />;
};

export default UnitDetailsChatBot;
