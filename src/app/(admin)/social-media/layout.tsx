import { SocialMediaShell } from "@/components/social-media/SocialMediaShell";

export default function SocialMediaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SocialMediaShell>{children}</SocialMediaShell>;
}
