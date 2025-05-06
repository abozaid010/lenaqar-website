"use client";

import { X } from "lucide-react";
import NewActionForm from "./new-action-form";
import formatDateForDisplay from "@/utils/formateDate";
import { useI18n } from "@/context/translate-api";
const NOPREFRERED_TIME = [
  "Qualified lead",
  "Not interested",
  "Not qualified",
  "Follow up later",
  "Missing requirement",
];
export default function ActionsModal({ actions, onClose, userId }) {
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

        {actions.length > 0 && (
          <ul className="timeline px-3 max-h-[280px] overflow-y-auto">
            {actions.map((a, idx) => (
              <li className="timeline-item" key={idx}>
                <div className="timeline-content">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm text-gray-800">
                        {a.action}
                      </p>

                      <div className="text-[10px] mt-1 bg-blue-600 rounded-xl px-2 text-center text-white font-semibold">
                        {a.user}
                      </div>
                    </div>

                    <small className="text-gray-500 font-medium ">
                      {formatDateForDisplay(a.created_at, true)}
                    </small>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{a.comment}</p>
                  {console.log(a)}
                  {!NOPREFRERED_TIME.includes(a.action) && a.meeting_time && (
                    <small className="underline text-xs text-green-600 font-medium">
                      {formatDateForDisplay(a.meeting_time)}
                    </small>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        <NewActionForm userId={userId} onSuccess={onClose} />
      </div>
    </div>
  );
}
