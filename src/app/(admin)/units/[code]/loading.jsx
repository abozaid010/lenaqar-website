import LoadingSpinner from "@/components/ui/loading-spinner";

export default function UnitDetailsLoading() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <LoadingSpinner message="Loading..." />
    </div>
  );
}
