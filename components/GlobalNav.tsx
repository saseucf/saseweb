"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import supabase from "@/lib/auth";

export default function GlobalNav() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewAsUser, setViewAsUser] = useState(false);
  const [hash, setHash] = useState("");

  useEffect(() => {
    setMounted(true);
    const updateHash = () => setHash(window.location.hash);
    updateHash();
    window.addEventListener("hashchange", updateHash);
    return () => window.removeEventListener("hashchange", updateHash);
  }, [pathname]);

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

    supabase.auth.getSession().then(({ data: { session } }) => {
      checkUser(session?.user?.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      checkUser(session?.user?.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isAdminLogin) return null;

  const isAdmin = role === "admin" && !viewAsUser;
  const isRealAdmin = role === "admin";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-background shadow-md border-b border-border">
      <Link href="/" className="flex items-center" aria-label="SASE home">
        <Image 
          src="/logo-white-horizontal.png" 
          alt="SASE Logo" 
          width={120} 
          height={40} 
          className="w-[90px] md:w-[120px] h-auto object-contain hidden dark:block"
          priority
        />
        <Image 
          src="/logo-dark-horizontal.png" 
          alt="SASE Logo" 
          width={120} 
          height={40} 
          className="w-[90px] md:w-[120px] h-auto object-contain block dark:hidden"
          priority
        />
      </Link>

      {/* Scrollable Links */}
      <div className="flex-1 flex items-center gap-4 md:gap-6 overflow-x-auto no-scrollbar py-2 mx-4 justify-end">
        {loading ? (
          <div className="w-16 h-4 bg-muted animate-pulse rounded"></div>
        ) : isAdmin ? (
          <>
            <NavLink href="/" active={pathname === "/"}>Home</NavLink>
            <NavLink href="/admin/events" active={!!pathname?.includes('/admin/events')}>Manage Events</NavLink>
            <NavLink href="/forms/admin" active={!!pathname?.includes('/forms/admin')}>Manage Forms</NavLink>
            <NavLink href="/admin/demographics" active={!!pathname?.includes('/admin/demographics')}>Demographics</NavLink>
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
      </div>

      {/* Fixed Actions: Theme Toggle & Auth */}
      <div className="flex items-center gap-3 shrink-0">
        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 text-foreground hover:text-[#89abe3] transition-colors"
            aria-label="Toggle Dark Mode"
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        )}

        {!role && !loading && (
          <Link className="border border-border rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider text-foreground hover:bg-foreground hover:text-background transition-colors" href="/login">Log in</Link>
        )}
        
        {role && !loading && (
          <div className="flex items-center gap-3">
            {isRealAdmin && (
              <button
                onClick={() => setViewAsUser(!viewAsUser)}
                className={`text-[0.65rem] md:text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border transition-colors ${viewAsUser
                    ? "bg-foreground text-background border-foreground"
                    : "text-[#89abe3] border-border hover:border-[#89abe3]"
                  }`}
              >
                {viewAsUser ? "Admin View" : "View as User"}
              </button>
            )}
            <button
              onClick={async () => { await supabase.auth.signOut(); window.location.reload(); }}
              className="border border-red-500 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider text-red-500 hover:bg-red-500 hover:text-white transition-colors"
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
      className={`text-[0.65rem] md:text-xs font-bold tracking-widest uppercase transition-colors whitespace-nowrap ${active ? "text-[#89abe3]" : "text-foreground hover:text-[#89abe3]"
        }`}
      href={href}
      onClick={onClick}
    >
      {children}
    </Link>
  );
}

