import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex items-center justify-center h-full mt-12">
      <Loader2 size={80} className="text-center animate-spin text-primary" />
    </div>
  );
}
