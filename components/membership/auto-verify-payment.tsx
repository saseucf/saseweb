"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AutoVerifyPayment({ onVerified }: { onVerified?: () => void }) {
  const router = useRouter();
  useEffect(() => {
    const controller = new AbortController();
    let running = false;
    let verified = false;
    async function check() {
      if (running || verified || document.visibilityState === "hidden") return;
      running = true;
      try {
        const response = await fetch("/api/membership/verify-payment", { method: "POST", signal: controller.signal });
        const result = await response.json();
        if (!controller.signal.aborted && response.ok && result.success) {
          verified = true;
          onVerified?.();
          router.refresh();
        }
      } catch { /* Keep the manual retry available if the provider is offline. */ }
      finally { running = false; }
    }
    void check();
    const timer = window.setInterval(() => void check(), 60_000);
    window.addEventListener("focus", check);
    return () => {
      controller.abort();
      window.clearInterval(timer);
      window.removeEventListener("focus", check);
    };
  }, [router, onVerified]);
  return null;
}
