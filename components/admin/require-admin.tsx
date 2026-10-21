"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useProfileRole } from "@/components/use-profile-role";

export default function RequireAdmin({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { userId, role, loading } = useProfileRole();
  useEffect(() => {
    if (!loading && role !== "admin") router.replace(userId ? "/membership" : "/login");
  }, [loading, role, userId, router]);

  if (loading) return <p role="status" className="p-6 text-center text-muted-foreground">Checking administrator access...</p>;
  if (role !== "admin") return null;
  return <>{children}</>;
}
