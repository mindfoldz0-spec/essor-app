"use client";
import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUserProfile } from "@/lib/userProfile";
import Loader from "@/components/Loader";

export default function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const profile = useUserProfile(); // shared store — no extra fetch
  const isOnboarding = pathname?.startsWith("/onboarding") ?? false;

  useEffect(() => {
    if (profile === undefined) return; // still loading — wait before deciding
    if (profile === null && !isOnboarding) router.push("/onboarding");
  }, [profile, isOnboarding, router]);

  if (!isOnboarding && profile === undefined) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8">
        <Loader />
      </div>
    );
  }
  return <>{children}</>;
}
