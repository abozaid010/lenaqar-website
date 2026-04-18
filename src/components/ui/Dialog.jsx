"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export default function Dialog({
  isOpen,
  onClose,
  title,
  children,
  headerLeading = null,
  headerActions = null,
  showCloseButton = true,
  closeOnOutsideClick = true,
  closeOnEscape = true,
  /** Override scrollable body region (default padding + overflow) */
  bodyClassName = "p-4 overflow-y-auto bg-white flex-1",
}) {
  const dialogRef = useRef(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ease-in-out bg-black/50"
      onClick={handleOutsideClick}
    >
      <div
        ref={dialogRef}
        className="rounded-lg shadow-xl overflow-hidden w-[90%] h-[90vh] flex flex-col transform transition-all duration-300 ease-in-out"
      >
        <div
          className="flex justify-between items-center gap-3 p-3 bg-primary flex-shrink-0 relative"
          dir="ltr"
        >
          <div className="flex justify-start items-center shrink-0 order-first min-w-[80px]">
            {headerLeading}
          </div>
          <h3 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-lg font-medium text-white px-2 pointer-events-none">
            {title}
          </h3>
          <div className="flex justify-end items-center gap-2 shrink-0 order-last min-w-[80px]">
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
        <div className={bodyClassName}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
