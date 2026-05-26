import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VoiceContract | Spoken agreement to PDF",
  description: "AI agent pipeline that converts client meetings into ready-to-sign service agreements, invoices, and purchase orders.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-background text-foreground antialiased selection:bg-primary selection:text-primary-foreground`}>
        {children}
        <Toaster theme="dark" position="bottom-right" />
      </body>
    </html>
  );
}
