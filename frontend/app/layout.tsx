import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VoiceContract Pro | Autonomous Legal Department",
  description: "Bridges the gap between verbal agreements and legal enforcement.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bureau-grid selection:bg-signal/30">
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
