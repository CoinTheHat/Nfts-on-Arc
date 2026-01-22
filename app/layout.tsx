"use client";

import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { config } from "@/lib/wagmiClient";
import { Inter } from "next/font/google";
import { ToastProvider } from "@/components/ui/Toast";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const queryClient = new QueryClient();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${inter.variable} antialiased bg-background text-foreground font-sans min-h-screen selection:bg-blue-500/30 selection:text-blue-200`}>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <ToastProvider>
              {children}
            </ToastProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </body>
    </html>
  );
}
