"use client";
import { useState } from "react";
import { Bot, X } from "lucide-react";

const ChatBot = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // LenaAI Chat URL
  const chatUrl = "https://chat.lenaai.net/demo";

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  return (
    <>
      {/* Floating Chatbot Button */}
      <button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-[#3926A7] to-[#21EAF4] text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 flex items-center justify-center z-40"
        aria-label="Toggle Chat"
      >
        <Bot size={28} />
      </button>
      
      {/* Chat Popup with iFrame - removed scrollbars */}
      <div className={`fixed bottom-4 right-4 w-80 lg:w-96 h-96 lg:h-5/6 bg-white rounded-lg shadow-2xl z-50 transition-all duration-300 transform ${isChatOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'} flex flex-col`}>
        {/* Chat Header */}
        <div className="bg-primary p-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Bot size={20} className="text-white" />
            <h3 className="text-lg font-medium text-white">LenaAI Chat</h3>
          </div>
          <button 
            onClick={toggleChat}
            className="text-white hover:bg-blue-700 p-1 rounded-full transition-colors"
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
              style={{ overflow: 'hidden' }}
            ></iframe>
          )}
        </div>
      </div>
    </>
  );
};

export default ChatBot;