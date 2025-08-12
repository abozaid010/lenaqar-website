"use client";
import { Bot, X } from "lucide-react";
import { useState } from "react";

const UnitDetailsChatBot = ({
  isInline = false,
  unitId = null,
  client_id = null,
}) => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  // LenaAI Chat URL with unit ID parameter
  const chatUrl =
    client_id && unitId
      ? `https://chat.lenaai.net?client_id=${encodeURIComponent(client_id)}&unit_id=${encodeURIComponent(unitId)}`
      : unitId && !client_id
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
  return (
    <>
      {/* Floating Chatbot Button for Mobile */}
      <button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-[#3926A7] to-[#21EAF4] text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 flex items-center justify-center z-40 xl:hidden"
        aria-label="Toggle Chat"
      >
        <Bot size={28} />
      </button>

      {/* Chat Popup for Mobile */}
      <div
        className={`fixed inset-0 bg-black/50 z-50 xl:hidden ${isChatOpen ? "opacity-100" : "opacity-0 pointer-events-none"} transition-opacity duration-300`}
      >
        <div
          className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-lg shadow-2xl transition-transform duration-300 ${isChatOpen ? "translate-y-0" : "translate-y-full"} h-5/6 flex flex-col`}
        >
          {/* Mobile Chat Header */}
          <div className="bg-gradient-to-r from-[#3926A7] to-[#21EAF4] p-4 flex justify-between items-center rounded-t-lg">
            <div className="flex items-center space-x-2">
              <Bot size={24} className="text-white" />
              <h3 className="text-lg font-medium text-white">
                LenaAI Assistant
              </h3>
            </div>
            <button
              onClick={toggleChat}
              className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Mobile Chat iFrame */}
          <div className="flex-1 overflow-hidden">
            {isChatOpen && (
              <iframe
                src={chatUrl}
                title="LenaAI Chat"
                className="w-full h-full border-0"
                allow="microphone; camera; geolocation"
                loading="lazy"
                scrolling="no"
                style={{ overflow: "hidden" }}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default UnitDetailsChatBot;
