import { Suspense } from "react";
import CommentsPageClient from "./_components/CommentsPageClient";
import { TableSkeleton } from "@/components/social-media/Skeletons";

export default function SocialMediaCommentsPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <CommentsPageClient />
    </Suspense>
  );
}
