"use client";

import { usePathname } from "next/navigation";
import VoiceAssistantOrb from "./VoiceAssistantOrb";
import { SignedIn } from "@clerk/nextjs";

export default function ClientOrbWrapper() {
  const pathname = usePathname();
  const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!clerkKey) {
    // If no Clerk, show only on non-landing pages
    if (pathname === "/") return null;
    return <VoiceAssistantOrb />;
  }

  // If Clerk is configured, only show when signed in
  return (
    <SignedIn>
      <VoiceAssistantOrb />
    </SignedIn>
  );
}
