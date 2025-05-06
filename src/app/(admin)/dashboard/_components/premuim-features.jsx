"use client";

import { MessageSquare, Crown, Lock } from "lucide-react";
import { useI18n } from "@/context/translate-api";

export default function PremiumFeatures() {
  const { t } = useI18n();

  return (
    <div className="flex items-center justify-end gap-2">
      <button
        className="w-full sm:w-auto bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 cursor-not-allowed relative group"
        disabled
      >
        <MessageSquare size={16} className="hidden sm:block" />
        {t.dashboardFilter.whatsappButton}
        <span className="absolute -top-2 -right-2 bg-yellow-500 text-xs text-white p-1 rounded-full">
          <Crown size={12} />
        </span>
        <div className="hidden group-hover:block absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap">
          {t.dashboardFilter.premuim}
        </div>
      </button>

      <button
        className="w-full sm:w-auto bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 cursor-not-allowed relative group"
        disabled
      >
        <Lock size={16} className="hidden sm:block" />
        {t.dashboardFilter.ADD}
        <span className="absolute -top-2 -right-2 bg-yellow-500 text-xs text-white p-1 rounded-full">
          <Crown size={12} />
        </span>
        <div className="hidden group-hover:block absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap">
          {t.dashboardFilter.premuim}
        </div>
      </button>
    </div>
  );
}
