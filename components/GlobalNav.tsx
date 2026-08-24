"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import supabase from "@/lib/auth";

export default function GlobalNav() {
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewAsUser, setViewAsUser] = useState(false);
  const [hash, setHash] = useState("");

  useEffect(() => {
    const updateHash = () => setHash(window.location.hash);
    updateHash();
    window.addEventListener("hashchange", updateHash);
    return () => window.removeEventListener("hashchange", updateHash);
  }, [pathname]);

  // Next.js forces an instant scroll on same-page navigations, which bypasses
  // the CSS scroll-behavior: smooth. When we're already on "/", scroll manually.
  const handleAnchorNav = (e: React.MouseEvent, targetHash: string) => {
    setHash(targetHash);
    if (pathname !== "/") return;
    e.preventDefault();
    if (targetHash) {
      document.querySelector(targetHash)?.scrollIntoView({ behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    window.history.pushState(null, "", targetHash || "/");
  };

  const isAdminLogin = pathname?.includes("/checkin/admin/login");

  useEffect(() => {
    const checkUser = async (userId: string | undefined) => {
      if (!userId) {
        setRole(null);
        setLoading(false);
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();
      setRole(profile?.role ?? "member");
      setLoading(false);
    };

    // getSession() reads from local storage (no network round-trip), unlike
    // getUser() which revalidates against the Auth server every call. Fine
    // for UI display here since actual access control is enforced via RLS.
    supabase.auth.getSession().then(({ data: { session } }) => {
      checkUser(session?.user?.id);
    });

    // React to actual login/logout events instead of re-checking on every
    // route change (this used to depend on [pathname], redoing the whole
    // check and re-showing the loading skeleton on every navigation).
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      checkUser(session?.user?.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  // We don't render on the admin login page to keep it focused
  if (isAdminLogin) return null;

  const isAdmin = role === "admin" && !viewAsUser;
  const isRealAdmin = role === "admin";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-[#171d52] shadow-md border-b border-[#26355f]">
      <Link href="/" className="flex items-center" aria-label="SASE home">
        <Image
          src="/UCF SASE LOGO 26-27.png"
          alt="UCF SASE"
          width={150}
          height={63}
          priority
          className="h-auto w-[120px] md:w-[150px]"
        />
      </Link>
      
      <div className="flex items-center gap-4 md:gap-6">
        {loading ? (
           <div className="w-16 h-4 bg-[#26355f] animate-pulse rounded"></div>
        ) : isAdmin ? (
          <>
            <NavLink href="/" active={pathname === "/"}>Home</NavLink>
            <NavLink href="/admin/events" active={!!pathname?.includes('/admin/events')}>Manage Events</NavLink>
            <NavLink href="/forms/admin" active={!!pathname?.includes('/forms/admin')}>Manage Forms</NavLink>
            <NavLink href="/checkin/admin" active={!!pathname?.includes('/checkin/admin')}>Check-in Admin</NavLink>
          </>
        ) : (
          <>
            <NavLink href="/" active={pathname === "/" && !hash} onClick={(e) => handleAnchorNav(e, "")}>Home</NavLink>
            <NavLink href="/about" active={!!pathname?.includes('/about')}>About</NavLink>
            <NavLink href="/events" active={!!pathname?.includes('/events')}>Events</NavLink>
            <NavLink href="/programs" active={!!pathname?.includes('/programs')}>Programs</NavLink>
            <SocialsDropdown />
            <NavLink href="/leaderboard" active={!!pathname?.includes('/leaderboard')}>Leaderboard</NavLink>
            <NavLink href="/forms" active={!!pathname?.includes('/forms') && !pathname?.includes('/admin')}>Forms</NavLink>
            <NavLink href="/checkin" active={!!pathname?.includes('/checkin') && !pathname?.includes('/admin')}>Check-in</NavLink>
          </>
        )}
        
        {!role && !loading && (
          <Link className="border border-[#8eafe3] rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#fffde9] hover:bg-[#fffde9] hover:text-[#171d52] transition-colors" href="/login">Log in</Link>
        )}
        {role && !loading && (
          <div className="flex items-center gap-3">
            {isRealAdmin && (
              <button 
                onClick={() => setViewAsUser(!viewAsUser)}
                className={`text-[0.65rem] md:text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border transition-colors ${
                  viewAsUser 
                  ? "bg-[#fffde9] text-[#171d52] border-[#fffde9]" 
                  : "text-[#8eafe3] border-[#26355f] hover:border-[#8eafe3]"
                }`}
              >
                {viewAsUser ? "Admin View" : "View as User"}
              </button>
            )}
            <button 
              onClick={async () => { await supabase.auth.signOut(); window.location.reload(); }}
              className="border border-[#8eafe3] rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#fffde9] hover:bg-red-500 hover:border-red-500 transition-colors"
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

function NavLink({ href, active, onClick, children }: { href: string; active: boolean; onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void; children: React.ReactNode }) {
  return (
    <Link
      className={`text-[0.65rem] md:text-xs font-bold tracking-widest uppercase transition-colors whitespace-nowrap ${
        active ? "text-[#89abe3]" : "text-[#e9e8e8] hover:text-[#89abe3]"
      }`}
      href={href}
      onClick={onClick}
    >
      {children}
    </Link>
  );
}

function SocialsDropdown() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        className="text-[0.65rem] md:text-xs font-bold tracking-widest uppercase transition-colors text-[#fffde9] hover:text-[#8eafe3] flex items-center gap-1"
        aria-haspopup="true"
        aria-expanded={open}
      >
        Socials
        <svg className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-[#171d52] border border-[#26355f] rounded-lg shadow-xl overflow-hidden z-50">
          <SocialLink href="https://www.instagram.com/saseucf/" icon="instagram" label="Instagram" />
          <SocialLink href="https://www.linkedin.com/company/ucf-sase/" icon="linkedin" label="LinkedIn" />
          <SocialLink href="https://discord.gg/PK8e6KwAQS" icon="discord" label="Discord" />
          <SocialLink href="https://knightconnect.campuslabs.com/engage/organization/saseucf" icon="knightconnect" label="KnightConnect" />
        </div>
      )}
    </div>
  );
}

function SocialLink({ href, icon, label }: { href: string; icon: string; label: string }) {
  const icons: Record<string, React.ReactNode> = {
    instagram: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
    ),
    linkedin: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 10.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
    ),
    discord: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.102 18.079.114 18.1.13 18.11a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
    ),
    knightconnect: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/></svg>
    ),
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 px-4 py-3 text-[#fffde9] hover:bg-[#26355f] hover:text-[#8eafe3] transition-colors text-xs font-semibold tracking-wide"
    >
      {icons[icon]}
      {label}
    </a>
  );
}
