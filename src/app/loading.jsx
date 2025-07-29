import LoadingSpinner from "@/components/ui/loading-spinner";

export default function Loading() {
  return (
    <div className="container mx-auto">
      <LoadingSpinner message="Loading..." />
    </div>
  );
}
