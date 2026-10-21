"use client";

import InstallPrompt from "@/components/checkin/InstallPrompt";
import { usePathname } from "next/navigation";

export default function CheckinLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname?.includes('/login');

  if (isLoginPage) {
    return <>{children}</>;
  }

  // Event displays and their appearance menu use the full page canvas.
  if (/^\/checkin\/admin\/event\/[^/]+\/(qr|appearance)\/?$/.test(pathname ?? "")) {
    return <main className="w-full">{children}</main>;
  }

  return (
    <div className="min-h-[calc(100vh-78px)] bg-background text-foreground relative">
      <main className="max-w-md mx-auto relative px-4 pt-3 sm:pt-6">
        {children}
      </main>
      <InstallPrompt />
    </div>
  );
}
