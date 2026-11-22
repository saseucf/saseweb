"use client";
import Link from "next/link";
import { createContext, useContext, useEffect, useState } from "react";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createHackathonClient } from "../../../lib/hackathon/client";
import { hackathonApi } from "../../../lib/hackathon/api";
import { countdown, type Hackathon, type Landing, webUrl } from "../../../lib/hackathon/portal";
import confirmedDetails from "../event-details.json";

type Portal = { client: SupabaseClient | null; ready: boolean; publicDetails: typeof confirmedDetails; user: User | null; authenticating: boolean; landing: Landing | null; loading: boolean; refresh: () => Promise<void> };
const Context = createContext<Portal | null>(null);
export function usePortal() { const value = useContext(Context); if (!value) throw new Error("Portal context missing"); return value; }
export function PortalProvider({ children }: { children: React.ReactNode }) {
  const [client, setClient] = useState<SupabaseClient | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authenticating, setAuthenticating] = useState(true);
  const [landing, setLanding] = useState<Landing | null>(null);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [publicDetails, setPublicDetails] = useState(confirmedDetails);
  useEffect(() => {
    let c: SupabaseClient;
    try { c = createHackathonClient(); setClient(c); }
    catch { setLoading(false); setAuthenticating(false); return; }
    let active = true;
    const { data: { subscription } } = c.auth.onAuthStateChange((_event, session) => { if (active) { setUser(session?.user ?? null); setAuthenticating(false); } });
    void c.auth.getUser().then(({ data }) => { if (active) { setUser(data.user); setAuthenticating(false); } });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);
  async function refresh() {
    if (!client) return;
    const { data: configuration } = await client.schema("hackathon").from("portal_configuration").select("account_isolation_ready,public_details").eq("id",true).maybeSingle();
    setReady(configuration?.account_isolation_ready === true);
    if (configuration?.public_details) setPublicDetails({ ...confirmedDetails, ...configuration.public_details });
    try { setLanding(await hackathonApi(client).landing(process.env.NEXT_PUBLIC_HACKATHON_SLUG || "lumahacks") as Landing); }
    catch { setLanding(null); }
    finally { setLoading(false); }
  }
  useEffect(() => { if (client) void refresh(); /* event content refreshes on dashboard polling too */ }, [client, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  return <Context.Provider value={{ client, ready, publicDetails, user, authenticating, landing, loading, refresh }}>{children}</Context.Provider>;
}
export function PortalShell({ children }: { children: React.ReactNode }) {
  const { user, client, landing, publicDetails } = usePortal();
  return <><a href="#main" className="skip">Skip to content</a><header className="nav"><Link className="brand" href="/"><span className="brand-mark" aria-hidden="true">✳</span>{landing?.event.name || "LumaHacks"}</Link><nav aria-label="Main"><Link href="/#tracks">Tracks</Link><Link href="/#faq">FAQ</Link><Link href="/dashboard">Hacker hub</Link>{user ? <button className="text-button" onClick={() => { void client?.auth.signOut(); }}>Sign out</button> : <Link className="button small" href="/login">Sign in</Link>}</nav></header><main id="main">{children}</main><footer><Link className="brand" href="/">LumaHacks<span aria-hidden="true">✳</span></Link><p>A space for curious minds and bright ideas.</p><div><Link href="/organizer">Organizer access</Link>{(landing?.event.contact_email || publicDetails.contact_email) && <a href={`mailto:${landing?.event.contact_email || publicDetails.contact_email}`}>Contact the team</a>}</div></footer></>;
}
export function External({ href, children, className }: { href: string | null | undefined; children: React.ReactNode; className?: string }) {
  const safe = webUrl(href);
  return safe ? <a href={safe} target="_blank" rel="noreferrer" className={className}>{children}</a> : null;
}
export function Notice({ children, error = false }: { children: React.ReactNode; error?: boolean }) {
  return <p className={`notice ${error ? "error" : ""}`} role={error ? "alert" : "status"}>{children}</p>;
}
export function Gate({ children }: { children: React.ReactNode }) {
  const { user, authenticating, loading, landing } = usePortal();
  if (authenticating || loading) return <div className="page"><Notice>Loading your portal…</Notice></div>;
  if (!user) return <div className="page narrow"><p className="eyebrow">Your next chapter</p><h1>Welcome aboard.</h1><p>Sign in to manage your application and get ready to build.</p><Link className="button" href="/login">Sign in or create an account</Link></div>;
  if (!landing) return <div className="page narrow"><h1>Getting ready for you.</h1><Notice>Event details aren’t available yet. Please check back soon.</Notice></div>;
  // Remount private views on account changes to discard the prior user's data.
  return <div key={user.id}>{children}</div>;
}
export function Clock({ event }: { event: Hackathon }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => { setNow(Date.now()); const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  const clock = countdown(event, now ?? Date.parse(event.hacking_starts_at));
  return <div className="clock"><p>{now === null ? "The countdown to your next idea" : clock.label}</p><strong suppressHydrationWarning>{now === null ? "—" : clock.value}</strong><span>{event.timezone}</span></div>;
}
