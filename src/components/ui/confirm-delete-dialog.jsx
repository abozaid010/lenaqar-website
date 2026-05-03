import { AlertTriangle } from "lucide-react";

export default function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete Item",
  message = "Are you sure you want to delete this item?",
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  icon = <AlertTriangle className="w-6 h-6 text-red-600" />,
  children,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-red-100 p-3 rounded-full">{icon}</div>
        </div>
        <h3 className="text-xl font-semibold text-center mb-2">{title}</h3>
        <p className="text-gray-600 text-center mb-6">
          {children ? children : message}
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onConfirm?.();
            }}
            className="px-4 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
