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

  return (
    <div className="min-h-[calc(100vh-78px)] bg-[#f6f8fc] text-[#141b4d] relative">
      <main className="max-w-md mx-auto relative px-4 pt-6">
        {children}
      </main>
      <InstallPrompt />
    </div>
  );
}
