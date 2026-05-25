"use client";
import { Bot, X } from "lucide-react";
import { useState } from "react";

const ChatBot = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  // LenaAI Chat URL
  const chatUrl = "https://chat.lenaai.net/?campaign=lenaai_website";

  const openChat = () => setIsChatOpen(true);
  const closeChat = () => setIsChatOpen(false);

  return (
    <>
      {!isChatOpen && (
        <button
          type="button"
          onClick={openChat}
          className="fixed bottom-6 end-6 bg-gradient-to-r from-[#3926A7] to-[#21EAF4] text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 flex items-center justify-center z-40"
          aria-label="Open chat"
        >
          <Bot size={28} />
        </button>
      )}

      {/* Chat Popup with iFrame - removed scrollbars */}
      <div
        className={`fixed bottom-4 end-4 w-90 h-[620px] bg-white rounded-lg shadow-2xl z-50 transition-all duration-300 transform ${isChatOpen ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none"} flex flex-col`}
      >
        <div className="bg-gradient-to-r from-[#3926A7] to-[#21EAF4] px-4 py-2 flex justify-between items-center rounded-t-lg">
          <div className="flex items-center space-x-2">
            <Bot size={24} className="text-white" />
            <h3 className="text-lg font-medium text-white">LenaAI Assistant</h3>
          </div>
          <button
            type="button"
            onClick={closeChat}
            className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
            aria-label="Close chat"
          >
            <X size={20} />
          </button>
        </div>

        {/* Chat iFrame - removed all scrolling */}
        <div className="flex-grow">
          {isChatOpen && (
            <iframe
              src={chatUrl}
              title="LenaAI Chat"
              className="w-full h-full border-0"
              allow="microphone; camera; geolocation"
              loading="lazy"
              scrolling="no"
              style={{ overflow: "hidden" }}
            ></iframe>
          )}
        </div>
      </div>
    </>
  );
};

export default ChatBot;
