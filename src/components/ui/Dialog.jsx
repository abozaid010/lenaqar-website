"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";

export default function Dialog({ isOpen, onClose, title, children, editMode }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  const handleOutsideClick = (e) => {
    if (dialogRef.current && !dialogRef.current.contains(e.target)) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ease-in-out bg-black/50"
      // onClick={handleOutsideClick}
    >
      <div
        ref={dialogRef}
        className="rounded-lg shadow-xl max-w-md overflow-hidden w-[90%] transform transition-all duration-300 ease-in-out"
      >
        <div className="flex justify-between items-center p-3 bg-primary">
          <h3 className="text-lg font-medium text-white">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <X size={22} />
          </button>
        </div>
        <div className="p-4 overflow-y-auto bg-white max-h-[85vh]">
          {children}
        </div>
      </div>
    </div>
  );
}
