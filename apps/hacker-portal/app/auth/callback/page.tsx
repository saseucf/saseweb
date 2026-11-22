"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Notice, usePortal } from "../../../components/shared";
export default function Callback() {
  const { client } = usePortal(), router = useRouter();
  const started = useRef(false), [error, setError] = useState("");
  useEffect(() => {
    if (!client || started.current) return; started.current = true;
    void (async () => {
      const params = new URLSearchParams(location.search);
      const code = params.get("code");
      const hashError = new URLSearchParams(location.hash.slice(1)).get("error_description");
      if (params.has("error") || hashError) throw new Error("This sign-in link has expired or was declined. Please request a new link.");
      if (code) { const { error } = await client.auth.exchangeCodeForSession(code); if (error) throw error; }
      const { data, error } = await client.auth.getUser();
      if (error || !data.user) throw new Error("This link couldn’t be completed. Open it in the browser where you requested it, or sign in again.");
      const next = params.get("next");
      router.replace(next === "/reset-password" ? next : "/dashboard");
    })().catch(err => setError(err instanceof Error ? err.message : "Sign-in failed. Please try again."));
  }, [client, router]);
  return <div className="page narrow"><h1>Welcome aboard.</h1>{error ? <><Notice error>{error}</Notice><Link className="button" href="/login">Return to sign in</Link></> : <Notice>Finishing your sign-in…</Notice>}</div>;
}
