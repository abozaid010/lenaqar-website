"use client";

/**
 * Reusable cancel button for dialog headers and forms.
 * Styled for use on primary-colored headers (e.g. border + bg for contrast).
 * Renders at type="button"; pass onClick to close/cancel.
 */
export default function CancelButton({
  onClick,
  children = "Cancel",
  disabled = false,
  className = "",
  ...rest
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-1.5 rounded-md border border-white/30 bg-white/10 text-white hover:bg-white/15 text-sm focus:outline-none focus:ring-1 focus:ring-white disabled:opacity-70 disabled:pointer-events-none ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
