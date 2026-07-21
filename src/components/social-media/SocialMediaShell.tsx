"use client";

import { ActivationStatusBanner } from "@/components/social-media/ActivationStatusBanner";
import { ActivationUiProvider } from "@/components/social-media/ActivationUiProvider";
import { SocialMediaNav } from "@/components/social-media/SocialMediaNav";
import { useModuleActions } from "@/hooks/useModuleActions";

export function SocialMediaShell({ children }: { children: React.ReactNode }) {
  const { canView, isReady } = useModuleActions("social_media");

  return (
    <ActivationUiProvider enabled={isReady && canView}>
      <div className="flex flex-col gap-2">
        <SocialMediaNav />
        <ActivationStatusBanner />
        {children}
      </div>
    </ActivationUiProvider>
  );
}
