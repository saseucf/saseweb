"use client"

import { useState, Suspense } from "react";
import { createClient } from "@/lib/checkin-supabase";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect');
  const supabase = createClient();

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
      .select('role')
      .eq('id', data.user.id)
      .single();

    if (profileData?.role === 'admin') {
      router.push('/checkin/admin');
    } else {
      if (redirectUrl) {
        router.push(redirectUrl);
      } else {
        router.push('/checkin/member');
      }
    }
  };

  return (
    <main className="sase-login-page">
      <div className="sase-login-card p-8 md:p-12 relative">
        <Link href="/checkin" className="absolute top-6 left-6 text-sm text-[#5579bd] hover:text-[#171d52] transition-colors flex items-center font-semibold">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Link>
        
        <div className="text-center mt-6 mb-8">
          <h1 className="text-3xl font-bold">Member Login</h1>
          <p className="mt-2 text-sm text-[#64708c]">Sign in to access your QR code</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <div className="p-3 text-sm text-red-800 bg-red-50 rounded-lg border border-red-200">
              {error}
            </div>
          )}
          
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-[#171d52]" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded border border-[#cbd5e8] p-3 text-sm outline-none focus:border-[#5579bd] focus:ring-2 focus:ring-[#dbe5fa]"
              placeholder="knight@ucf.edu"
              required
            />
          </div>
          
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-[#171d52]" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded border border-[#cbd5e8] p-3 text-sm outline-none focus:border-[#5579bd] focus:ring-2 focus:ring-[#dbe5fa]"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-[#5579bd] text-white p-3 font-bold uppercase tracking-wider text-sm mt-4 hover:bg-[#171d52] transition-colors flex items-center justify-center disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Sign In
          </button>
        </form>
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
