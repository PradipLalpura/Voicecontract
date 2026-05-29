"use client";

import { ReactNode } from "react";
import * as Clerk from "@clerk/nextjs";

interface SafeAuthProps {
  children: ReactNode;
  fallback?: ReactNode;
  mode: "signedIn" | "signedOut";
}

export function SafeAuth({ children, fallback, mode }: SafeAuthProps) {
  const hasClerk = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!hasClerk) {
    if (mode === "signedIn") return <>{children}</>;
    return fallback ? <>{fallback}</> : null;
  }

  if (mode === "signedIn") {
    return <Clerk.SignedIn>{children}</Clerk.SignedIn>;
  }

  return <Clerk.SignedOut>{children}</Clerk.SignedOut>;
}
