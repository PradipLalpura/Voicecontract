"use client";

import { useRouter } from "next/navigation";
import { UserProfile, useUser } from "@clerk/nextjs";

export default function SettingsPage() {
  const router = useRouter();
  const { isLoaded } = useUser();
  const hasClerk = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!isLoaded && hasClerk) return null;

  return (
    <div className="min-h-screen bg-background text-text font-sans flex flex-col relative">
      
      {/* Premium Header */}
      <header className="sticky top-0 w-full h-20 bg-surface/80 backdrop-blur-xl border-b border-border flex items-center justify-between px-8 z-50 shadow-sm">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/dashboard')}>
           <button className="text-text-muted hover:text-text transition-colors mr-4">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
           </button>
           <h2 className="text-lg font-bold tracking-tight text-text">Account Settings</h2>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto p-8 py-12 flex justify-center">
        {hasClerk ? (
          <div className="w-full flex justify-center shadow-apple-lg rounded-2xl overflow-hidden border border-border">
            <UserProfile 
              appearance={{
                elements: {
                  rootBox: "w-full mx-auto",
                  card: "w-full max-w-none shadow-none border-none bg-surface",
                  navbar: "bg-surface-muted/30 border-r border-border",
                  headerTitle: "text-text font-bold",
                  headerSubtitle: "text-text-muted",
                  profileSectionTitleText: "text-text font-semibold",
                  badge: "bg-primary/10 text-primary",
                  userButtonPopoverActionButton: "hover:bg-surface-muted",
                }
              }}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center max-w-md h-96 bg-surface border border-border rounded-3xl p-10 shadow-apple">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">Guest Mode Active</h2>
            <p className="text-text-muted">You are currently using Safe Auth mode. To access full profile and company settings, configure your Clerk API keys in the root .env file.</p>
          </div>
        )}
      </main>
    </div>
  );
}
