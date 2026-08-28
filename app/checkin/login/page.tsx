"use client"

import { useState, useEffect, Suspense } from "react";
import supabase from "@/lib/auth";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { FaDiscord } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { getSafeAuthRedirect } from "@/lib/auth-redirect";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = getSafeAuthRedirect(searchParams.get('redirect'), '/checkin/member');

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const user = session?.user;
      if (!user) {
        setCheckingSession(false);
        return;
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      const destination = profileData?.role === 'admin' ? '/checkin/admin' : redirectUrl;

      if (profileData && !profileData.name_confirmed) {
        router.replace(`/confirm-name?redirect=${encodeURIComponent(destination)}`);
        return;
      }

      router.replace(destination);
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (checkingSession) {
    return (
      <div className="sase-login-page flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Check if the user is an admin
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    const destination = profileData?.role === 'admin' ? '/checkin/admin' : redirectUrl;

    if (profileData && !profileData.name_confirmed) {
      router.push(`/confirm-name?redirect=${encodeURIComponent(destination)}`);
      return;
    }

    router.push(destination);
  };

  const handleOAuthLogin = async (provider: "discord" | "google") => {
    setError(null);
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/checkin/login?redirect=${encodeURIComponent(redirectUrl)}`,
      },
    });

    if (authError) setError(authError.message);
  };

  return (
    <main className="sase-login-page">
      <div className="sase-login-card p-8 md:p-12 relative">
        <Link href="/checkin" className="absolute top-6 left-6 text-sm text-[#89abe3] hover:text-foreground transition-colors flex items-center font-semibold">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Link>
        
        <div className="text-center mt-6 mb-8">
          <h1 className="text-3xl font-bold">Member Login</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to access your QR code</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <div className="p-3 text-sm text-red-800 bg-red-50 rounded-lg border border-red-200">
              {error}
            </div>
          )}
          
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-foreground" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded border border-border p-3 text-sm outline-none focus:border-[#89abe3] focus:ring-2 focus:ring-[#dbe5fa]"
              placeholder="knight@ucf.edu"
              required
            />
          </div>
          
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-foreground" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded border border-border p-3 text-sm outline-none focus:border-[#89abe3] focus:ring-2 focus:ring-[#dbe5fa]"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-[#89abe3] text-white p-3 font-bold uppercase tracking-wider text-sm mt-4 hover:bg-foreground transition-colors flex items-center justify-center disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Sign In
          </button>
        </form>

        <div className="flex items-center gap-3 text-xs text-[#8896b5] my-5">
          <span className="h-px flex-1 bg-[#cbd5e8]" />
          or continue with
          <span className="h-px flex-1 bg-[#cbd5e8]" />
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => handleOAuthLogin("discord")}
            className="w-full flex items-center justify-center gap-2 rounded border border-border p-3 text-sm font-semibold text-[#171d52] hover:bg-[#e9eef8] transition-colors"
          >
            <FaDiscord />
            Continue with Discord
          </button>
          <button
            type="button"
            onClick={() => handleOAuthLogin("google")}
            className="w-full flex items-center justify-center gap-2 rounded border border-border p-3 text-sm font-semibold text-[#171d52] hover:bg-[#e9eef8] transition-colors"
          >
            <FcGoogle />
            Continue with Google
          </button>
        </div>
      </div>
    </main>
  );
}

export default function MemberLoginPage() {
  return (
    <Suspense fallback={<div className="sase-login-page"><Loader2 className="w-8 h-8 animate-spin text-white" /></div>}>
      <LoginForm />
    </Suspense>
  )
}
