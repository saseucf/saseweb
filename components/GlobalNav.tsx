"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Sun, Moon, Menu, X } from "lucide-react";
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const updateHash = () => setHash(window.location.hash);
    updateHash();
    window.addEventListener("hashchange", updateHash);
    return () => window.removeEventListener("hashchange", updateHash);
  }, [pathname]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname, hash]);

  const handleAnchorNav = (e: React.MouseEvent, targetHash: string) => {
    setHash(targetHash);
    setIsMobileMenuOpen(false);
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

  const renderLinks = (isMobile = false) => {
    if (loading) {
      return <div className="w-16 h-4 bg-muted animate-pulse rounded"></div>;
    }

    const NavItem = ({ href, active, onClick, children }: { href: string; active: boolean; onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void; children: React.ReactNode }) => (
      <Link
        className={`${isMobile ? 'text-sm py-3 border-b border-border w-full block' : 'text-xs whitespace-nowrap'} font-bold tracking-widest uppercase transition-colors ${active ? "text-[#4266a4] dark:text-[#89abe3]" : "text-foreground hover:text-[#4266a4] dark:hover:text-[#89abe3]"}`}
        href={href}
        onClick={(e) => {
          if (onClick) onClick(e);
          else setIsMobileMenuOpen(false);
        }}
      >
        {children}
      </Link>
    );

    if (isAdmin) {
      return (
        <>
          <NavItem href="/" active={pathname === "/"}>Home</NavItem>
          <NavItem href="/admin/users" active={!!pathname?.includes('/admin/users')}>Manage Users</NavItem>
          <NavItem href="/admin/logs" active={!!pathname?.includes('/admin/logs')}>Master Logs</NavItem>
          <NavItem href="/admin/events" active={!!pathname?.includes('/admin/events')}>Manage Events</NavItem>
          <NavItem href="/admin/membership" active={!!pathname?.includes('/admin/membership')}>Membership</NavItem>
          <NavItem href="/forms/admin" active={!!pathname?.includes('/forms/admin')}>Manage Forms</NavItem>
          <NavItem href="/admin/demographics" active={!!pathname?.includes('/admin/demographics')}>Demographics</NavItem>
          <NavItem href="/checkin/admin" active={!!pathname?.includes('/checkin/admin')}>Check-in Admin</NavItem>
        </>
      );
    }

    return (
      <>
        <NavItem href="/" active={pathname === "/" && !hash} onClick={(e) => handleAnchorNav(e, "")}>Home</NavItem>
        <NavItem href="/about" active={!!pathname?.includes('/about')}>About</NavItem>
        <NavItem href="/events" active={!!pathname?.includes('/events')}>Events</NavItem>
        <NavItem href="/programs" active={!!pathname?.includes('/programs')}>Programs</NavItem>
        <NavItem href="/team" active={!!pathname?.includes('/team')}>Team</NavItem>
        <NavItem href="/membership" active={!!pathname?.startsWith('/membership')}>Membership</NavItem>
      </>
    );
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-background shadow-md border-b border-border">
      
      <Link href="/" className="flex items-center" aria-label="SASE home" onClick={() => setIsMobileMenuOpen(false)}>
        <Image 
          src="/logo-white-horizontal.png" 
          alt="SASE Logo" 
          width={120} 
          height={26}
          className="w-[90px] md:w-[120px] h-auto object-contain hidden dark:block"
          style={{ height: "auto" }}
          priority
        />
        <Image 
          src="/logo-dark-horizontal.png" 
          alt="SASE Logo" 
          width={120} 
          height={26}
          className="w-[90px] md:w-[120px] h-auto object-contain block dark:hidden"
          style={{ height: "auto" }}
          priority
        />
      </Link>

      {/* Desktop Links */}
      <div className="hidden lg:flex flex-1 items-center gap-4 xl:gap-6 mx-8 justify-end">
        {renderLinks()}
      </div>

      {/* Fixed Actions: Theme Toggle & Auth & Mobile Menu Toggle */}
      <div className="flex items-center gap-3 shrink-0 ml-auto md:ml-0">


        {!role && !loading && (
          <Link className="border border-border rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider text-foreground hover:bg-foreground hover:text-background transition-colors hidden sm:block" href="/login">Log in</Link>
        )}
        
        {role && !loading && (
          <div className="hidden sm:flex items-center gap-3">
            {isRealAdmin && (
              <button
                onClick={() => setViewAsUser(!viewAsUser)}
                className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border transition-colors ${viewAsUser
                    ? "bg-foreground text-background border-foreground"
                    : "text-[#4266a4] dark:text-[#89abe3] border-border hover:border-[#4266a4] dark:hover:border-[#89abe3]"
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

        {/* Mobile member action */}
        <Link 
          href={isAdmin ? "/checkin/admin" : "/membership"}
          className="lg:hidden bg-[#89abe3] text-[#141b4d] px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider hover:bg-foreground hover:text-background transition-colors mr-1 flex items-center"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          {isAdmin ? "Check-in" : "Membership"}
        </Link>

        {/* Mobile Hamburger Toggle */}
        <button 
          className="lg:hidden p-2 text-foreground hover:text-[#4266a4] dark:hover:text-[#89abe3] transition-colors"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle Menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {isMobileMenuOpen && (
        <div className="absolute top-[100%] left-0 right-0 bg-background border-b border-border shadow-lg lg:hidden flex flex-col p-6 animate-in slide-in-from-top-2">
          {renderLinks(true)}
          
          <div className="mt-6 flex flex-col gap-4 sm:hidden">
            {!role && !loading && (
              <Link className="w-full text-center border border-border rounded-lg px-4 py-3 text-sm font-bold uppercase tracking-wider text-foreground hover:bg-foreground hover:text-background transition-colors" href="/login" onClick={() => setIsMobileMenuOpen(false)}>Log in</Link>
            )}
            {role && !loading && (
              <>
                {isRealAdmin && (
                  <button
                    onClick={() => { setViewAsUser(!viewAsUser); setIsMobileMenuOpen(false); }}
                    className={`w-full text-center text-[10px] font-bold uppercase tracking-widest px-4 py-3 rounded-lg border transition-colors ${viewAsUser
                        ? "bg-foreground text-background border-foreground"
                        : "text-[#4266a4] dark:text-[#89abe3] border-border hover:border-[#4266a4] dark:hover:border-[#89abe3]"
                      }`}
                  >
                    {viewAsUser ? "Admin View" : "View as User"}
                  </button>
                )}
                <button
                  onClick={async () => { await supabase.auth.signOut(); window.location.reload(); }}
                  className="w-full text-center border border-red-500 rounded-lg px-4 py-3 text-sm font-bold uppercase tracking-wider text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                >
                  Log out
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
