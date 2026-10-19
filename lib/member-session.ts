"use client";
import type { User } from "@supabase/supabase-js";
import supabase from "@/lib/auth";
import { parseJoinProfile, profileIsComplete } from "@/lib/unified-auth";

export async function memberDestination(user: User, destination: string) {
  const { data: profile, error } = await supabase.from("profiles").select("first_name, last_name, major, year, school, name_confirmed").eq("id", user.id).maybeSingle();
  if (error) throw new Error("Your profile could not be loaded. Please try again.");
  if (!profileIsComplete(profile) && user.user_metadata?.signup_profile_complete === true) {
    // Signup collects these fields before Auth creates the account. Finish the
    // profile only after obtaining a real session, including email verification.
    const details = parseJoinProfile(user.user_metadata);
    const { error: saveError } = await supabase.from("profiles").upsert({ id: user.id, email: user.email, ...details, name_confirmed: true }, { onConflict: "id" });
    if (saveError) throw new Error("Your account is ready, but your profile could not be saved. Please try again.");
    return destination;
  }
  return profileIsComplete(profile) ? destination : `/confirm-name?redirect=${encodeURIComponent(destination)}`;
}

export async function sendMemberWelcome(user: User) {
  const recentlyCreated = Date.now() - Date.parse(user.created_at) < 10 * 60 * 1000;
  if (!user.email || user.user_metadata?.welcome_email_sent === true || (!recentlyCreated && user.user_metadata?.signup_profile_complete !== true)) return;
  try {
    const response = await fetch("/api/email", {
      method: "POST", headers: { "Content-Type": "application/json" }, signal: AbortSignal.timeout(10000),
      body: JSON.stringify({ type: "welcome", email: user.email, firstName: user.user_metadata?.first_name || user.user_metadata?.given_name || "" }),
    });
    if (response.ok) await supabase.auth.updateUser({ data: { welcome_email_sent: true } });
  } catch { /* Email failure must not invalidate a successful login. */ }
}

export function announceMemberSession(user: User) {
  try { localStorage.setItem("sase:auth", JSON.stringify(user)); } catch { /* Storage may be disabled. */ }
  window.dispatchEvent(new CustomEvent("sase:auth", { detail: { user } }));
}
