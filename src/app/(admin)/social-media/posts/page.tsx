import { Suspense } from "react";
import PostsPageClient from "./_components/PostsPageClient";
import { TableSkeleton } from "@/components/social-media/Skeletons";

export default function SocialMediaPostsPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <PostsPageClient />
    </Suspense>
  );
}
