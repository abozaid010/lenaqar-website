"use client";

import { useI18n } from "@/context/translate-api";
import { toggleAutoReply } from "@/utils/api";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

export default function ToggleReplyType({ userId, clientID, source }) {
  const [autoReply, setAutoReply] = useState("auto_reply");
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useI18n();
  const handleChange = async (e) => {
    setIsLoading(true);
    setAutoReply(e.target.value);

    const result = await toggleAutoReply(
      userId,
      clientID,
      e.target.value === "auto_reply",
      source
    );

    if (result.success) {
      toast.success("Auto-reply toggled successfully");
    } else {
      toast.error("Failed to toggle auto-reply");
    }
    setIsLoading(false);
  };

  return (
    <form onSubmit={(e) => e.preventDefault()} className="relative">
      <div className="relative w-fit">
        <select
          className="appearance-none bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 pl-2 py-1 pr-8"
          name="reply_type"
          value={autoReply}
          onChange={handleChange}
          disabled={isLoading}
        >
          <option value="auto_reply">{t.Ai}</option>
          <option value="manual_reply">{t.manual}</option>
        </select>
        <ChevronDown
          size={20}
          className="text-gray-500 absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none"
        />
      </div>
    </form>
  );
}
