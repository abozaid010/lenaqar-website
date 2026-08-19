/** Shared classes so Buy Unit / Sell Unit look like one system. */
export function actionButtonClass({
  variant = "primary",
  tone = "default",
  size = "default",
  className = "",
} = {}) {
  const sizeClass =
    size === "compact"
      ? "px-3.5 py-2 text-xs min-h-9 whitespace-nowrap rounded-lg"
      : size === "large"
        ? "px-7 py-4 text-base sm:text-lg min-h-14 font-bold rounded-xl whitespace-nowrap"
        : "px-5 py-3 text-sm min-h-11 rounded-lg whitespace-nowrap";
  const look =
    tone === "onPrimary"
      ? variant === "secondary"
        ? "border-2 border-white/70 text-white hover:bg-white hover:text-primary"
        : "bg-white text-primary shadow-md hover:shadow-lg"
      : variant === "secondary"
        ? "border-2 border-primary bg-white text-primary shadow-sm hover:bg-primary hover:text-white hover:shadow-md"
        : "bg-primary text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/35";
  return `group inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 ${sizeClass} ${look} ${className}`;
}
