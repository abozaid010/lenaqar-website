import { Loader2 } from "lucide-react";

export default function LoadingSpinner({
  size = 70,
  message = "Loading...",
  className = "",
  containerClassName = "flex items-center justify-center h-96",
}) {
  return (
    <div className={`${containerClassName} ${className}`}>
      <div className="text-center">
        <Loader2
          size={size}
          className="text-center animate-spin text-primary mx-auto mb-4"
        />
        {/* {message && <p className="text-gray-600 text-lg">{message}</p>} */}
      </div>
    </div>
  );
}

/** Full-pane bouncing dots loader for filter / data fetches. */
export function ThreeDotsLoader({
  label = "Loading...",
  className = "",
  containerClassName = "flex flex-1 items-center justify-center min-h-[200px]",
}) {
  return (
    <div
      className={`${containerClassName} ${className}`}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="flex items-center gap-2" aria-hidden>
        <span className="h-2.5 w-2.5 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
        <span className="h-2.5 w-2.5 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
        <span className="h-2.5 w-2.5 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
}
