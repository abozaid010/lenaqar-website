"use client";

import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";
import { useI18n } from "@/hooks/useI18n";

export function Drawer({
  isOpen,
  onClose,
  title,
  headerTrailing,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  /** Optional actions rendered before the close button (aligned end). */
  headerTrailing?: ReactNode;
  children: React.ReactNode;
}) {
  const { locale, translate } = useI18n();
  const isRTL = String(locale || "").toLowerCase().startsWith("ar");
  const panelRef = useRef<HTMLDivElement | null>(null);

  const mounted = useMemo(() => typeof window !== "undefined", []);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-label={translate("common.close", "Close")}
      />
      <div
        ref={panelRef}
        className={`absolute top-0 h-full w-full sm:w-[520px] bg-white shadow-2xl border-l border-gray-200 flex flex-col ${
          isRTL ? "left-0 border-l-0 border-r" : "right-0"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-gray-200">
          <div className="min-w-0 shrink">
            <div className="text-sm font-semibold text-gray-900 truncate">{title}</div>
          </div>
          <div className="flex items-center justify-end gap-1.5 shrink-0 min-w-0">
            {headerTrailing}
            <button
              type="button"
              onClick={onClose}
              className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/30 shrink-0"
              aria-label={translate("common.close", "Close")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto p-4">{children}</div>
      </div>
    </div>,
    document.body
  );
}
