"use client";

import { useEffect, useState } from "react";
import supabase from "@/lib/auth";
import { createProfileRoleTracker, type ProfileRoleState } from "@/lib/profile-role-state";

export function useProfileRole(refreshKey?: string | null) {
  const [state, setState] = useState<ProfileRoleState>({ userId: null, role: null, loading: true });
  useEffect(() => {
    let active = true;
    let observedAuthEvent = false;
    const tracker = createProfileRoleTracker(async userId => {
      // Supabase auth callbacks run under an auth lock. Defer additional Auth
      // calls until the callback returns to avoid waiting on that same lock.
      await new Promise(resolve => setTimeout(resolve, 0));
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || user?.id !== userId) return null;
      const { data, error } = await supabase.from("profiles").select("role").eq("id", userId).single();
      return !error && typeof data?.role === "string" ? data.role : null;
    }, next => { if (active) setState(next); });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      observedAuthEvent = true;
      void tracker.setUser(session?.user.id ?? null);
    });
    // An older initial-session result cannot replace a newer auth event.
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (active && !observedAuthEvent) void tracker.setUser(session?.user.id ?? null);
    }).catch(() => {
      if (active && !observedAuthEvent) void tracker.setUser(null);
    });
    return () => { active = false; tracker.dispose(); subscription.unsubscribe(); };
  }, [refreshKey]);
  return state;
}
