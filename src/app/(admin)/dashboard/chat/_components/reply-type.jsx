"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { toggleAutoReply } from "@/components/services/serviceFetching";
import { useI18n } from "@/context/translate-api";
export default function ToggleReplyType({ phoneNumber, clientID }) {
  const [autoReply, setAutoReply] = useState("auto_reply");
  const [isLoading, setIsLoading] = useState(false);
  const { t }= useI18n();
  const handleChange = async (e) => {
    setIsLoading(true);
    setAutoReply(e.target.value);

    const result = await toggleAutoReply(
      phoneNumber,
      clientID,
      e.target.value === "auto_reply"
    );

    if (result.success) {
      toast.success("Auto-reply toggled successfully");
    } else {
      toast.error("Failed to toggle auto-reply");
    }
    setIsLoading(false);
  };

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <input type="hidden" name="phone_number" value={phoneNumber} />
      <input type="hidden" name="client_id" value={clientID} />

      <select
        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 px-2.5 py-1"
        name="reply_type"
        value={autoReply}
        onChange={handleChange}
        disabled={isLoading}
      >
        <option value="auto_reply"> {t.Ai}</option>
        <option value="manual_reply"> {t.manual}</option>
      </select>
    </form>
  );
}
