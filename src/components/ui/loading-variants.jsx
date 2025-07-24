import LoadingSpinner from "@/components/ui/loading-spinner";

// Different loading states for different use cases
export function PageLoading({ message = "Loading..." }) {
  return (
    <div className="container mx-auto">
      <LoadingSpinner message={message} />
    </div>
  );
}

export function InlineLoading({ message = "Loading...", size = 40 }) {
  return (
    <LoadingSpinner
      message={message}
      size={size}
      containerClassName="flex items-center justify-center py-8"
    />
  );
}

export function FullScreenLoading({ message = "Loading..." }) {
  return (
    <LoadingSpinner
      message={message}
      containerClassName="flex items-center justify-center h-screen"
    />
  );
}

export function TableLoading({ message = "Loading data..." }) {
  return (
    <LoadingSpinner
      message={message}
      size={50}
      containerClassName="flex items-center justify-center py-12"
    />
  );
}

// Default export for basic usage
export default function Loading({ message, size, containerClassName }) {
  return (
    <LoadingSpinner
      message={message}
      size={size}
      containerClassName={containerClassName}
    />
  );
}
