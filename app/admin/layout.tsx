import type { ReactNode } from "react";
import RequireAdmin from "@/components/admin/require-admin";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <RequireAdmin>{children}</RequireAdmin>;
}
