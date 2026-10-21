"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { requestWorkshopCredit } from "@/lib/member-session";

export default function AutoClaimWorkshopCredit() {
  const router = useRouter();
  useEffect(() => {
    let active = true;
    void requestWorkshopCredit().then(awarded => { if (active && awarded) router.refresh(); });
    return () => { active = false; };
  }, [router]);
  return null;
}
