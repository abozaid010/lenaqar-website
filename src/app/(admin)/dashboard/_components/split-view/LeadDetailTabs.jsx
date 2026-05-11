"use client";

import { useId, useRef, useCallback } from "react";

/**
 * Accessible 3-tab strip used by LeadDetailPane.
 *
 * Props:
 *  - value: active tab id
 *  - onChange: (id: string) => void
 *  - tabs: Array<{ id: string, label: string, icon?: ReactNode, badge?: ReactNode }>
 *  - ariaLabel: accessible label for the tablist
 *
 * Behavior:
 *  - role="tablist" / role="tab" with aria-selected & aria-controls.
 *  - Roving tabindex: only the active tab is in the tab order; arrow keys
 *    move focus and switch tabs.
 *  - Active tab gets a primary underline that respects RTL layout (the
 *    underline sits at the bottom and stretches across the tab, not aligned
 *    to a side).
 */
export default function LeadDetailTabs({ value, onChange, tabs, ariaLabel }) {
  const baseId = useId();
  const buttonsRef = useRef([]);

  const focusTab = useCallback(
    (index) => {
      const wrapped = ((index % tabs.length) + tabs.length) % tabs.length;
      const next = tabs[wrapped];
      if (!next) return;
      buttonsRef.current[wrapped]?.focus();
      if (next.id !== value) onChange(next.id);
    },
    [tabs, value, onChange]
  );

  const handleKeyDown = (e, currentIndex) => {
    switch (e.key) {
      case "ArrowRight":
        e.preventDefault();
        focusTab(currentIndex + 1);
        break;
      case "ArrowLeft":
        e.preventDefault();
        focusTab(currentIndex - 1);
        break;
      case "Home":
        e.preventDefault();
        focusTab(0);
        break;
      case "End":
        e.preventDefault();
        focusTab(tabs.length - 1);
        break;
      default:
        break;
    }
  };

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="flex items-stretch gap-1 overflow-x-auto border-b border-gray-200 bg-white"
    >
      {tabs.map((tab, index) => {
        const isActive = tab.id === value;
        const tabId = `${baseId}-tab-${tab.id}`;
        const panelId = `${baseId}-panel-${tab.id}`;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            ref={(el) => {
              buttonsRef.current[index] = el;
            }}
            id={tabId}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={panelId}
            tabIndex={isActive ? 0 : -1}
            onClick={() => {
              if (!isActive) onChange(tab.id);
            }}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={[
              "relative inline-flex items-center justify-center gap-1.5 shrink-0 px-3 py-2 text-xs sm:text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 rounded-t-md",
              isActive
                ? "text-primary"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50",
            ].join(" ")}
          >
            {Icon ? (
              <Icon
                className={`w-3.5 h-3.5 ${isActive ? "text-primary" : "text-gray-400"}`}
                aria-hidden="true"
              />
            ) : null}
            <span className="whitespace-nowrap">{tab.label}</span>
            {tab.badge ? <span className="ms-1">{tab.badge}</span> : null}
            <span
              aria-hidden="true"
              className={[
                "pointer-events-none absolute inset-x-0 -bottom-px h-0.5 transition-colors",
                isActive ? "bg-primary" : "bg-transparent",
              ].join(" ")}
            />
          </button>
        );
      })}
    </div>
  );
}
