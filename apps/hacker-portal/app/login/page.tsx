"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Notice, usePortal } from "../../components/shared";

export default function Login() {
  const { client, user, ready } = usePortal();
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup" | "reset">("signin");
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [notice, setNotice] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (!client || !ready) return; setBusy(true); setError(""); setNotice("");
    const form = new FormData(e.currentTarget), email = String(form.get("email")).trim(), password = String(form.get("password") || "");
    try {
      if (mode === "reset") {
        const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/auth/callback?next=/reset-password` });
        if (error) throw error;
        setNotice("If an account exists for this email, you’ll receive a password reset link.");
      } else if (mode === "signup") {
        const { data, error } = await client.auth.signUp({ email, password, options: { data: { account_context: "hackathon" }, emailRedirectTo: `${location.origin}/auth/callback` } });
        if (error) throw error;
        if (data.session) router.replace("/dashboard");
        else setNotice("Check your email to verify your account. Already have a SASE account? Sign in with it here.");
      } else {
        const { error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace("/dashboard");
      }
    } catch (err) { setError(err instanceof Error ? err.message : "We couldn’t complete sign-in. Please try again."); }
    finally { setBusy(false); }
  }
  async function oauth(provider: "google" | "discord") {
    if (!client || !ready) return; setBusy(true); setError("");
    const { error } = await client.auth.signInWithOAuth({ provider, options: { redirectTo: `${location.origin}/auth/callback` } });
    if (error) { setError(error.message); setBusy(false); }
  }
  return <div className="auth-page"><div className="auth-art"><p className="eyebrow">Your ideas belong here</p><h1>Come curious.<br /><em>Leave glowing.</em></h1><span aria-hidden="true">✳</span><p>One account. Your next adventure.</p></div><section className="auth-form"><p className="eyebrow">Welcome to LumaHacks</p><h2>{mode === "reset" ? "Let’s get you back in." : mode === "signup" ? "Start something bright." : "Good to see you."}</h2><p>Already a SASE member? Use the same email and password or linked provider. No new account needed.</p>{user && <Notice>You’re signed in. <Link href="/dashboard">Open your hacker hub</Link>.</Notice>}{(!client || !ready) && <Notice>Sign-in is temporarily unavailable. Please check back soon.</Notice>}{error && <Notice error>{error}</Notice>}{notice && <Notice>{notice}</Notice>}
    <form onSubmit={submit}><label>Email<input name="email" type="email" autoComplete="email" required maxLength={254} /></label>{mode !== "reset" && <label>Password<input name="password" type="password" minLength={mode === "signup" ? 12 : undefined} autoComplete={mode === "signup" ? "new-password" : "current-password"} required /></label>}<button className="button" disabled={busy || !client || !ready}>{busy ? "One moment…" : mode === "reset" ? "Send reset link" : mode === "signup" ? "Create account" : "Sign in"}</button></form>
    {mode !== "reset" && <><div className="divider">or continue with</div><div className="provider-buttons"><button disabled={busy || !client || !ready} onClick={() => void oauth("google")}>Google</button><button disabled={busy || !client || !ready} onClick={() => void oauth("discord")}>Discord</button></div></>}
    <div className="auth-switch"><button onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); setNotice(""); }}>{mode === "signin" ? "New here? Create an account" : "Back to sign in"}</button>{mode === "signin" && <button onClick={() => setMode("reset")}>Forgot password?</button>}</div></section></div>;
}
