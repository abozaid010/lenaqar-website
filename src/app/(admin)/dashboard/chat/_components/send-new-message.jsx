"use client";

import { useI18n } from "@/context/translate-api";
import Cookies from "js-cookie";
import { Loader2 } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { sendNewMessage } from "../_actions/actions";
const initialState = {
  success: false,
  message: "",
};

export default function SendNewMessageForm({ userId, onNewMessage }) {
  const [state, action, pending] = useActionState(sendNewMessage, initialState);
  const [message, setMessage] = useState("");
  const { t } = useI18n();
  const client_id = Cookies.get("lena-website-client_id");
  console.log(userId);
  console.log(state.message);
  const [formData, setFormData] = useState({
    client_message: "",
    user_id: userId,
    // client_id: client_id,
    platform: "website",
    source: "human",
  });
  useEffect(() => {
    if (state.success) {
      setFormData({
        ...formData,
        client_message: "",
      });
      console.log(state);
      setMessage(""); // Clear the message input after successful submission
      onNewMessage(state.message); // Call the parent function to update the chat history
    } else if (state.message) {
      // Handle errors
      console.error("Error sending message:", state.message);
    }
  }, [state]);

  return (
    <form
      className="bg-white h-14 px-2 flex gap-2 items-center justify-center shadow-xl rounded-b-md"
      action={action}
    >
      <input type="hidden" name="user_id" value={userId} />
      <input type="hidden" name="client_id" value={client_id} />

      <input
        type="text"
        name="client_message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={t.typeYourMessage}
        className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <button
        disabled={pending || !message}
        className={`w-[80px] text-white px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 relative group
    ${pending || !message ? "bg-gray-400 cursor-not-allowed" : "bg-primary hover:bg-primary-dark cursor-pointer"}`}
      >
        {pending ? <Loader2 className="animate-spin" /> : t.send}
      </button>
    </form>
  );
}
