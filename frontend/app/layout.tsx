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
  // Use a dummy key during build if the real one is missing to prevent ClerkProvider from being omitted
  const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "pk_test_ZW1wdHlfY2xlcmtfZHVtbXlfa2V5X2Zvcl9idWlsZGF0aG9uX3N0YWJpbGl0eQ==";

  return (
    <html lang="en">
      <body className="selection:bg-primary/30 text-text bg-background">
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
      </body>
    </html>
  );
}
