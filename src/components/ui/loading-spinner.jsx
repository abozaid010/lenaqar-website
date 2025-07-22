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
