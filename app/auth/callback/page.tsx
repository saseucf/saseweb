"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import supabase from "@/lib/auth";
import { DEFAULT_MEMBER_DESTINATION, getSafeAuthRedirect } from "@/lib/auth-redirect";
import { announceMemberSession, memberDestination, sendMemberWelcome } from "@/lib/member-session";

function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = getSafeAuthRedirect(searchParams.get("redirect"), DEFAULT_MEMBER_DESTINATION);
  const isLinkFlow = searchParams.get("flow") === "link";
  const isSetup = searchParams.get("flow") === "setup";
  const isRecovery = searchParams.get("type") === "recovery";
  const [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false;
    async function complete() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (cancelled) return;
        if (error) throw error;
        if (!session) throw new Error("This sign-in link could not be completed. It may have expired. Please sign in again or request a new link.");
        const user = session.user;
        announceMemberSession(user);
        const hashType = new URLSearchParams(window.location.hash.slice(1)).get("type");
        if (isRecovery || isSetup || hashType === "recovery" || hashType === "invite") {
          if (!cancelled) { router.replace("/reset-password"); router.refresh(); }
          return;
        }
        if (isLinkFlow) {
          if (!cancelled) { router.replace(redirectUrl); router.refresh(); }
          return;
        }
        const destination = await memberDestination(user, redirectUrl);
        await sendMemberWelcome(user);
        if (!cancelled) { router.replace(destination); router.refresh(); }
      } catch (error) { if (!cancelled) setError(error instanceof Error ? error.message : "Sign-in failed. Please try again."); }
    }
    void complete();
    return () => { cancelled = true; };
  }, [router, redirectUrl, isLinkFlow, isSetup, isRecovery]);
  return <main className="flex min-h-[60vh] flex-col items-center justify-center gap-5 p-6 text-center">
    {error ? <><p role="alert" className="max-w-md text-sm text-red-700">{error}</p><Link className="sase-primary-button" href={`/login?redirect=${encodeURIComponent(redirectUrl)}`}>Return to sign in</Link><Link className="underline" href="/forgot-password">Request a password reset</Link></> : <p role="status" className="text-sm text-muted-foreground">Finishing your sign-in...</p>}
  </main>;
}
export default function AuthCallbackPage() { return <Suspense><AuthCallback /></Suspense>; }
