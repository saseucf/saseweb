"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Notice, usePortal } from "../../components/shared";
export default function ResetPassword() {
  const { client, user } = usePortal(), router = useRouter();
  const [error, setError] = useState(""), [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (!client) return;
    const form = new FormData(e.currentTarget);
    if (form.get("password") !== form.get("confirm")) { setError("Passwords must match."); return; }
    setBusy(true); setError("");
    const { error } = await client.auth.updateUser({ password: String(form.get("password")) });
    if (error) { setError(error.message); setBusy(false); } else router.replace("/dashboard");
  }
  return <div className="page narrow"><p className="eyebrow">A fresh start</p><h1>Set your password.</h1><p>This password also works for your shared SASE account.</p>{error && <Notice error>{error}</Notice>}{!user && <Notice>Open your password reset email first to continue.</Notice>}<form onSubmit={submit}><label>New password<input name="password" type="password" autoComplete="new-password" minLength={12} required /></label><label>Confirm new password<input name="confirm" type="password" autoComplete="new-password" minLength={12} required /></label><button className="button" disabled={busy || !user}>{busy ? "Saving…" : "Save password"}</button></form></div>;
}
