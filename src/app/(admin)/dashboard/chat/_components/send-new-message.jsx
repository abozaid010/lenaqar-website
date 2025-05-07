"use client";

import { useEffect, useActionState, useState } from "react";
import { sendNewMessage } from "../_actions/actions";
import { Crown, Loader2 } from "lucide-react";
import { useI18n } from "@/context/translate-api";
const initialState = {
  success: false,
  message: "",
};

export default function SendNewMessageForm({ userId, onNewMessage }) {
  const [state, action, pending] = useActionState(sendNewMessage, initialState);
  const [message, setMessage] = useState("");
  const { t } = useI18n();
  useEffect(() => {
    if (state.success) {
      const newMessage = {
        user_message: "",
        platform: "website",
        bot_response: message,
        properties: "",
        timeStamp: new Date().valueOf(), // Get current
      };

      setMessage(""); // Clear the message input after successful submission
      onNewMessage(newMessage); // Call the parent function to update the chat history
    } else if (state.message) {
      // Handle errors
      console.error("Error sending message:", state.message);
    }
  }, [state]);

  return (
    <form className="bg-white h-14 px-2 flex gap-2 items-center justify-center shadow-xl rounded-b-md">
      <input type="hidden" name="userId" value={userId} />

      <input
        type="text"
        name="message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your message..."
        className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {/* <button
      
        // disabled={pending || !message}
        className={`w-[80px] text-white px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 relative group
    ${pending || !message ? "bg-gray-400 cursor-not-allowed" : "bg-primary hover:bg-primary-dark cursor-pointer"}`}
      >
        {pending ? <Loader2 className="animate-spin" /> : "Send"}
        <span className="absolute -top-2 -right-2 bg-yellow-500 text-xs text-white p-1 rounded-full">
          <Crown size={12} />
        </span>
        <div className="hidden group-hover:block absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap">
          {t?.dashboardFilter?.premuim || "Premium"}
        </div>
      </button> */}
      <button
        disabled
        className={`w-[80px] text-white px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 relative group
   bg-gray-400 cursor-not-allowed" }`}
      >
        {pending ? <Loader2 className="animate-spin" /> : "Send"}
        <span className="absolute -top-2 -right-2 bg-yellow-500 text-xs text-white p-1 rounded-full">
          <Crown size={12} />
        </span>
        <div className="hidden group-hover:block absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap">
          {t?.dashboardFilter?.premuim || "Premium"}
        </div>
      </button>
    </form>
  );
}
