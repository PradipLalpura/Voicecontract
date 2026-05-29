import type { Metadata } from "next";
import { ClerkProvider } from '@clerk/nextjs'
import "./globals.css";

export const metadata: Metadata = {
  title: "VoiceContract Pro | Awwwards-Winning 3D Legal Nexus",
  description: "The world's most immersive autonomous legal department.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      appearance={{
        layout: {
          socialButtonsVariant: 'blockButton',
          logoPlacement: 'inside',
        },
        variables: {
          colorPrimary: '#00C2CC',
          colorBackground: '#0D0D0D',
          colorText: '#FFFFFF',
          colorInputBackground: '#1A1A1A',
          colorInputText: '#FFFFFF',
        }
      }}
    >
      <html lang="en">
        <body className="bureau-grid selection:bg-signal/30 text-white bg-void">
          <main className="min-h-screen">
            {children}
          </main>
        </body>
      </html>
    </ClerkProvider>
  );
}
