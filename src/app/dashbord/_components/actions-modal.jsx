import { X } from "lucide-react";
import NewActionForm from "./new-action-form";

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
                  <p className="font-bold text-sm text-gray-800">
                    {actions.action}
                  </p>
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
              </div>
            </li>
          </ul>
        )}

        <NewActionForm userId={userId} onSuccess={onClose} />
      </div>
    </div>
  );
}
