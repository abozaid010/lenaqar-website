"use client";

import { useI18n } from "@/context/translate-api";
import { formatDateForDisplay } from "@/utils/formateDate";
import { X } from "lucide-react";
import NewActionForm from "./new-action-form";
const NOPREFRERED_TIME = [
  "Qualified lead",
  "Not interested",
  "Not qualified",
  "Follow up later",
  "Missing requirement",
];
export default function ActionsModal({
  actions,
  onClose,
  userId,
  phoneNumber,
  name,
  onActionUpdate,
}) {
  const { t } = useI18n();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 bg-opacity-50 p-4">
      <div className="relative w-full max-w-xl max-h-full bg-white rounded-lg shadow-lg">
        <div className="flex justify-between items-center p-3">
          <h3 className="text-lg font-semibold text-gray-800 text-center flex-1">
            {t.actionForm.aiAction}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none cursor-pointer"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {actions?.length > 0 && (
          <div className="px-4 py-2 space-y-4 max-h-[320px] overflow-y-auto bg-gray-50/50">
            {actions.map((a, idx) => {
              const isAI = !a.author?.trim();
              const authorLabel = isAI ? "AI" : a.author;

              return (
                <div
                  key={idx}
                  className={`flex flex-col ${isAI ? "items-start" : "items-end"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 shadow-sm border ${
                      isAI
                        ? "bg-white border-gray-200 rounded-tl-none"
                        : "bg-blue-50 border-blue-100 rounded-tr-none text-right"
                    }`}
                  >
                    <div
                      className={`flex items-center gap-2 mb-1 ${
                        isAI ? "flex-row" : "flex-row-reverse"
                      }`}
                    >
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                          isAI
                            ? "bg-gray-100 text-gray-500"
                            : "bg-blue-600 text-white"
                        }`}
                      >
                        {authorLabel}
                      </span>
                      <small className="text-gray-400 text-[10px] font-medium">
                        {formatDateForDisplay(a.created_at, false)}
                      </small>
                    </div>

                    <p className="font-bold text-sm text-gray-800 mb-1">
                      {a.action}
                    </p>

                    <p className="text-xs text-gray-600 leading-relaxed">
                      {a.comment}
                    </p>

                    {a.partner && (
                      <div className="mt-2 p-2 bg-white/60 border border-blue-200 rounded-lg flex flex-col gap-0.5">
                        <span className="text-[11px] font-semibold text-primary">
                          Partner: {a.partner.partner_name}
                        </span>
                        <span className="text-[10px] text-primary/80">
                          {a.partner.partner_phone}
                        </span>
                      </div>
                    )}

                    {!NOPREFRERED_TIME.includes(a.action) && a.meeting_time && (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <small className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded">
                          {formatDateForDisplay(a.meeting_time)}
                        </small>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <NewActionForm
          userId={userId}
          phoneNumber={phoneNumber}
          name={name}
          onSuccess={onClose}
          onActionUpdate={onActionUpdate}
        />
      </div>
    </div>
  );
}
