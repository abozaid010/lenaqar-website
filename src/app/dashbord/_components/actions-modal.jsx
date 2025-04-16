import { X } from "lucide-react";
import NewActionForm from "./new-action-form";

const NOPREFRERED_TIME = [
  "Qualified lead",
  "Not interested",
  "Not qualified",
  "Follow up later",
  "Missing requirement",
];
export default function ActionsModal({ actions, onClose, userId }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 bg-opacity-50">
      <div className="relative w-full max-w-xl max-h-full bg-white rounded-lg shadow-lg">
        <div className="flex justify-between items-center p-3">
          <h3 className="text-lg font-semibold text-gray-800 text-center flex-1">
            AI Actions
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none cursor-pointer"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {Object.keys(actions).length > 0 && (
          <ul className="timeline px-3">
            <li className="timeline-item">
              <div className="timeline-content">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-gray-800">
                      {actions.action}
                    </p>

                    <div className="text-[10px] mt-1 bg-blue-600 rounded-xl px-2 text-center text-white font-semibold">
                      AI action
                    </div>
                  </div>

                  <small className="text-gray-500 font-medium">
                    {new Date(actions.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </small>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {actions.description}
                </p>

                {!NOPREFRERED_TIME.includes(actions.action) &&
                  actions.preferred_time && (
                    <small className="underline text-xs text-green-600 font-medium">
                      {new Date(actions.preferred_time).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </small>
                  )}
              </div>
            </li>

            {actions.actions_history?.map((action, index) => (
              <li className="timeline-item" key={index}>
                <div className="timeline-content">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-sm text-gray-800">
                      {action.action}
                    </p>
                    <small className="text-gray-500 font-medium">
                      {new Date(action.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </small>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{action.comment}</p>
                </div>
              </li>
            ))}
          </ul>
        )}

        <NewActionForm userId={userId} onSuccess={onClose} actions={actions} />
      </div>
    </div>
  );
}
