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
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-[#141b4d] shadow-md border-b border-[#26355f]">
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
      
      <div className="flex items-center gap-4 md:gap-6 overflow-x-auto no-scrollbar py-2">
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
            <NavLink href="/team" active={!!pathname?.includes('/team')}>Team</NavLink>
            <NavLink href="/forms" active={!!pathname?.includes('/forms') && !pathname?.includes('/admin')}>Forms</NavLink>
            <NavLink href="/checkin" active={!!pathname?.includes('/checkin') && !pathname?.includes('/admin')}>Check-in</NavLink>
          </>
        )}
        
        {!role && !loading && (
          <Link className="border border-[#89abe3] rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#e9e8e8] hover:bg-[#e9e8e8] hover:text-[#141b4d] transition-colors" href="/login">Log in</Link>
        )}
        {role && !loading && (
          <div className="flex items-center gap-3">
            {isRealAdmin && (
              <button 
                onClick={() => setViewAsUser(!viewAsUser)}
                className={`text-[0.65rem] md:text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border transition-colors ${
                  viewAsUser 
                  ? "bg-[#e9e8e8] text-[#141b4d] border-[#e9e8e8]" 
                  : "text-[#89abe3] border-[#26355f] hover:border-[#89abe3]"
                }`}
              >
                {viewAsUser ? "Admin View" : "View as User"}
              </button>
            )}
            <button 
              onClick={async () => { await supabase.auth.signOut(); window.location.reload(); }}
              className="border border-[#89abe3] rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#e9e8e8] hover:bg-red-500 hover:border-red-500 transition-colors"
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

