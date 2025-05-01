import "./globals.css";

import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import NextTopLoader from 'nextjs-toploader';
import { Toaster } from "sonner";
import Providers from "./providers";
import Script from "next/script";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"], 
  display: "swap",
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: {
    template: "%s | Databuddy Dashboard",
    default: "Databuddy Dashboard",
  },
  description: "Powerful analytics dashboard for your websites",
  keywords: ["analytics", "dashboard", "monitoring", "statistics", "web analytics", "tracking"],
  authors: [{ name: "Databuddy" }],
  creator: "Databuddy",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1a1a" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isLocalhost = process.env.NODE_ENV === 'development';

  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${jetbrainsMono.variable} h-full`}>
      <head />
      <Script 
        src={isLocalhost ? "http://localhost:3000/databuddy.js" : "https://app.databuddy.cc/databuddy.js"}
        data-client-id={isLocalhost ? "5ced32e5-0219-4e75-a18a-ad9826f85698" : "3ed1fce1-5a56-4cb6-a977-66864f6d18e3"}
        data-api-url={isLocalhost ? process.env.NEXT_PUBLIC_API_URL : "https://api.databuddy.cc"}
        data-track-screen-views="true"
        data-track-performance="true"
        data-track-web-vitals="true"
        data-track-errors="true"
        data-enable-batching="true"
        data-batch-size="20"
        data-batch-timeout="5000"
        strategy="afterInteractive"
      />
      <body className="antialiased h-full min-h-screen bg-background text-foreground flex flex-col">
        <Providers>
          <NextTopLoader 
            color="hsl(var(--primary))"
            height={2}
            showSpinner={false}
          />
          <main className="flex-1">{children}</main>
        </Providers>
        <Toaster duration={1500} position="top-center" closeButton richColors />
      </body>
    </html>
  );
}
