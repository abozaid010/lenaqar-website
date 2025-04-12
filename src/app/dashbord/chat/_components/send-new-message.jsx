"use client";

import { useActionState, useState } from "react";
import { sendNewMessage } from "../_actions/actions";
import { Loader2 } from "lucide-react";

const initialState = {
  success: false,
  message: "",
};

export default function SendNewMessageForm({ userId }) {
  const [state, action, pending] = useActionState(sendNewMessage, initialState);
  const [message, setMessage] = useState("");

  return (
    <form
      action={action}
      className="absolute bottom-0 left-0 right-0 bg-white h-14 px-2 flex gap-2 items-center justify-center shadow-xl rounded-b-md"
    >
      <input type="hidden" name="userId" value={userId} />

      <input
        type="text"
        name="message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your message..."
        className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <button
        disabled={pending || !message}
        className="w-[80px] flex justify-center items-center bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 cursor-pointer disabled:opacity-60 disabled:cursor-auto disabled:hover:bg-blue-500"
      >
        {pending ? <Loader2 className="animate-spin" /> : "Send"}
      </button>
    </form>
  );
}
