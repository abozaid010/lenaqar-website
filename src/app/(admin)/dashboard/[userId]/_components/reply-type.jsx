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
      toast.success(t?.common?.autoReplyToggled);
    } else {
      toast.error(t?.common?.failedToToggleAutoReply);
    }
    setIsLoading(false);
  };

  return (
    <form onSubmit={(e) => e.preventDefault()} className="relative flex items-center">
      <div className="relative w-fit flex items-center">
        <select
          className="appearance-none block w-full min-h-[40px] rounded-md border py-2 px-3 bg-white text-gray-900 focus:outline-none focus:ring-2 text-start border-gray-300 focus:ring-blue-500 focus:border-blue-500 pr-10 text-sm disabled:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
          name="reply_type"
          value={autoReply}
          onChange={handleChange}
          disabled={isLoading}
        >
          <option value="auto_reply">{t.Ai}</option>
          <option value="manual_reply">{t.manual}</option>
        </select>
        <ChevronDown
          size={16}
          className="text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
        />
      </div>
    </form>
  );
}
