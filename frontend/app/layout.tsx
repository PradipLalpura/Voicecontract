import type { Metadata } from "next";
import { ClerkProvider } from '@clerk/nextjs'
import "./globals.css";
import ClientOrbWrapper from "@/components/ClientOrbWrapper";

export const metadata: Metadata = {
  title: "VoiceContract | Autonomous Legal Engine",
  description: "Transform your conversations into boardroom-ready contracts in real-time.",
};

const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "pk_test_dummy_key_for_build_stability";

  return (
    <ClerkProvider
      publishableKey={clerkKey}
      appearance={{
        layout: {
          socialButtonsVariant: 'blockButton',
          logoPlacement: 'inside',
        },
        variables: {
          colorPrimary: '#2563EB',
          colorBackground: '#FFFFFF',
          colorText: '#111827',
          colorInputBackground: '#F9FAFB',
          colorInputText: '#111827',
        }
      }}
    >
      <html lang="en">
        <body className="selection:bg-primary/30 text-text bg-background">
          <main className="min-h-screen">
            {children}
            <ClientOrbWrapper />
          </main>
        </body>
      </html>
    </ClerkProvider>
  );
}
