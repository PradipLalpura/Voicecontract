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
  const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!clerkKey) {
    return (
      <html lang="en">
        <body className="selection:bg-primary/30 text-text bg-background">
          <div className="min-h-screen flex items-center justify-center p-12 text-center font-sans">
             <div className="space-y-4">
                <h1 className="text-2xl font-black uppercase tracking-tighter">Neural_Link_Incomplete</h1>
                <p className="text-text-muted text-sm max-w-md">The Clerk Publishable Key is missing from the environment. Please check your Vercel/Local settings.</p>
             </div>
          </div>
        </body>
      </html>
    );
  }

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
