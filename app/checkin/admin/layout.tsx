"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import RequireAdmin from "@/components/admin/require-admin";

export default function AdminCheckinLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/checkin/admin/login") return <>{children}</>;
  return <RequireAdmin>{children}</RequireAdmin>;
}
