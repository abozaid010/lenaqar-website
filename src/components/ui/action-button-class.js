/** Shared classes so Buy Unit / Sell Unit look like one system. */
export function actionButtonClass({
  variant = "primary",
  tone = "default",
  size = "default",
  className = "",
} = {}) {
  const sizeClass =
    size === "compact"
      ? "px-3 py-2 text-xs min-h-9 whitespace-nowrap"
      : size === "large"
        ? "px-6 py-4 text-base sm:text-lg min-h-14 font-semibold"
        : "px-4 py-3 text-sm min-h-11";
  const look =
    tone === "onPrimary"
      ? variant === "secondary"
        ? "border border-white text-white hover:bg-white/10"
        : "bg-white text-primary hover:bg-white/90"
      : variant === "secondary"
        ? "border border-primary text-primary hover:bg-primary/5"
        : "bg-primary text-white shadow-md hover:opacity-90";
  return `inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors ${sizeClass} ${look} ${className}`;
}
