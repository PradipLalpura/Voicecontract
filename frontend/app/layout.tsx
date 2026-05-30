import type { Metadata } from "next";
import { ClerkProvider } from '@clerk/nextjs'
import "./globals.css";
import VoiceAssistantOrb from "@/components/VoiceAssistantOrb";

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
  // If Clerk key is missing, we render without ClerkProvider to prevent the 500 error
  if (!clerkKey) {
    return (
      <html lang="en">
        <body className="selection:bg-primary/30 text-text bg-background">
          <main className="min-h-screen">
            {children}
            <VoiceAssistantOrb />
          </main>
        </body>
      </html>
    );
  }

  return (
    <ClerkProvider
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
            <VoiceAssistantOrb />
          </main>
        </body>
      </html>
    </ClerkProvider>
  );
}
