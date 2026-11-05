import type { Metadata } from "next";
import { Orbitron, Roboto_Mono } from "next/font/google";
import "./globals.css";

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "UCF SASE",
  description: "Society of Asian Scientists and Engineers UCF Chapter",
  manifest: "/manifest.webmanifest",
};

export const viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

import GlobalNav from "@/components/GlobalNav";
import Footer from "@/components/Footer";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import { headers } from "next/headers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestHeaders = headers();
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body
        className={`${orbitron.variable} ${robotoMono.variable} font-sans antialiased pt-[78px] min-h-screen flex flex-col`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          forcedTheme="light"
          disableTransitionOnChange
        >
          <ShellContent requestHeaders={requestHeaders}>{children}</ShellContent>
          <Toaster position="bottom-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}

async function ShellContent({
  requestHeaders,
  children,
}: {
  requestHeaders: Promise<Headers>;
  children: React.ReactNode;
}) {
  const host = (await requestHeaders).get("host")?.split(":")[0].toLowerCase();
  const isLumaHacksHost = host === "lumahacks.ucfsase.com";
  return (
    <>
      {!isLumaHacksHost && <GlobalNav />}
      <div className="flex-1 flex flex-col">
        {children}
      </div>
      {!isLumaHacksHost && <Footer />}
    </>
  );
}
