import LoadingSpinner from "@/components/ui/loading-spinner";

export default function OpportunitiesLoading() {
  return (
    <LoadingSpinner
      size={48}
      containerClassName="flex items-center justify-center min-h-[50vh]"
    />
  );
}
