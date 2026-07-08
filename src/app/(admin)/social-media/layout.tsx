import { SocialMediaNav } from "@/components/social-media/SocialMediaNav";

export default function SocialMediaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <SocialMediaNav />
      {children}
    </div>
  );
}
