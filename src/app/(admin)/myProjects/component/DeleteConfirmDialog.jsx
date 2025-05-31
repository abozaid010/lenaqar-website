import { AlertTriangle } from 'lucide-react';
import { useI18n } from "@/context/translate-api";

export default function DeleteConfirmDialog({ isOpen, onClose, onConfirm, projectName }) {
  if (!isOpen) return null;
 const {t} =useI18n()
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-red-100 p-3 rounded-full">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
        </div>
        
        <h3 className="text-xl font-semibold text-center mb-2"> {t.deleteTitel}</h3>
        <p className="text-gray-600 text-center mb-6">
           {t.sureDelet} {projectName ? `"${projectName}"` : 'this project'}?  {t.actionDelet} 
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            {t.cancelButton}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
             {t.deleteButton}
          </button>
        </div>
      </div>
    </div>
  );
} 