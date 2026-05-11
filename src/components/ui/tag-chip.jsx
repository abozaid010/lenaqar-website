"use client";

import { X } from "lucide-react";

/**
 * TagChip - A reusable tag/chip component
 * 
 * @param {Object} props
 * @param {string} props.label - Tag text
 * @param {boolean} props.compact - Whether to show compact version (for list rows)
 * @param {boolean} props.removable - Whether to show remove button
 * @param {Function} props.onRemove - Callback when remove is clicked
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.size - Size variant: "sm" | "md" | "lg"
 */
export default function TagChip({
  label,
  compact = false,
  removable = false,
  onRemove,
  className = "",
  size = "sm",
}) {
  const sizeClasses = {
    xs: "text-[10px] px-1.5 py-[1px] leading-tight",
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };

  const baseClasses = `
    inline-flex items-center gap-1 rounded-full font-medium
    ${sizeClasses[size]}
    ${compact ? "bg-gray-100 text-gray-700 border border-gray-200" : "bg-blue-50 text-blue-700 border border-blue-200"}
    ${className}
  `;

  const iconSize = size === "xs" ? 10 : 12;

  return (
    <span className={baseClasses.trim()}>
      <span className="truncate max-w-[120px]">{label}</span>
      {removable && (
        <button
          type="button"
          onClick={onRemove}
          className="hover:bg-blue-100 rounded-full p-0.5 transition-colors"
          title="Remove tag"
          aria-label={`Remove ${label} tag`}
        >
          <X size={iconSize} className="text-blue-600" />
        </button>
      )}
    </span>
  );
}

/**
 * TagList - A container for multiple tags
 * 
 * @param {Object} props
 * @param {string[]} props.tags - Array of tag strings
 * @param {Object} props.chipProps - Props to pass to TagChip components
 * @param {boolean} props.compact - Whether to show compact version
 * @param {number} props.maxVisible - Maximum tags to show before showing +N indicator
 * @param {string} props.className - Additional CSS classes
 */
export function TagList({
  tags = [],
  chipProps = {},
  compact = false,
  maxVisible = null,
  className = "",
}) {
  if (!tags || tags.length === 0) {
    return null;
  }

  const visibleTags = maxVisible ? tags.slice(0, maxVisible) : tags;
  const remainingCount = maxVisible ? tags.length - maxVisible : 0;

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {visibleTags.map((tag, index) => (
        <TagChip
          key={`${tag}-${index}`}
          label={tag}
          compact={compact}
          {...chipProps}
        />
      ))}
      {remainingCount > 0 && (
        <span className="text-xs text-gray-500 px-2 py-0.5">
          +{remainingCount}
        </span>
      )}
    </div>
  );
}
