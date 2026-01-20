"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";

export default function Dialog({
  isOpen,
  onClose,
  title,
  children,
  headerActions = null,
  showCloseButton = true,
  closeOnOutsideClick = true,
  closeOnEscape = true,
}) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        if (closeOnEscape) onClose();
      }
    };

    if (isOpen) {
      if (closeOnEscape) {
        document.addEventListener("keydown", handleEscape);
      }
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose, closeOnEscape]);

  const handleOutsideClick = (e) => {
    if (!closeOnOutsideClick) return;
    if (dialogRef.current && !dialogRef.current.contains(e.target)) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ease-in-out bg-black/50"
      onClick={handleOutsideClick}
    >
      <div
        ref={dialogRef}
        className="rounded-lg shadow-xl overflow-hidden w-[90%] h-[90vh] flex flex-col transform transition-all duration-300 ease-in-out"
      >
        <div className="flex justify-between items-center gap-3 p-3 bg-primary flex-shrink-0">
          <h3 className="text-lg font-medium text-white">{title}</h3>
          <div className="flex items-center gap-2">
            {headerActions}
            {showCloseButton ? (
              <button
                onClick={onClose}
                className="text-white/90 hover:text-white focus:outline-none"
                aria-label="Close"
              >
                <X size={22} />
              </button>
            ) : null}
          </div>
        </div>
        <div className="p-4 overflow-y-auto bg-white flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
