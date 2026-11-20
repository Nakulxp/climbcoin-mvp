import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClimbCoin — Live Telemetry & Verification Engine",
  description:
    "Commercial office tower stairwell verification, live phone-to-laptop telemetry, and ESG demand-shaping command center.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900&family=Public+Sans:wght@300..700&family=JetBrains+Mono:wght@400;500;700&display=swap"
        />
      </head>
      <body className="min-h-screen antialiased selection:bg-[#00E39D] selection:text-[#052018]">
        {children}
      </body>
    </html>
  );
}
