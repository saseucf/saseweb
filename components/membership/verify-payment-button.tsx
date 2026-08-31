"use client";

import { useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import supabase from "@/lib/auth";
import { useRouter } from "next/navigation";

export default function VerifyPaymentButton({ userId }: { userId: string }) {
    const [isVerifying, setIsVerifying] = useState(false);
    const router = useRouter();

    const handleVerify = async () => {
        setIsVerifying(true);
        try {
            // 1. Ask the server to fetch Zeffy payments and auto-match if possible
            const res = await fetch("/api/membership/verify-payment", { method: "POST" });
            const data = await res.json();
            
            if (res.ok && data.success) {
                toast.success("Payment verified! You are now a paid member.");
                router.refresh();
                return;
            }

            // 2. If it didn't auto-match (or API failed), do a manual check in case admin already matched it
            const { data: profileData, error } = await supabase
                .from("profiles")
                .select("paid_member")
                .eq("id", userId)
                .single();

            if (error) throw error;

            if (profileData?.paid_member) {
                toast.success("Payment verified! You are now a paid member.");
                router.refresh();
            } else {
                toast.error("Payment not found yet. An officer may still need to review it.");
            }
        } catch {
            toast.error("Failed to verify payment status.");
        } finally {
            setIsVerifying(false);
        }
    };

    return (
        <button
            onClick={handleVerify}
            disabled={isVerifying}
            className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded bg-yellow-400 font-bold uppercase tracking-wider text-[#141b4d] transition-colors hover:bg-yellow-500 disabled:opacity-50"
        >
            {isVerifying ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            Verify Payment
        </button>
    );
}
