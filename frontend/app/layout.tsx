import type { Metadata } from "next";
import { ClerkProvider } from '@clerk/nextjs'
import "./globals.css";
import ClientOrbWrapper from "@/components/ClientOrbWrapper";

export const metadata: Metadata = {
  title: "VoiceContract | Autonomous Legal Engine",
  description: "Transform your conversations into boardroom-ready contracts in real-time.",
};

const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  return (
    <html lang="en">
      <body className="selection:bg-primary/30 text-text bg-background">
        {clerkKey ? (
          <ClerkProvider
            publishableKey={clerkKey}
            appearance={{
              variables: { colorPrimary: '#2563EB' }
            }}
          >
            <main className="min-h-screen">
              {children}
              <ClientOrbWrapper />
            </main>
          </ClerkProvider>
        ) : (
          <main className="min-h-screen">
            {children}
            <ClientOrbWrapper />
          </main>
        )}
      </body>
    </html>
  );
}
